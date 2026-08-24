import AppKit
import PDFKit
import SwiftUI
import WebKit

struct PieceDetailView: View {
    @Environment(LibraryStore.self) private var library

    let piece: Piece
    let onDeleted: () -> Void

    @State private var showingOriginal = false
    @State private var renderStatus: ScoreRenderStatus = .loading
    @State private var scoreWebView: WKWebView?
    @State private var confirmingDelete = false
    @State private var exportError: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 14)

            if !piece.warnings.isEmpty {
                warningsView
                    .padding(.horizontal, 24)
                    .padding(.bottom, 12)
            }

            if piece.hasOriginal {
                Picker("", selection: $showingOriginal) {
                    Text("Standardized").tag(false)
                    Text("Your original").tag(true)
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .frame(maxWidth: 260)
                .padding(.horizontal, 24)
                .padding(.bottom, 12)
            }

            scoreArea
        }
        .background(Theme.paper)
        .confirmationDialog(
            "Delete “\(piece.title)” from your library?",
            isPresented: $confirmingDelete
        ) {
            Button("Delete", role: .destructive) {
                library.delete(piece)
                onDeleted()
            }
        } message: {
            Text("This removes the converted score and the stored original. It can't be undone.")
        }
        .alert("Export failed", isPresented: exportErrorBinding) {
            Button("OK") { exportError = nil }
        } message: {
            Text(exportError ?? "")
        }
    }

    private var exportErrorBinding: Binding<Bool> {
        Binding(get: { exportError != nil }, set: { if !$0 { exportError = nil } })
    }

    // MARK: - Header

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text(piece.sourceKind.badgeLabel)
                        .font(.caption.weight(.semibold))
                        .padding(.horizontal, 9)
                        .padding(.vertical, 3)
                        .background(
                            (piece.sourceKind.isRecognized ? Theme.clay : Theme.sage).opacity(0.16),
                            in: Capsule()
                        )
                        .foregroundStyle(piece.sourceKind.isRecognized ? Theme.clayDark : Theme.sage)

                    if let date = piece.createdDate {
                        Text(date, style: .date)
                            .font(.caption)
                            .foregroundStyle(Theme.ink.opacity(0.45))
                    }
                }

                Text(piece.title)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                if !piece.factsLine.isEmpty {
                    Text(piece.factsLine)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.ink.opacity(0.55))
                }
            }

            Spacer()

            HStack(spacing: 10) {
                exportMenu

                Button {
                    NSWorkspace.shared.activateFileViewerSelecting(
                        [library.pieceDir(id: piece.id)])
                } label: {
                    Label("Show in Finder", systemImage: "folder")
                }

                Button(role: .destructive) {
                    confirmingDelete = true
                } label: {
                    Image(systemName: "trash")
                }
                .help("Delete from library")
            }
        }
    }

    private var exportMenu: some View {
        Menu {
            Button("MusicXML (.musicxml)") {
                exportFile(named: "score.musicxml", as: "\(piece.title).musicxml")
            }
            Button("Compressed MusicXML (.mxl)") {
                exportFile(named: "score.mxl", as: "\(piece.title).mxl")
            }
            Button("MIDI (.mid)") {
                exportFile(named: "score.mid", as: "\(piece.title).mid")
            }
            Divider()
            Button("PDF of the engraved score…") {
                exportPDF()
            }
            .disabled(scoreWebView == nil || renderStatus != .ready)
        } label: {
            Label("Export", systemImage: "square.and.arrow.up")
        }
    }

    // MARK: - Score / original display

    @ViewBuilder
    private var scoreArea: some View {
        if showingOriginal {
            originalView
        } else if let xml = library.musicXML(pieceID: piece.id) {
            ZStack {
                ScoreWebView(xml: xml, status: $renderStatus) { webView in
                    scoreWebView = webView
                }
                if renderStatus == .loading {
                    VStack(spacing: 8) {
                        ProgressView()
                        Text("Typesetting your score…")
                            .font(.callout)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Theme.paper)
                }
                if case .failed(let message) = renderStatus {
                    Text("Couldn't render this score: \(message)")
                        .font(.callout)
                        .foregroundStyle(Theme.clayDark)
                        .padding()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Theme.paper)
                }
            }
        } else {
            Text("The converted MusicXML file is missing for this piece.")
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    @ViewBuilder
    private var originalView: some View {
        if let ext = piece.originalExt,
           let url = library.fileURL(pieceID: piece.id, name: "original\(ext)") {
            if ext == ".pdf" {
                PDFKitView(url: url)
            } else if let image = NSImage(contentsOf: url) {
                ScrollView([.horizontal, .vertical]) {
                    Image(nsImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: 1100)
                        .padding(24)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                Text("Couldn't open the stored original.")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        } else {
            Text("No original file was stored for this piece.")
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    // MARK: - Exports

    private func exportFile(named storedName: String, as suggestedName: String) {
        guard let source = library.fileURL(pieceID: piece.id, name: storedName) else {
            exportError = "That file wasn't produced for this piece."
            return
        }
        let panel = NSSavePanel()
        panel.nameFieldStringValue = suggestedName
        guard panel.runModal() == .OK, let destination = panel.url else { return }
        do {
            if FileManager.default.fileExists(atPath: destination.path) {
                try FileManager.default.removeItem(at: destination)
            }
            try FileManager.default.copyItem(at: source, to: destination)
        } catch {
            exportError = error.localizedDescription
        }
    }

    private func exportPDF() {
        guard let webView = scoreWebView else { return }
        webView.createPDF { result in
            Task { @MainActor in
                switch result {
                case .success(let data):
                    let panel = NSSavePanel()
                    panel.nameFieldStringValue = "\(piece.title).pdf"
                    guard panel.runModal() == .OK, let destination = panel.url else { return }
                    do {
                        try data.write(to: destination)
                    } catch {
                        exportError = error.localizedDescription
                    }
                case .failure(let error):
                    exportError = error.localizedDescription
                }
            }
        }
    }
}

/// Minimal PDFKit wrapper for showing the stored original of a PDF source.
struct PDFKitView: NSViewRepresentable {
    let url: URL

    func makeNSView(context: Context) -> PDFView {
        let view = PDFView()
        view.autoScales = true
        view.document = PDFDocument(url: url)
        return view
    }

    func updateNSView(_ view: PDFView, context: Context) {
        if view.document?.documentURL != url {
            view.document = PDFDocument(url: url)
        }
    }
}
