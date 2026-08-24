import Foundation
import Observation

/// Owns the Python engine's lifecycle: is it installed, can it run, and the
/// first-run installer that sets it up (creating a private virtualenv under
/// Application Support and pip-installing the bundled requirements.txt).
@MainActor
@Observable
final class EngineController {
    enum SetupState: Equatable {
        case checking
        case ready
        case needsSetup(reason: String)
        case installing(step: String)
        case failed(message: String)
    }

    var state: SetupState = .checking
    var setupLog: String = ""
    /// True once we know the recognition models are already on disk; when
    /// false, the first photo/PDF conversion also downloads ~110 MB of models.
    var modelsDownloaded = false

    var isReady: Bool { state == .ready }

    // MARK: - Startup

    func startupCheck() async {
        AppPaths.ensureDirectoriesExist()

        guard AppPaths.engineCLI != nil else {
            state = .failed(message:
                "The bundled conversion engine is missing from the app. "
                + "This is a packaging problem — cli.py wasn't copied into the app's resources.")
            return
        }

        guard FileManager.default.fileExists(atPath: AppPaths.venvPython.path) else {
            state = .needsSetup(reason:
                "Fair Copy needs a one-time setup to install its music-recognition engine "
                + "(a private Python environment, about 500 MB). Nothing is installed outside "
                + "the app's own folder in Application Support.")
            return
        }

        await refreshDoctor()
    }

    /// Runs `cli.py doctor` and updates state accordingly.
    func refreshDoctor() async {
        guard let engineDir = AppPaths.engineDir, let cli = AppPaths.engineCLI else { return }
        state = .checking

        do {
            let box = doctorEventBox
            box.value = nil
            let result = try await ProcessRunner.run(
                executable: AppPaths.venvPython,
                arguments: [cli.path, "doctor"],
                currentDirectory: engineDir,
                onStdoutLine: { line in
                    if let data = line.data(using: .utf8),
                       let event = try? JSONDecoder().decode(EngineEvent.self, from: data),
                       event.event == "doctor" {
                        box.value = event
                    }
                }
            )
            let doctorEvent = box.value

            if let event = doctorEvent, event.ok == true {
                modelsDownloaded = event.modelsDownloaded ?? false
                state = .ready
            } else if let event = doctorEvent, let missing = event.missing, !missing.isEmpty {
                state = .needsSetup(reason:
                    "The engine environment exists but is missing packages "
                    + "(\(missing.joined(separator: ", "))). Running setup again will repair it.")
            } else {
                state = .needsSetup(reason:
                    "The engine environment exists but isn't answering correctly "
                    + "(exit code \(result.exitCode)). Running setup again will rebuild it.")
            }
        } catch {
            state = .needsSetup(reason:
                "Couldn't run the engine's health check (\(error.localizedDescription)). "
                + "Running setup again will rebuild it.")
        }
    }

    /// Set from the stdout callback (which is nonisolated), read after the
    /// process finishes. A tiny lock-free box keeps this Swift-5-mode simple.
    private let doctorEventBox = Box<EngineEvent?>(nil)

    // MARK: - Installation

    func installEngine() async {
        setupLog = ""
        appendLog("Fair Copy engine setup\n======================\n")

        guard let requirements = AppPaths.engineRequirements else {
            state = .failed(message: "The bundled requirements.txt is missing from the app.")
            return
        }

        state = .installing(step: "Looking for Python 3.10 or newer")
        guard let systemPython = await findSystemPython() else {
            state = .failed(message:
                "No Python 3.10+ found on this Mac. Install it with Homebrew "
                + "(`brew install python`) or from python.org, then run setup again. "
                + "(The Python that ships with Xcode's command line tools is 3.9, "
                + "which is too old for the music libraries this app uses.)")
            return
        }
        appendLog("Using \(systemPython.path)\n")

        // Rebuild the venv from scratch so a broken half-install can't linger.
        try? FileManager.default.removeItem(at: AppPaths.venvDir)

        state = .installing(step: "Creating the Python environment")
        if await runLogged(systemPython, ["-m", "venv", AppPaths.venvDir.path]) != 0 {
            state = .failed(message: "Creating the Python environment failed — see the log below.")
            return
        }

        state = .installing(step: "Updating pip")
        if await runLogged(AppPaths.venvPython, ["-m", "pip", "install", "--upgrade", "pip"]) != 0 {
            state = .failed(message: "Updating pip failed — see the log below.")
            return
        }

        state = .installing(step: "Installing the recognition engine (this takes a few minutes)")
        if await runLogged(AppPaths.venvPython, ["-m", "pip", "install", "-r", requirements.path]) != 0 {
            state = .failed(message:
                "Installing the engine's packages failed — see the log below. "
                + "(This step needs an internet connection, and `git`, which comes with Xcode.)")
            return
        }

        state = .installing(step: "Verifying the installation")
        await refreshDoctor()
        if case .needsSetup(let reason) = state {
            state = .failed(message: "Setup finished but verification failed: \(reason)")
        }
    }

    private func runLogged(_ executable: URL, _ arguments: [String]) async -> Int32 {
        appendLog("\n$ \(executable.lastPathComponent) \(arguments.joined(separator: " "))\n")
        do {
            let result = try await ProcessRunner.run(
                executable: executable,
                arguments: arguments,
                onStdoutLine: { [weak self] line in
                    Task { @MainActor in self?.appendLog(line + "\n") }
                },
                onStderrLine: { [weak self] line in
                    Task { @MainActor in self?.appendLog(line + "\n") }
                }
            )
            if result.exitCode != 0 {
                appendLog("\n[exited with code \(result.exitCode)]\n")
            }
            return result.exitCode
        } catch {
            appendLog("\n[failed to launch: \(error.localizedDescription)]\n")
            return -1
        }
    }

    private func appendLog(_ text: String) {
        setupLog += text
        // Keep the in-memory log bounded; pip can be extremely chatty.
        if setupLog.count > 200_000 {
            setupLog = String(setupLog.suffix(150_000))
        }
    }

    // MARK: - System Python discovery

    /// Finds a Python >= 3.10 to seed the venv from, preferring Homebrew and
    /// python.org installs. /usr/bin/python3 (Xcode's) is last because it's
    /// still 3.9 as of current Xcode releases.
    private func findSystemPython() async -> URL? {
        var candidates: [String] = []
        for prefix in ["/opt/homebrew/bin", "/usr/local/bin"] {
            for name in ["python3.13", "python3.12", "python3.11", "python3.10", "python3"] {
                candidates.append("\(prefix)/\(name)")
            }
        }
        for version in ["3.13", "3.12", "3.11", "3.10"] {
            candidates.append("/Library/Frameworks/Python.framework/Versions/\(version)/bin/python3")
        }
        candidates.append("/usr/bin/python3")

        for candidate in candidates {
            let url = URL(fileURLWithPath: candidate)
            guard FileManager.default.isExecutableFile(atPath: candidate) else { continue }
            if await pythonVersionIsSupported(url) {
                return url
            }
            appendLog("Skipping \(candidate) (older than Python 3.10)\n")
        }
        return nil
    }

    private func pythonVersionIsSupported(_ python: URL) async -> Bool {
        let script = "import sys; print(1 if sys.version_info >= (3, 10) else 0)"
        do {
            let box = Box<String>("")
            let result = try await ProcessRunner.run(
                executable: python,
                arguments: ["-c", script],
                onStdoutLine: { line in box.value += line }
            )
            return result.exitCode == 0 && box.value.contains("1")
        } catch {
            return false
        }
    }
}

/// Minimal reference box for handing a value out of a nonisolated stream
/// callback back to the actor once the process has finished. The write and
/// the read never overlap (read happens strictly after run() returns).
final class Box<T>: @unchecked Sendable {
    var value: T
    init(_ value: T) { self.value = value }
}
