import Foundation
import CryptoKit

// Nonlocal Coherence — the parallel extension of the sequential HDAR proof.
//
// Sequential HDAR proves: E1 -> (one host) -> E2, verified.
// This proves the PARALLEL primitive: E1 fans out to N in-process shards, each
// signs its partial with an ephemeral Ed25519 key, and a quorum merge produces
// E2 plus a coherence proof that the distributed result equals what a single
// ("monolithic") pass would have produced.
//
// HONEST CLAIM BOUNDARY (deliberately, in the spirit of hdar TRUST_BOUNDARY.md):
//   - The payload here is a DETERMINISTIC map-reduce over the workspace, not a
//     language model. This demonstrates the verifiable split->merge protocol;
//     wiring a real sharded model as the payload is the roadmap.
//   - Shards run in-process, so this is a coherence PoC, not a trustless
//     distributed system. The coordinator recomputes the monolithic reference;
//     a genuinely trustless merge (coordinator never recomputes) is future work.
//   - "Coherence" is a verifiable invariant (distributed == monolithic under a
//     signed quorum). It is NOT a physics claim.

private let PRIME: UInt64 = 2_305_843_009_213_693_951  // 2^61 - 1 (Mersenne)

private func addmod(_ a: UInt64, _ b: UInt64) -> UInt64 {
    ((a % PRIME) + (b % PRIME)) % PRIME
}

/// Deterministic per-file value: first 64 bits of the file's SHA-256, mod PRIME.
private func value(forHashHex hex: String) -> UInt64 {
    (UInt64(hex.prefix(16), radix: 16) ?? 0) % PRIME
}

/// One shard's signed partial result.
public struct ShardResult {
    public let index: Int
    public let fileCount: Int
    public let publicKeyHex: String
    public let partial: UInt64
    public let signatureHex: String
    public let signatureValid: Bool
}

/// The outcome of a coherence run.
public struct CoherenceProof {
    public let shards: Int
    public let quorum: Int
    public let validSignatures: Int
    public let monolithic: UInt64
    public let merged: UInt64
    public let resultsEqual: Bool
    public let coherent: Bool
    public let shardResults: [ShardResult]
    public let e2ManifestHash: String
    public let e1ManifestHash: String

    public func toDict() -> [String: Any] {
        [
            "schema": "hdar.coherence-proof/v0.1",
            "shards": shards,
            "quorum": quorum,
            "valid_signatures": validSignatures,
            "monolithic_result": String(monolithic),
            "merged_result": String(merged),
            "results_equal": resultsEqual,
            "coherent": coherent,
            "e1_manifest_hash": e1ManifestHash,
            "e2_manifest_hash": e2ManifestHash,
            "shard_results": shardResults.map { r in
                [
                    "index": r.index,
                    "file_count": r.fileCount,
                    "public_key": r.publicKeyHex,
                    "partial": String(r.partial),
                    "signature": r.signatureHex,
                    "signature_valid": r.signatureValid,
                ] as [String: Any]
            },
        ]
    }
}

public enum Coherence {

    /// Run the fan-out over a sealed E1 capsule.
    /// - Parameters:
    ///   - shards: number of micro-entities to split the task across (>= 1).
    ///   - quorum: minimum valid signatures required to certify coherence.
    ///   - faultyShards: for demonstration, corrupt this many shard partials so
    ///     you can watch the proof correctly refuse to certify.
    public static func run(
        capsuleDir: URL,
        owner: OwnerKey,
        shards: Int,
        quorum: Int,
        out: URL,
        faultyShards: Int = 0
    ) throws -> CoherenceProof {

        precondition(shards >= 1 && quorum >= 1 && quorum <= shards)

        // 0. The input capsule must verify before we build on it.
        let inChecks = try Capsule.verify(dir: capsuleDir)
        guard inChecks.allSatisfy({ $0.ok }) else {
            throw HDARError.verification("input capsule E1 failed verification")
        }

        let manifest = try Capsule.loadManifest(capsuleDir)
        let e1Hash = manifest["manifest_hash"] as? String ?? ""
        let ws = manifest["workspace_manifest"] as? [String: Any] ?? [:]
        let files = ws["files"] as? [[String: Any]] ?? []
        let hashes = files.map { $0["sha256"] as? String ?? "" }

        // 1. Monolithic reference: the whole task in a single pass.
        var monolithic: UInt64 = 0
        for h in hashes { monolithic = addmod(monolithic, value(forHashHex: h)) }

        // 2. Partition file indices round-robin across shards.
        var partitions = Array(repeating: [String](), count: shards)
        for (i, h) in hashes.enumerated() { partitions[i % shards].append(h) }

        // 3. Each shard computes its partial and signs (index:partial) with a
        //    fresh ephemeral Ed25519 key.
        var results: [ShardResult] = []
        var merged: UInt64 = 0
        for idx in 0..<shards {
            var partial: UInt64 = 0
            for h in partitions[idx] { partial = addmod(partial, value(forHashHex: h)) }
            if idx < faultyShards { partial = addmod(partial, 1) }  // injected fault

            let key = Curve25519.Signing.PrivateKey()
            let msg = Data("\(idx):\(partial)".utf8)
            let sig = try key.signature(for: msg)
            let pubHex = key.publicKey.rawRepresentation.hexString
            let valid = key.publicKey.isValidSignature(sig, for: msg)

            results.append(ShardResult(
                index: idx, fileCount: partitions[idx].count, publicKeyHex: pubHex,
                partial: partial, signatureHex: sig.hexString, signatureValid: valid))
            merged = addmod(merged, partial)
        }

        let validSigs = results.filter { $0.signatureValid }.count
        let equal = (merged == monolithic)
        let coherent = equal && (validSigs >= quorum)

        // 4. Advance state: restore E1, drop in the coherence result, seal E2.
        let fm = FileManager.default
        let e2Workspace = out.appendingPathComponent("workspace_e2", isDirectory: true)
        if fm.fileExists(atPath: e2Workspace.path) {
            try fm.removeItem(at: e2Workspace)
        }
        try Capsule.restore(capsuleDir: capsuleDir, into: e2Workspace)

        let resultDict: [String: Any] = [
            "task": "coherence_map_reduce_v0.1",
            "shards": shards,
            "quorum": quorum,
            "monolithic_result": String(monolithic),
            "merged_result": String(merged),
            "coherent": coherent,
        ]
        try prettyJSON(resultDict).write(
            to: e2Workspace.appendingPathComponent("coherence_result.json"), options: [.atomic])

        let e2Dir = out.appendingPathComponent("capsule_epoch_2", isDirectory: true)
        if fm.fileExists(atPath: e2Dir.path) { try fm.removeItem(at: e2Dir) }
        let e2 = try Capsule.seal(
            workspace: e2Workspace, owner: owner,
            agentId: manifest["agent_id"] as? String ?? "hdar-desktop-agent",
            epoch: (manifest["epoch"] as? Int ?? 1) + 1,
            out: e2Dir, parentManifestHash: e1Hash,
            event: "capsule_sealed_after_coherence_merge")

        let proof = CoherenceProof(
            shards: shards, quorum: quorum, validSignatures: validSigs,
            monolithic: monolithic, merged: merged, resultsEqual: equal,
            coherent: coherent, shardResults: results,
            e2ManifestHash: e2.manifestHash, e1ManifestHash: e1Hash)

        try prettyJSON(proof.toDict()).write(
            to: out.appendingPathComponent("coherence_proof.json"), options: [.atomic])

        return proof
    }
}
