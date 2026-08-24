import AppKit
import Foundation
import Observation
import UniformTypeIdentifiers

/// Accepts dropped/picked files, runs them through the engine one at a time
/// (recognition is CPU-heavy — parallel jobs would just thrash), and files
/// the results into the library.
@MainActor
@Observable
final class ConversionManager {
    static let imageExtensions: Set<String> = ["png", "jpg", "jpeg", "bmp", "tif", "tiff", "webp"]
    static let heicExtensions: Set<String> = ["heic", "heif"]
    static let directExtensions: Set<String> = ["musicxml", "xml", "mxl", "mid", "midi"]
    static let pdfExtensions: Set<String> = ["pdf"]

    static var allExtensions: Set<String> {
        imageExtensions.union(heicExtensions).union(directExtensions).union(pdfExtensions)
    }

    static var allowedContentTypes: [UTType] {
        var types: [UTType] = [.pdf, .png, .jpeg, .tiff, .webP, .heic, .bmp, .midi, .xml]
        for ext in ["musicxml", "mxl"] {
            if let type = UTType(filenameExtension: ext) {
                types.append(type)
            }
        }
        return types
    }

    var jobs: [ConversionJob] = []
    var lastRejection: String?

    private let engine: EngineController
    private let library: LibraryStore
    private var isProcessing = false

    init(engine: EngineController, library: LibraryStore) {
        self.engine = engine
        self.library = library
    }

    var activeJobs: [ConversionJob] {
        jobs.filter { $0.status == .queued || $0.status == .running }
    }

    func enqueue(urls: [URL]) {
        lastRejection = nil
        for url in urls {
            let ext = url.pathExtension.lowercased()
            guard Self.allExtensions.contains(ext) else {
                lastRejection = "\(url.lastPathComponent) isn't a supported file type."
                continue
            }
            jobs.insert(ConversionJob(sourceURL: url), at: 0)
        }
        kickQueue()
    }

    private func kickQueue() {
        guard !isProcessing else { return }
        guard let next = jobs.last(where: { $0.status == .queued }) else { return }
        isProcessing = true
        Task {
            await self.process(next)
            self.isProcessing = false
            self.kickQueue()
        }
    }

    private func process(_ job: ConversionJob) async {
        job.status = .running
        job.stage = "Preparing"

        let workDir = AppPaths.newTempDir()
        defer { try? FileManager.default.removeItem(at: workDir) }

        do {
            var inputURL = job.sourceURL
            let ext = inputURL.pathExtension.lowercased()

            // OpenCV (inside the engine) can't read HEIC, but macOS can —
            // normalize iPhone photos to PNG before handing them over.
            if Self.heicExtensions.contains(ext) {
                job.stage = "Converting iPhone photo to PNG"
                inputURL = try Self.convertHEICToPNG(inputURL, in: workDir)
            }

            let outDir = workDir.appendingPathComponent("out", isDirectory: true)
            let done = try await ConversionEngine.convert(
                input: inputURL,
                outDir: outDir,
                onStage: { message in
                    Task { @MainActor in job.stage = message }
                }
            )

            job.stage = "Filing into your library"
            let sourceKind = SourceKind(rawValue: done.kind ?? "") ?? .image
            let summary = done.summary ?? PieceSummary()
            let fallbackTitle = job.sourceURL.deletingPathExtension().lastPathComponent
            let piece = try library.addPiece(
                title: summary.title ?? fallbackTitle,
                sourceFilename: job.sourceURL.lastPathComponent,
                sourceKind: sourceKind,
                summary: summary,
                warnings: done.warnings ?? [],
                outputsDir: outDir,
                originalURL: sourceKind.isRecognized ? inputURL : nil
            )

            job.pieceID = piece.id
            job.stage = "Done"
            job.status = .done
        } catch {
            job.errorMessage = error.localizedDescription
            job.stage = "Failed"
            job.status = .failed
        }
    }

    func dismiss(_ job: ConversionJob) {
        jobs.removeAll { $0.id == job.id }
    }

    // MARK: - HEIC normalization

    private static func convertHEICToPNG(_ url: URL, in workDir: URL) throws -> URL {
        guard let image = NSImage(contentsOf: url),
              let tiff = image.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff),
              let png = rep.representation(using: .png, properties: [:])
        else {
            throw ConversionError.engineFailed("Couldn't read \(url.lastPathComponent) as an image.")
        }
        let outURL = workDir.appendingPathComponent(
            url.deletingPathExtension().lastPathComponent + ".png")
        try png.write(to: outURL)
        return outURL
    }
}
