import Foundation

/// Where Fair Copy keeps everything on disk:
/// ~/Library/Application Support/FairCopy/{venv, library, tmp}
enum AppPaths {
    static var appSupport: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent("FairCopy", isDirectory: true)
    }

    static var venvDir: URL { appSupport.appendingPathComponent("venv", isDirectory: true) }
    static var venvPython: URL { venvDir.appendingPathComponent("bin/python3") }
    static var libraryDir: URL { appSupport.appendingPathComponent("library", isDirectory: true) }
    static var tmpDir: URL { appSupport.appendingPathComponent("tmp", isDirectory: true) }

    static func ensureDirectoriesExist() {
        for dir in [appSupport, libraryDir, tmpDir] {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
    }

    static func newTempDir() -> URL {
        let dir = tmpDir.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    /// Locates a file bundled with the app. Xcode may flatten bundled folders
    /// into the top-level Resources directory or preserve them, depending on
    /// how the project adds them — so try both before giving up.
    static func bundledResource(named name: String, extension ext: String) -> URL? {
        let subdirectories: [String?] = [nil, "engine", "viewer", "Resources/engine", "Resources/viewer"]
        for subdirectory in subdirectories {
            if let url = Bundle.main.url(forResource: name, withExtension: ext, subdirectory: subdirectory) {
                return url
            }
        }
        return nil
    }

    /// The directory containing the bundled Python engine (cli.py and friends).
    static var engineDir: URL? {
        bundledResource(named: "cli", extension: "py")?.deletingLastPathComponent()
    }

    static var engineCLI: URL? {
        bundledResource(named: "cli", extension: "py")
    }

    static var engineRequirements: URL? {
        bundledResource(named: "requirements", extension: "txt")
    }

    static var viewerHTML: URL? {
        bundledResource(named: "viewer", extension: "html")
    }
}
