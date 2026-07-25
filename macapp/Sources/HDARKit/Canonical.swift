import Foundation
import CryptoKit

/// Errors surfaced by the HDAR engine.
public enum HDARError: Error, CustomStringConvertible {
    case io(String)
    case format(String)
    case verification(String)

    public var description: String {
        switch self {
        case .io(let m): return "I/O error: \(m)"
        case .format(let m): return "format error: \(m)"
        case .verification(let m): return "verification failed: \(m)"
        }
    }
}

/// Lowercase hex SHA-256 of `data`.
public func sha256Hex(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}

/// The raw 32-byte SHA-256 digest of `data`.
public func sha256Digest(_ data: Data) -> Data {
    Data(SHA256.hash(data: data))
}

/// Canonical JSON bytes: sorted keys, compact (no whitespace), slashes
/// unescaped. Deterministic as long as every value is a JSON-native type and
/// numbers are integers (this engine never hashes a floating-point value).
///
/// NOTE ON INTEROP: this is a self-consistent v0.1 canonicalization. Before
/// relying on cross-verification with the Python/Rust reference verifiers in
/// the hdar-* repos, pin one canonicalization spec and confirm a capsule sealed
/// here verifies there (and vice-versa). See macapp/README.md.
public func canonicalData(_ obj: Any) throws -> Data {
    guard JSONSerialization.isValidJSONObject(obj) else {
        throw HDARError.format("value is not a valid top-level JSON object")
    }
    return try JSONSerialization.data(
        withJSONObject: obj,
        options: [.sortedKeys, .withoutEscapingSlashes]
    )
}

/// Lowercase hex SHA-256 over the canonical JSON encoding of `obj`.
public func canonicalHashHex(_ obj: Any) throws -> String {
    sha256Hex(try canonicalData(obj))
}

/// Pretty-printed (sorted-key) JSON, for writing human-readable artifacts.
public func prettyJSON(_ obj: Any) throws -> Data {
    try JSONSerialization.data(
        withJSONObject: obj,
        options: [.sortedKeys, .prettyPrinted, .withoutEscapingSlashes]
    )
}
