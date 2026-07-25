import SwiftUI
import AppKit
import HDARKit

@main
struct HDARApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup("HDAR — Hardware-Detached Agent Runtime") {
            ContentView()
                .environmentObject(model)
                .frame(minWidth: 720, minHeight: 560)
        }
        .windowStyle(.titleBar)
    }
}

// MARK: - Model

@MainActor
final class AppModel: ObservableObject {
    @Published var ownerPublicKey: String = "(no key loaded)"
    @Published var log: String = ""
    @Published var busy = false
    @Published var lastChecks: [Check] = []
    @Published var lastProof: CoherenceProof?

    private var owner: OwnerKey?

    init() { loadKey() }

    func loadKey() {
        do {
            let k = try OwnerKey.loadOrCreate()
            owner = k
            ownerPublicKey = k.publicKeyHex
            emit("Loaded owner identity \(k.publicKeyHex.prefix(16))… (private key stays in Application Support, 0600).")
        } catch {
            emit("Key load failed: \(error)")
        }
    }

    func requireOwner() -> OwnerKey? {
        if owner == nil { loadKey() }
        return owner
    }

    func emit(_ s: String) {
        let ts = ISO8601DateFormatter().string(from: Date())
        log += "[\(ts)] \(s)\n"
    }

    /// Run engine work off the main actor, then report back on it. A plain
    /// (non-async) throwing closure is accepted here too, since it is a subtype
    /// of the async throwing parameter.
    func run(_ label: String, _ work: @escaping () async throws -> String) {
        busy = true
        emit("▶ \(label)…")
        Task.detached(priority: .userInitiated) {
            let result: String
            do { result = try await work() }
            catch { result = "✗ error: \(error)" }
            await MainActor.run {
                self.emit(result)
                self.busy = false
            }
        }
    }

    // MARK: engine actions

    func seal(workspace: URL, out: URL, agentId: String) {
        guard let owner = requireOwner() else { return }
        run("Seal \(workspace.lastPathComponent) → \(out.lastPathComponent)") {
            let r = try Capsule.seal(workspace: workspace, owner: owner,
                                     agentId: agentId, epoch: 1, out: out)
            return "✓ Sealed E1 — manifest \(r.manifestHash.prefix(16))…, "
                 + "\(r.fileCount) files, \(r.totalSize) bytes, root \(r.rootHash.prefix(16))…"
        }
    }

    func verify(capsule: URL) {
        run("Verify \(capsule.lastPathComponent)") {
            let checks = try Capsule.verify(dir: capsule)
            await MainActor.run { self.lastChecks = checks }
            let passed = checks.filter { $0.ok }.count
            return "✓ Verified \(capsule.lastPathComponent): \(passed)/\(checks.count) checks passed"
        }
    }

    func coherence(capsule: URL, out: URL, shards: Int, quorum: Int, faulty: Int) {
        guard let owner = requireOwner() else { return }
        run("Coherence fan-out (\(shards) shards, quorum \(quorum)\(faulty > 0 ? ", \(faulty) faulty" : ""))") {
            let p = try Coherence.run(capsuleDir: capsule, owner: owner,
                                      shards: shards, quorum: quorum, out: out,
                                      faultyShards: faulty)
            await MainActor.run { self.lastProof = p }
            return "✓ Coherence: monolithic=\(p.monolithic) merged=\(p.merged) "
                 + "equal=\(p.resultsEqual) validSigs=\(p.validSignatures)/\(p.shards) → "
                 + (p.coherent ? "COHERENT (E2 \(p.e2ManifestHash.prefix(16))…)" : "NOT COHERENT")
        }
    }
}

// MARK: - Folder picker

func pickDirectory(prompt: String) -> URL? {
    let panel = NSOpenPanel()
    panel.title = prompt
    panel.prompt = "Choose"
    panel.canChooseDirectories = true
    panel.canChooseFiles = false
    panel.canCreateDirectories = true
    panel.allowsMultipleSelection = false
    return panel.runModal() == .OK ? panel.url : nil
}

// MARK: - Views

struct ContentView: View {
    @EnvironmentObject var model: AppModel

    var body: some View {
        VStack(spacing: 0) {
            TabView {
                SealView().tabItem { Label("Seal", systemImage: "lock.shield") }
                VerifyView().tabItem { Label("Verify", systemImage: "checkmark.seal") }
                CoherenceView().tabItem { Label("Coherence", systemImage: "point.3.connected.trianglepath.dotted") }
                IdentityView().tabItem { Label("Identity", systemImage: "key") }
            }
            .padding()

            Divider()
            LogPane()
        }
    }
}

struct SealView: View {
    @EnvironmentObject var model: AppModel
    @State private var workspace: URL?
    @State private var out: URL?
    @State private var agentId = "hdar-desktop-agent"

    var body: some View {
        Form {
            Section("Seal a workspace into a signed capsule") {
                PathRow(label: "Workspace", url: $workspace, prompt: "Select the workspace folder to seal")
                PathRow(label: "Output", url: $out, prompt: "Select an output folder for the capsule")
                TextField("Agent ID", text: $agentId)
                Button("Seal E1") {
                    if let w = workspace, let o = out {
                        model.seal(workspace: w, out: o.appendingPathComponent("capsule_epoch_1"), agentId: agentId)
                    }
                }
                .disabled(workspace == nil || out == nil || model.busy)
            }
        }
        .formStyle(.grouped)
    }
}

struct VerifyView: View {
    @EnvironmentObject var model: AppModel
    @State private var capsule: URL?

    var body: some View {
        Form {
            Section("Independently verify a capsule") {
                PathRow(label: "Capsule dir", url: $capsule, prompt: "Select a capsule directory (has manifest.json)")
                Button("Verify") { if let c = capsule { model.verify(capsule: c) } }
                    .disabled(capsule == nil || model.busy)
            }
            if !model.lastChecks.isEmpty {
                Section("Checks") {
                    ForEach(model.lastChecks.indices, id: \.self) { i in
                        let c = model.lastChecks[i]
                        HStack {
                            Image(systemName: c.ok ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundColor(c.ok ? .green : .red)
                            Text(c.name).bold()
                            Spacer()
                            Text(c.detail).foregroundColor(.secondary).font(.caption)
                        }
                    }
                }
            }
        }
        .formStyle(.grouped)
    }
}

struct CoherenceView: View {
    @EnvironmentObject var model: AppModel
    @State private var capsule: URL?
    @State private var out: URL?
    @State private var shards = 5.0
    @State private var quorum = 4.0
    @State private var faulty = 0.0

    var body: some View {
        Form {
            Section("Nonlocal Coherence — parallel fan-out with a quorum merge proof") {
                Text("Splits a sealed E1 across N in-process shards, each signing its "
                   + "partial with an ephemeral key, then certifies the distributed "
                   + "result equals a single-pass result under a signed quorum.")
                    .font(.caption).foregroundColor(.secondary)
                PathRow(label: "E1 capsule", url: $capsule, prompt: "Select the E1 capsule directory")
                PathRow(label: "Output", url: $out, prompt: "Select an output folder for the E2 + proof")
                Stepper("Shards: \(Int(shards))", value: $shards, in: 1...32)
                Stepper("Quorum: \(Int(quorum))", value: $quorum, in: 1...max(1, shards))
                Stepper("Faulty shards (demo): \(Int(faulty))", value: $faulty, in: 0...shards)
                Button("Run fan-out") {
                    if let c = capsule, let o = out {
                        let n = Int(shards)
                        model.coherence(capsule: c, out: o, shards: n,
                                        quorum: min(Int(quorum), n),
                                        faulty: min(Int(faulty), n))
                    }
                }
                .disabled(capsule == nil || out == nil || model.busy)
            }
            if let p = model.lastProof {
                Section("Coherence proof") {
                    LabeledContent("Coherent", value: p.coherent ? "YES" : "NO")
                    LabeledContent("Monolithic", value: String(p.monolithic))
                    LabeledContent("Merged", value: String(p.merged))
                    LabeledContent("Valid signatures", value: "\(p.validSignatures)/\(p.shards) (quorum \(p.quorum))")
                    LabeledContent("E2 manifest", value: String(p.e2ManifestHash.prefix(24)) + "…")
                }
            }
        }
        .formStyle(.grouped)
    }
}

struct IdentityView: View {
    @EnvironmentObject var model: AppModel
    var body: some View {
        Form {
            Section("Owner identity (Ed25519 via CryptoKit)") {
                LabeledContent("Public key", value: model.ownerPublicKey)
                Text("The private key is stored at ~/Library/Application Support/HDAR/owner_key.bin "
                   + "with 0600 permissions and never leaves this machine.")
                    .font(.caption).foregroundColor(.secondary)
                Button("Reload key") { model.loadKey() }
            }
        }
        .formStyle(.grouped)
    }
}

struct PathRow: View {
    let label: String
    @Binding var url: URL?
    let prompt: String
    var body: some View {
        HStack {
            Text(label).frame(width: 90, alignment: .leading)
            Text(url?.path ?? "—").foregroundColor(.secondary).lineLimit(1).truncationMode(.middle)
            Spacer()
            Button("Choose…") { if let u = pickDirectory(prompt: prompt) { url = u } }
        }
    }
}

struct LogPane: View {
    @EnvironmentObject var model: AppModel
    var body: some View {
        ScrollView {
            Text(model.log.isEmpty ? "Ready." : model.log)
                .font(.system(.caption, design: .monospaced))
                .frame(maxWidth: .infinity, alignment: .leading)
                .textSelection(.enabled)
                .padding(8)
        }
        .frame(height: 150)
        .background(Color(nsColor: .textBackgroundColor))
    }
}
