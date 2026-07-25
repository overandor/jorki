import Foundation

// Protocol constants for the desktop capsule format.
public enum HDAR {
    public static let capsuleSchema = "hdar.desktop-capsule/v0.1"
    public static let receiptSchema = "hdar.receipt/v0.1"
}

/// A single verifier check with a pass/fail flag and a human-readable reason.
public struct Check {
    public let name: String
    public let ok: Bool
    public let detail: String
    public init(_ name: String, _ ok: Bool, _ detail: String) {
        self.name = name; self.ok = ok; self.detail = detail
    }
}

/// Summary of a freshly sealed capsule.
public struct SealResult {
    public let dir: URL
    public let epoch: Int
    public let manifestHash: String
    public let rootHash: String
    public let fileCount: Int
    public let totalSize: Int
}

public enum Capsule {

    // MARK: - Workspace manifest (content-addressed blocks)

    /// Walk `root`, write each regular file to `blocksDir` as a content-addressed
    /// block, and return the workspace manifest dictionary plus its root hash.
    static func buildWorkspace(root: URL, blocksDir: URL) throws
        -> (manifest: [String: Any], rootHash: String, fileCount: Int, totalSize: Int) {

        let fm = FileManager.default
        let rootPath = root.standardizedFileURL.path
        let keys: [URLResourceKey] = [.isRegularFileKey]
        guard let en = fm.enumerator(at: root, includingPropertiesForKeys: keys) else {
            throw HDARError.io("cannot enumerate \(rootPath)")
        }

        var files: [[String: Any]] = []
        var pathHashes: [String: String] = [:]   // rel_path -> sha256, for root hash
        var totalSize = 0

        for case let url as URL in en {
            let vals = try url.resourceValues(forKeys: Set(keys))
            guard vals.isRegularFile == true else { continue }

            let full = url.standardizedFileURL.path
            guard full.hasPrefix(rootPath + "/") else { continue }
            let rel = String(full.dropFirst(rootPath.count + 1))

            let data = try Data(contentsOf: url)
            let hex = sha256Hex(data)
            let attrs = try? fm.attributesOfItem(atPath: full)
            let mode = (attrs?[.posixPermissions] as? NSNumber)?.intValue ?? 0o644

            // Write the content-addressed block: blocks/<hh>/<hash>.
            let shard = blocksDir.appendingPathComponent(String(hex.prefix(2)), isDirectory: true)
            try fm.createDirectory(at: shard, withIntermediateDirectories: true)
            let blockURL = shard.appendingPathComponent(hex)
            if !fm.fileExists(atPath: blockURL.path) {
                try data.write(to: blockURL, options: [.atomic])
            }

            files.append([
                "rel_path": rel,
                "sha256": hex,
                "size": data.count,
                "mode": mode,
            ])
            pathHashes[rel] = hex
            totalSize += data.count
        }

        files.sort { ($0["rel_path"] as! String) < ($1["rel_path"] as! String) }
        let rootHash = try canonicalHashHex(pathHashes)

        let manifest: [String: Any] = [
            "files": files,
            "root_hash": rootHash,
            "total_size": totalSize,
        ]
        return (manifest, rootHash, files.count, totalSize)
    }

    // MARK: - Seal

    /// Seal `workspace` into a signed capsule directory at `out`.
    /// When `parentManifestHash` is provided, the manifest records lineage.
    @discardableResult
    public static func seal(
        workspace: URL,
        owner: OwnerKey,
        agentId: String,
        epoch: Int,
        out: URL,
        parentManifestHash: String? = nil,
        event: String = "capsule_sealed"
    ) throws -> SealResult {

        let fm = FileManager.default
        try fm.createDirectory(at: out, withIntermediateDirectories: true)
        let blocksDir = out.appendingPathComponent("blocks", isDirectory: true)
        try fm.createDirectory(at: blocksDir, withIntermediateDirectories: true)

        let ws = try buildWorkspace(root: workspace, blocksDir: blocksDir)

        // Manifest body (everything except manifest_hash + owner_signature).
        var manifest: [String: Any] = [
            "schema": HDAR.capsuleSchema,
            "agent_id": agentId,
            "epoch": epoch,
            "created_at_ms": Int(Date().timeIntervalSince1970 * 1000),
            "file_count": ws.fileCount,
            "owner_public_key": owner.publicKeyHex,
            "workspace_manifest": ws.manifest,
        ]
        if let parent = parentManifestHash {
            manifest["parent_manifest_hash"] = parent
        }

        // manifest_hash = SHA-256 over canonical JSON of the body.
        let manifestHash = try canonicalHashHex(manifest)
        // Owner signs the raw 32-byte digest.
        let sig = try owner.sign(sha256Digest(try canonicalData(manifest)))

        manifest["manifest_hash"] = manifestHash
        manifest["owner_signature"] = sig.hexString
        manifest["owner_signature_algorithm"] = "ed25519"

        try prettyJSON(manifest).write(
            to: out.appendingPathComponent("manifest.json"), options: [.atomic])

        // Receipt (hash-linked, internally consistent).
        var receipt: [String: Any] = [
            "schema": HDAR.receiptSchema,
            "event": event,
            "epoch": epoch,
            "agent_id": agentId,
            "manifest_hash": manifestHash,
            "workspace_root_hash": ws.rootHash,
            "sealed_at_ms": Int(Date().timeIntervalSince1970 * 1000),
        ]
        receipt["receipt_hash"] = try canonicalHashHex(receipt)
        try prettyJSON(receipt).write(
            to: out.appendingPathComponent("receipt.json"), options: [.atomic])

        return SealResult(dir: out, epoch: epoch, manifestHash: manifestHash,
                          rootHash: ws.rootHash, fileCount: ws.fileCount, totalSize: ws.totalSize)
    }

    // MARK: - Load helpers

    public static func loadManifest(_ dir: URL) throws -> [String: Any] {
        let data = try Data(contentsOf: dir.appendingPathComponent("manifest.json"))
        guard let m = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw HDARError.format("manifest.json is not a JSON object")
        }
        return m
    }

    static func manifestBody(_ manifest: [String: Any]) -> [String: Any] {
        var body = manifest
        body.removeValue(forKey: "manifest_hash")
        body.removeValue(forKey: "owner_signature")
        body.removeValue(forKey: "owner_signature_algorithm")
        return body
    }

    // MARK: - Verify

    /// Independently verify a capsule directory. Returns one Check per predicate.
    public static func verify(dir: URL) throws -> [Check] {
        var checks: [Check] = []
        let manifest = try loadManifest(dir)

        // 1. manifest_hash recomputes.
        let body = manifestBody(manifest)
        let recomputed = try canonicalHashHex(body)
        let storedHash = manifest["manifest_hash"] as? String ?? ""
        checks.append(Check("manifest_hash", recomputed == storedHash,
            recomputed == storedHash ? "canonical manifest hash matches"
                                     : "expected \(recomputed), stored \(storedHash)"))

        // 2. owner Ed25519 signature over the manifest digest.
        let pub = manifest["owner_public_key"] as? String ?? ""
        let sigHex = manifest["owner_signature"] as? String ?? ""
        if let sig = Data(hexString: sigHex) {
            let digest = sha256Digest(try canonicalData(body))
            let ok = verifyEd25519(publicKeyHex: pub, signature: sig, message: digest)
            checks.append(Check("owner_signature", ok,
                ok ? "Ed25519 owner signature verified" : "signature does not verify"))
        } else {
            checks.append(Check("owner_signature", false, "missing/malformed signature"))
        }

        // 3. every workspace file has a matching content-addressed block.
        let ws = manifest["workspace_manifest"] as? [String: Any] ?? [:]
        let files = ws["files"] as? [[String: Any]] ?? []
        let blocksDir = dir.appendingPathComponent("blocks", isDirectory: true)
        var blocksOK = true
        var pathHashes: [String: String] = [:]
        for f in files {
            let hex = f["sha256"] as? String ?? ""
            let rel = f["rel_path"] as? String ?? ""
            pathHashes[rel] = hex
            let blockURL = blocksDir.appendingPathComponent(String(hex.prefix(2)))
                                    .appendingPathComponent(hex)
            guard let data = try? Data(contentsOf: blockURL), sha256Hex(data) == hex else {
                blocksOK = false; break
            }
        }
        checks.append(Check("content_blocks", blocksOK,
            blocksOK ? "\(files.count) blocks present and hash-matched" : "a block is missing or corrupt"))

        // 4. workspace root hash recomputes from the file hashes.
        let recomputedRoot = try canonicalHashHex(pathHashes)
        let storedRoot = ws["root_hash"] as? String ?? ""
        checks.append(Check("workspace_root_hash", recomputedRoot == storedRoot,
            recomputedRoot == storedRoot ? "root hash matches" : "root hash mismatch"))

        // 5. receipt is internally consistent and bound to this manifest.
        if let rdata = try? Data(contentsOf: dir.appendingPathComponent("receipt.json")),
           let robj = try? JSONSerialization.jsonObject(with: rdata),
           var receipt = robj as? [String: Any] {
            let storedRH = receipt["receipt_hash"] as? String ?? ""
            receipt.removeValue(forKey: "receipt_hash")
            let rh = try canonicalHashHex(receipt)
            let bound = (receipt["manifest_hash"] as? String) == storedHash
            checks.append(Check("receipt", rh == storedRH && bound,
                rh == storedRH && bound ? "receipt hash consistent and bound to manifest"
                                        : "receipt hash or manifest binding failed"))
        } else {
            checks.append(Check("receipt", false, "receipt.json missing/unreadable"))
        }

        return checks
    }

    // MARK: - Restore

    /// Restore a capsule's workspace into `target` from its content blocks,
    /// verifying each block hash. Returns the number of files written.
    @discardableResult
    public static func restore(capsuleDir: URL, into target: URL) throws -> Int {
        let fm = FileManager.default
        try fm.createDirectory(at: target, withIntermediateDirectories: true)
        let manifest = try loadManifest(capsuleDir)
        let ws = manifest["workspace_manifest"] as? [String: Any] ?? [:]
        let files = ws["files"] as? [[String: Any]] ?? []
        let blocksDir = capsuleDir.appendingPathComponent("blocks", isDirectory: true)

        for f in files {
            let hex = f["sha256"] as? String ?? ""
            let rel = f["rel_path"] as? String ?? ""
            let blockURL = blocksDir.appendingPathComponent(String(hex.prefix(2)))
                                    .appendingPathComponent(hex)
            let data = try Data(contentsOf: blockURL)
            guard sha256Hex(data) == hex else {
                throw HDARError.verification("block hash mismatch for \(rel)")
            }
            let dest = target.appendingPathComponent(rel)
            try fm.createDirectory(at: dest.deletingLastPathComponent(),
                                   withIntermediateDirectories: true)
            try data.write(to: dest, options: [.atomic])
        }
        return files.count
    }
}
