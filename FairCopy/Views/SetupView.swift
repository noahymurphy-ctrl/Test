import SwiftUI

/// First-run experience: explains what's about to be installed, streams the
/// installer's real output, and gives an honest, actionable failure state.
struct SetupView: View {
    @Environment(EngineController.self) private var engine

    var body: some View {
        VStack(spacing: 20) {
            switch engine.state {
            case .checking:
                ProgressView("Checking the conversion engine…")
                    .controlSize(.large)

            case .ready:
                Label("The engine is ready.", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(Theme.sage)

            case .needsSetup(let reason):
                setupPrompt(reason: reason)

            case .installing(let step):
                installingView(step: step)

            case .failed(let message):
                failedView(message: message)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(32)
        .background(Theme.paper)
    }

    private func setupPrompt(reason: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "pianokeys")
                .font(.system(size: 34, weight: .medium))
                .foregroundStyle(Theme.clay)

            Text("Set up the recognition engine")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(Theme.ink)

            Text(reason)
                .font(.system(size: 13))
                .foregroundStyle(Theme.ink.opacity(0.65))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 480)

            Button("Install Engine") {
                Task { await engine.installEngine() }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            Text("Needs an internet connection. Requires Python 3.10+ on this Mac (Homebrew or python.org).")
                .font(.caption)
                .foregroundStyle(Theme.ink.opacity(0.45))
        }
    }

    private func installingView(step: String) -> some View {
        VStack(spacing: 14) {
            ProgressView()
                .controlSize(.large)
            Text(step)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Theme.ink)
            logView
        }
    }

    private func failedView(message: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 30))
                .foregroundStyle(Theme.clayDark)

            Text("Setup didn't finish")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Theme.ink)

            Text(message)
                .font(.system(size: 13))
                .foregroundStyle(Theme.ink.opacity(0.7))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 520)
                .textSelection(.enabled)

            Button("Try Again") {
                Task { await engine.installEngine() }
            }
            .buttonStyle(.borderedProminent)

            if !engine.setupLog.isEmpty {
                logView
            }
        }
    }

    private var logView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                Text(engine.setupLog)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Theme.ink.opacity(0.75))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .textSelection(.enabled)
                    .padding(12)
                Color.clear.frame(height: 1).id("logBottom")
            }
            .frame(maxWidth: 640, maxHeight: 260)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(Theme.ink.opacity(0.08))
            )
            .onChange(of: engine.setupLog) {
                proxy.scrollTo("logBottom", anchor: .bottom)
            }
        }
    }
}
