import SwiftUI
import WebKit

enum ScoreRenderStatus: Equatable {
    case loading
    case ready
    case failed(String)
}

/// Hosts the bundled viewer.html + OpenSheetMusicDisplay and feeds it
/// MusicXML. The page reports back over the "osmd" message handler so the
/// UI can show a real status instead of a silent blank pane.
struct ScoreWebView: NSViewRepresentable {
    let xml: String
    @Binding var status: ScoreRenderStatus
    var onWebViewReady: ((WKWebView) -> Void)? = nil

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(context.coordinator, name: "osmd")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.setValue(false, forKey: "drawsBackground") // let the cream page show through

        context.coordinator.webView = webView
        context.coordinator.pendingXML = xml

        if let viewerURL = AppPaths.viewerHTML {
            webView.loadFileURL(viewerURL, allowingReadAccessTo: viewerURL.deletingLastPathComponent())
        } else {
            status = .failed("The bundled score viewer is missing from the app.")
        }

        onWebViewReady?(webView)
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        context.coordinator.parent = self
        if context.coordinator.lastRenderedXML != xml {
            context.coordinator.pendingXML = xml
            context.coordinator.renderIfPossible()
        }
    }

    static func dismantleNSView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "osmd")
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: ScoreWebView
        weak var webView: WKWebView?
        var pendingXML: String?
        var lastRenderedXML: String?
        private var pageLoaded = false

        init(_ parent: ScoreWebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            pageLoaded = true
            renderIfPossible()
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.status = .failed(error.localizedDescription)
        }

        func renderIfPossible() {
            guard pageLoaded, let webView, let xml = pendingXML else { return }
            parent.status = .loading
            lastRenderedXML = xml
            pendingXML = nil

            guard let payload = try? JSONEncoder().encode(["xml": xml]),
                  var json = String(data: payload, encoding: .utf8)
            else {
                parent.status = .failed("Couldn't encode the score for display.")
                return
            }
            // U+2028/2029 are valid in JSON but not in pre-ES2019 JS string
            // literals — escape them so injection can't break, ever.
            json = json
                .replacingOccurrences(of: "\u{2028}", with: "\\u2028")
                .replacingOccurrences(of: "\u{2029}", with: "\\u2029")

            webView.evaluateJavaScript("window.renderScore((\(json)).xml)") { _, error in
                if let error {
                    Task { @MainActor in
                        self.parent.status = .failed(error.localizedDescription)
                    }
                }
            }
        }

        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard message.name == "osmd",
                  let body = message.body as? [String: Any],
                  let event = body["event"] as? String
            else { return }

            switch event {
            case "rendered":
                parent.status = .ready
            case "error":
                parent.status = .failed((body["message"] as? String) ?? "The score couldn't be rendered.")
            default:
                break
            }
        }
    }
}
