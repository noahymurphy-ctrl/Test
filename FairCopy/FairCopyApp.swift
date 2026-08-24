import SwiftUI

@main
struct FairCopyApp: App {
    @State private var engine: EngineController
    @State private var library: LibraryStore
    @State private var conversions: ConversionManager

    init() {
        let engine = EngineController()
        let library = LibraryStore()
        _engine = State(initialValue: engine)
        _library = State(initialValue: library)
        _conversions = State(initialValue: ConversionManager(engine: engine, library: library))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(engine)
                .environment(library)
                .environment(conversions)
                .frame(minWidth: 900, minHeight: 600)
                .tint(Theme.clay)
        }
        .windowStyle(.automatic)
    }
}
