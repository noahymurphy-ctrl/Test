import Foundation
import Observation

/// The on-disk library: one folder per converted piece under
/// ~/Library/Application Support/FairCopy/library/<id>/ containing
/// meta.json, score.musicxml, score.mxl, score.mid, and (for photo/PDF
/// sources) the original upload. Same layout the Fair Copy web app uses,
/// so it stays trivially inspectable in Finder.
@MainActor
@Observable
final class LibraryStore {
    var pieces: [Piece] = []

    func reload() {
        AppPaths.ensureDirectoriesExist()
        var loaded: [Piece] = []
        let decoder = JSONDecoder()
        let contents = (try? FileManager.default.contentsOfDirectory(
            at: AppPaths.libraryDir,
            includingPropertiesForKeys: nil
        )) ?? []
        for dir in contents {
            let metaURL = dir.appendingPathComponent("meta.json")
            guard let data = try? Data(contentsOf: metaURL),
                  let piece = try? decoder.decode(Piece.self, from: data)
            else { continue }
            loaded.append(piece)
        }
        loaded.sort { $0.createdAt > $1.createdAt }
        pieces = loaded
    }

    func piece(id: String) -> Piece? {
        pieces.first { $0.id == id }
    }

    func pieceDir(id: String) -> URL {
        AppPaths.libraryDir.appendingPathComponent(id, isDirectory: true)
    }

    /// Returns the URL only if the file actually exists.
    func fileURL(pieceID: String, name: String) -> URL? {
        let url = pieceDir(id: pieceID).appendingPathComponent(name)
        return FileManager.default.fileExists(atPath: url.path) ? url : nil
    }

    func musicXML(pieceID: String) -> String? {
        guard let url = fileURL(pieceID: pieceID, name: "score.musicxml") else { return nil }
        return try? String(contentsOf: url, encoding: .utf8)
    }

    /// Moves a finished conversion's outputs into the library and records
    /// its metadata. `originalURL` is copied in for recognized sources so
    /// the app can show a side-by-side original.
    func addPiece(
        title: String,
        sourceFilename: String,
        sourceKind: SourceKind,
        summary: PieceSummary,
        warnings: [String],
        outputsDir: URL,
        originalURL: URL?
    ) throws -> Piece {
        let id = UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased().prefix(12)
        let pieceID = String(id)
        let dir = pieceDir(id: pieceID)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

        let fm = FileManager.default
        for name in ["score.musicxml", "score.mxl", "score.mid"] {
            let src = outputsDir.appendingPathComponent(name)
            if fm.fileExists(atPath: src.path) {
                try fm.moveItem(at: src, to: dir.appendingPathComponent(name))
            }
        }

        var originalExt: String?
        if let originalURL {
            let ext = "." + originalURL.pathExtension.lowercased()
            originalExt = ext
            try? fm.copyItem(at: originalURL, to: dir.appendingPathComponent("original\(ext)"))
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        let piece = Piece(
            id: pieceID,
            title: title,
            sourceFilename: sourceFilename,
            sourceKind: sourceKind,
            createdAt: formatter.string(from: Date()),
            summary: summary,
            warnings: warnings,
            hasOriginal: originalURL != nil,
            originalExt: originalExt
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        try encoder.encode(piece).write(to: dir.appendingPathComponent("meta.json"))

        reload()
        return piece
    }

    func delete(_ piece: Piece) {
        try? FileManager.default.removeItem(at: pieceDir(id: piece.id))
        reload()
    }
}
