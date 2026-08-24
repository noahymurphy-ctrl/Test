import Foundation

// MARK: - Source kinds

enum SourceKind: String, Codable {
    case image
    case pdf
    case musicxml
    case mxl
    case midi

    /// Whether the notes went through optical recognition (worth
    /// double-checking) vs. exact symbolic data (trustworthy by construction).
    var isRecognized: Bool {
        switch self {
        case .image, .pdf: return true
        case .musicxml, .mxl, .midi: return false
        }
    }

    var badgeLabel: String {
        switch self {
        case .image: return "Photo / scan"
        case .pdf: return "PDF scan"
        case .musicxml, .mxl: return "MusicXML"
        case .midi: return "MIDI"
        }
    }
}

// MARK: - Library pieces (meta.json on disk, snake_case keys)

struct PieceSummary: Codable, Hashable {
    var title: String?
    var parts: Int?
    var measures: Int?
    var notes: Int?
    var keyGuess: String?
    var timeSignature: String?

    enum CodingKeys: String, CodingKey {
        case title, parts, measures, notes
        case keyGuess = "key_guess"
        case timeSignature = "time_signature"
    }
}

struct Piece: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var sourceFilename: String
    var sourceKind: SourceKind
    var createdAt: String
    var summary: PieceSummary
    var warnings: [String]
    var hasOriginal: Bool
    var originalExt: String?

    enum CodingKeys: String, CodingKey {
        case id, title, summary, warnings
        case sourceFilename = "source_filename"
        case sourceKind = "source_kind"
        case createdAt = "created_at"
        case hasOriginal = "has_original"
        case originalExt = "original_ext"
    }

    var createdDate: Date? {
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = withFraction.date(from: createdAt) { return d }
        let plain = ISO8601DateFormatter()
        return plain.date(from: createdAt)
    }

    /// "28 measures · 6/8 · c# minor · 2 staves"
    var factsLine: String {
        var facts: [String] = []
        if let m = summary.measures, m > 0 { facts.append("\(m) measures") }
        if let ts = summary.timeSignature { facts.append(ts) }
        if let key = summary.keyGuess { facts.append(key) }
        if let p = summary.parts, p > 0 { facts.append(p == 1 ? "1 staff" : "\(p) staves") }
        return facts.joined(separator: " · ")
    }
}

// MARK: - Engine protocol (one JSON object per stdout line from cli.py)

struct EngineEvent: Decodable {
    var event: String
    // stage / error
    var message: String?
    var detail: String?
    // done
    var kind: String?
    var summary: PieceSummary?
    var warnings: [String]?
    // doctor
    var ok: Bool?
    var pythonVersion: String?
    var pythonPath: String?
    var missing: [String]?
    var modelsDownloaded: Bool?

    enum CodingKeys: String, CodingKey {
        case event, message, detail, kind, summary, warnings, ok, missing
        case pythonVersion = "python_version"
        case pythonPath = "python_path"
        case modelsDownloaded = "models_downloaded"
    }
}

// MARK: - Conversion jobs (in-memory, per app run)

@MainActor
@Observable
final class ConversionJob: Identifiable {
    enum Status {
        case queued
        case running
        case done
        case failed
    }

    let id = UUID()
    let sourceURL: URL
    var filename: String { sourceURL.lastPathComponent }
    var status: Status = .queued
    var stage: String = "Waiting to start"
    var errorMessage: String?
    var pieceID: String?
    let startedAt = Date()

    init(sourceURL: URL) {
        self.sourceURL = sourceURL
    }
}
