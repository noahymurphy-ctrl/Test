import Foundation

struct ProcessResult {
    var exitCode: Int32
    var stderrText: String
}

enum ProcessRunnerError: Error, LocalizedError {
    case launchFailed(String)

    var errorDescription: String? {
        switch self {
        case .launchFailed(let message):
            return "Couldn't launch process: \(message)"
        }
    }
}

/// Runs a subprocess, streaming stdout (and optionally stderr) line-by-line
/// as it arrives. Both pipes are always drained concurrently — a full,
/// undrained 64 KB pipe buffer would deadlock a chatty child process.
enum ProcessRunner {
    static func run(
        executable: URL,
        arguments: [String],
        currentDirectory: URL? = nil,
        onStdoutLine: @escaping @Sendable (String) -> Void,
        onStderrLine: (@Sendable (String) -> Void)? = nil
    ) async throws -> ProcessResult {
        let process = Process()
        process.executableURL = executable
        process.arguments = arguments
        if let currentDirectory {
            process.currentDirectoryURL = currentDirectory
        }
        var environment = ProcessInfo.processInfo.environment
        environment["PYTHONUNBUFFERED"] = "1"
        process.environment = environment

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe
        process.standardInput = FileHandle.nullDevice

        do {
            try process.run()
        } catch {
            throw ProcessRunnerError.launchFailed(error.localizedDescription)
        }

        async let stderrText = collectLines(
            from: stderrPipe.fileHandleForReading,
            onLine: onStderrLine
        )

        do {
            for try await line in stdoutPipe.fileHandleForReading.bytes.lines {
                onStdoutLine(line)
            }
        } catch {
            // A read error usually means the process died mid-write; the
            // exit code below tells the real story.
        }

        let stderr = await stderrText
        process.waitUntilExit()
        return ProcessResult(exitCode: process.terminationStatus, stderrText: stderr)
    }

    private static func collectLines(
        from handle: FileHandle,
        onLine: (@Sendable (String) -> Void)?
    ) async -> String {
        var collected = ""
        do {
            for try await line in handle.bytes.lines {
                collected += line + "\n"
                onLine?(line)
            }
        } catch {
            // Same as stdout: EOF-adjacent errors are fine to ignore here.
        }
        return collected
    }
}
