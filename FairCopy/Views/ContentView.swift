import SwiftUI

struct ContentView: View {
    @Environment(EngineController.self) private var engine
    @Environment(LibraryStore.self) private var library
    @Environment(ConversionManager.self) private var conversions

    @State private var selectedPieceID: String?
    @State private var showingImporter = false

    var body: some View {
        NavigationSplitView {
            LibraryListView(selectedPieceID: $selectedPieceID)
                .navigationSplitViewColumnWidth(min: 230, ideal: 270)
        } detail: {
            detailView
        }
        .background(Theme.paper)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showingImporter = true
                } label: {
                    Label("Convert Files…", systemImage: "plus")
                }
                .disabled(!engine.isReady)
                .help(engine.isReady
                      ? "Convert sheet music files"
                      : "Finish engine setup first")
            }
        }
        .fileImporter(
            isPresented: $showingImporter,
            allowedContentTypes: ConversionManager.allowedContentTypes,
            allowsMultipleSelection: true
        ) { result in
            if case .success(let urls) = result {
                conversions.enqueue(urls: urls)
            }
        }
        .task {
            library.reload()
            await engine.startupCheck()
        }
    }

    @ViewBuilder
    private var detailView: some View {
        if let id = selectedPieceID, let piece = library.piece(id: id) {
            PieceDetailView(piece: piece) {
                selectedPieceID = nil
            }
        } else if engine.isReady {
            UploadDropView(selectedPieceID: $selectedPieceID)
        } else {
            SetupView()
        }
    }
}
