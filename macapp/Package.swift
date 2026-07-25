// swift-tools-version:5.9
import PackageDescription

// HDAR desktop — native macOS app for the Hardware-Detached Agent Runtime
// capsule protocol. Pure Apple frameworks: Foundation, CryptoKit, SwiftUI.
// No third-party dependencies, so it builds offline with the Xcode toolchain.
let package = Package(
    name: "HDAR",
    platforms: [.macOS(.v13)],
    targets: [
        // Engine: capsule seal / verify + the Nonlocal Coherence fan-out.
        .target(name: "HDARKit"),
        // GUI app (built into HDAR.app by build_app.sh).
        .executableTarget(
            name: "HDARApp",
            dependencies: ["HDARKit"]
        ),
        // Headless engine check: `swift run hdar-selftest`.
        .executableTarget(
            name: "hdar-selftest",
            dependencies: ["HDARKit"]
        ),
    ]
)
