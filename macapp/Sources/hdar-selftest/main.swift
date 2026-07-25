import Foundation
import HDARKit

// Headless engine check — no GUI, no persisted key.
// Run with:  swift run hdar-selftest
//
// Exercises the full path: build a workspace, seal E1, verify it, run the
// Nonlocal Coherence fan-out (both honest and fault-injected), and confirm the
// engine certifies the good run and refuses the tampered one.

func line(_ s: String) { FileHandle.standardOutput.write(Data((s + "\n").utf8)) }

func makeWorkspace() throws -> URL {
    let dir = FileManager.default.temporaryDirectory
        .appendingPathComponent("hdar-selftest-\(UUID().uuidString)", isDirectory: true)
    try FileManager.default.createDirectory(
        at: dir.appendingPathComponent("src"), withIntermediateDirectories: true)
    try "print('hello from host a')\n".write(
        to: dir.appendingPathComponent("src/worker.py"), atomically: true, encoding: .utf8)
    try "task: continue the analysis\nstatus: pending\n".write(
        to: dir.appendingPathComponent("todo.md"), atomically: true, encoding: .utf8)
    try "{\"epoch\":1,\"cursor\":42}\n".write(
        to: dir.appendingPathComponent("agent_state.json"), atomically: true, encoding: .utf8)
    return dir
}

do {
    let tmp = FileManager.default.temporaryDirectory
        .appendingPathComponent("hdar-selftest-out-\(UUID().uuidString)", isDirectory: true)
    try FileManager.default.createDirectory(at: tmp, withIntermediateDirectories: true)
    defer { try? FileManager.default.removeItem(at: tmp) }

    let owner = OwnerKey()
    line("owner public key: \(owner.publicKeyHex)")

    // 1. Seal E1.
    let ws = try makeWorkspace()
    defer { try? FileManager.default.removeItem(at: ws) }
    let e1 = try Capsule.seal(
        workspace: ws, owner: owner, agentId: "hdar-selftest",
        epoch: 1, out: tmp.appendingPathComponent("capsule_epoch_1"))
    line("sealed E1: manifest=\(e1.manifestHash.prefix(16))… files=\(e1.fileCount)")

    // 2. Verify E1.
    let checks = try Capsule.verify(dir: e1.dir)
    for c in checks { line("  [\(c.ok ? "PASS" : "FAIL")] \(c.name): \(c.detail)") }
    let e1OK = checks.allSatisfy { $0.ok }
    line("E1 verification: \(e1OK ? "ALL PASS" : "FAILED")")

    // 3. Coherence fan-out — honest run (should certify).
    let good = try Coherence.run(
        capsuleDir: e1.dir, owner: owner, shards: 5, quorum: 4,
        out: tmp.appendingPathComponent("coherence_good"))
    line("coherence (5 shards, quorum 4): monolithic=\(good.monolithic) merged=\(good.merged) "
        + "equal=\(good.resultsEqual) validSigs=\(good.validSignatures) → coherent=\(good.coherent)")

    // 4. Coherence fan-out — one faulty shard (should refuse).
    let bad = try Coherence.run(
        capsuleDir: e1.dir, owner: owner, shards: 5, quorum: 4,
        out: tmp.appendingPathComponent("coherence_bad"), faultyShards: 1)
    line("coherence with 1 faulty shard: equal=\(bad.resultsEqual) → coherent=\(bad.coherent) "
        + "(expected: not coherent)")

    let pass = e1OK && good.coherent && !bad.coherent
    line("")
    line(pass ? "SELFTEST: PASS" : "SELFTEST: FAIL")
    exit(pass ? 0 : 1)
} catch {
    line("SELFTEST ERROR: \(error)")
    exit(2)
}
