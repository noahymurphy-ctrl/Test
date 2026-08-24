import Foundation

enum ConversionError: Error, LocalizedError {
    case engineMissing
    case engineFailed(String)

    var errorDescription: String? {
        switch self {
        case .engineMissing:
            return "The conversion engine isn't installed yet."
        case .engineFailed(let message):
            return message
        }
    }
}

/// Thin wrapper around `cli.py convert`: streams stage events to the caller
/// and returns the final "done" event (summary + warnings).
enum ConversionEngine {
    static func convert(
        input: URL,
        outDir: URL,
        onStage: @escaping @Sendable (String) -> Void
    ) async throws -> EngineEvent {
        guard let cli = AppPaths.engineCLI, let engineDir = AppPaths.engineDir else {
            throw ConversionError.engineMissing
        }

        let doneBox = Box<EngineEvent?>(nil)
        let errorBox = Box<EngineEvent?>(nil)

        let result = try await ProcessRunner.run(
            executable: AppPaths.venvPython,
            arguments: [cli.path, "convert", input.path, "--out-dir", outDir.path],
            currentDirectory: engineDir,
            onStdoutLine: { line in
                guard let data = line.data(using: .utf8),
                      let event = try? JSONDecoder().decode(EngineEvent.self, from: data)
                else { return }
                switch event.event {
                case "stage":
                    if let message = event.message { onStage(message) }
                case "done":
                    doneBox.value = event
                case "error":
                    errorBox.value = event
                default:
                    break
                }
            }
        )

        if let errorEvent = errorBox.value {
            throw ConversionError.engineFailed(errorEvent.message ?? "The engine reported an error.")
        }
        guard result.exitCode == 0, let done = doneBox.value else {
            let tail = String(result.stderrText.suffix(1500))
            throw ConversionError.engineFailed(
                "The engine exited unexpectedly (code \(result.exitCode)).\n\(tail)")
        }
        return done
    }
}
