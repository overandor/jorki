import Foundation
import CryptoKit

/// Ed25519 (Curve25519 signing) owner identity, backed by CryptoKit.
public struct OwnerKey {
    public let privateKey: Curve25519.Signing.PrivateKey

    public init() {
        self.privateKey = Curve25519.Signing.PrivateKey()
    }

    public init(rawRepresentation: Data) throws {
        self.privateKey = try Curve25519.Signing.PrivateKey(rawRepresentation: rawRepresentation)
    }

    public var publicKeyHex: String {
        privateKey.publicKey.rawRepresentation.map { String(format: "%02x", $0) }.joined()
    }

    /// Sign a raw message (this engine signs the 32-byte manifest digest).
    public func sign(_ message: Data) throws -> Data {
        try privateKey.signature(for: message)
    }

    // MARK: - On-disk persistence (private key never leaves the machine)

    /// `~/Library/Application Support/HDAR`
    public static func supportDir() throws -> URL {
        let base = try FileManager.default.url(
            for: .applicationSupportDirectory, in: .userDomainMask,
            appropriateFor: nil, create: true)
        let dir = base.appendingPathComponent("HDAR", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    public static func keyFileURL() throws -> URL {
        try supportDir().appendingPathComponent("owner_key.bin")
    }

    /// Load the persisted owner key, or generate and persist a new one.
    public static func loadOrCreate() throws -> OwnerKey {
        let url = try keyFileURL()
        if FileManager.default.fileExists(atPath: url.path) {
            let raw = try Data(contentsOf: url)
            return try OwnerKey(rawRepresentation: raw)
        }
        let key = OwnerKey()
        try key.privateKey.rawRepresentation.write(to: url, options: [.atomic])
        // Owner-only file permissions (0600).
        try FileManager.default.setAttributes(
            [.posixPermissions: 0o600], ofItemAtPath: url.path)
        return key
    }
}

/// Verify an Ed25519 signature `sig` over `message` for a hex public key.
public func verifyEd25519(publicKeyHex: String, signature sig: Data, message: Data) -> Bool {
    guard let pubData = Data(hexString: publicKeyHex),
          let pub = try? Curve25519.Signing.PublicKey(rawRepresentation: pubData)
    else { return false }
    return pub.isValidSignature(sig, for: message)
}

public extension Data {
    /// Parse a lowercase/uppercase hex string into bytes (nil on malformed input).
    init?(hexString: String) {
        let chars = Array(hexString)
        guard chars.count % 2 == 0 else { return nil }
        var out = Data(capacity: chars.count / 2)
        var i = 0
        while i < chars.count {
            guard let hi = chars[i].hexDigitValue, let lo = chars[i + 1].hexDigitValue
            else { return nil }
            out.append(UInt8(hi << 4 | lo))
            i += 2
        }
        self = out
    }

    var hexString: String {
        map { String(format: "%02x", $0) }.joined()
    }
}
