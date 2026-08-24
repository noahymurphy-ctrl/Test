import SwiftUI

/// The welcome/detail pane when nothing is selected: a big drop target plus
/// honest guidance about what conversion can and can't promise.
struct UploadDropView: View {
    @Environment(ConversionManager.self) private var conversions
    @Environment(EngineController.self) private var engine

    @Binding var selectedPieceID: String?
    @State private var isDropTargeted = false
    @State private var showingImporter = false

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                VStack(spacing: 8) {
                    Text("Turn any sheet music into a fair copy")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                    Text("Drop a photo, scan, or PDF of piano sheet music — or a MusicXML, MXL, or MIDI file — and get back one clean, standardized score, ready to export.")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.ink.opacity(0.65))
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 520)
                }
                .padding(.top, 36)

                dropZone

                if let rejection = conversions.lastRejection {
                    Label(rejection, systemImage: "exclamationmark.triangle")
                        .font(.callout)
                        .foregroundStyle(Theme.clayDark)
                }

                if !engine.modelsDownloaded {
                    Label(
                        "First photo or PDF conversion also downloads the recognition models (about 110 MB) — that one run takes extra time.",
                        systemImage: "arrow.down.circle"
                    )
                    .font(.callout)
                    .foregroundStyle(Theme.ink.opacity(0.55))
                }

                infoCards
                    .padding(.bottom, 32)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 32)
        }
        .background(Theme.paper)
        .fileImporter(
            isPresented: $showingImporter,
            allowedContentTypes: ConversionManager.allowedContentTypes,
            allowsMultipleSelection: true
        ) { result in
            if case .success(let urls) = result {
                conversions.enqueue(urls: urls)
            }
        }
    }

    private var dropZone: some View {
        VStack(spacing: 10) {
            Image(systemName: "square.and.arrow.down")
                .font(.system(size: 26, weight: .medium))
                .foregroundStyle(Theme.ink.opacity(0.7))
                .frame(width: 56, height: 56)
                .background(Theme.haze, in: Circle())

            Text("Drop sheet music here")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Theme.ink)

            Text("or")
                .font(.caption)
                .foregroundStyle(Theme.ink.opacity(0.5))

            Button("Choose Files…") {
                showingImporter = true
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            Text("Images, PDF scans, MusicXML, MXL, or MIDI · iPhone HEIC photos welcome")
                .font(.caption)
                .foregroundStyle(Theme.ink.opacity(0.45))
                .padding(.top, 10)
        }
        .frame(maxWidth: 560)
        .padding(.vertical, 44)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(isDropTargeted ? Theme.clay.opacity(0.07) : Color.white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(
                    isDropTargeted ? Theme.clay : Theme.mist.opacity(0.5),
                    style: StrokeStyle(lineWidth: 1.5, dash: [7, 5])
                )
        )
        .frame(maxWidth: 640)
        .dropDestination(for: URL.self) { urls, _ in
            conversions.enqueue(urls: urls)
            return true
        } isTargeted: { targeted in
            isDropTargeted = targeted
        }
    }

    private var infoCards: some View {
        HStack(alignment: .top, spacing: 14) {
            InfoCard(
                icon: "checkmark.seal",
                tint: Theme.sage,
                title: "Already digital? It's exact",
                body: "MusicXML, MXL, and MIDI files are parsed from their exact data — no guessing, no misread notes. They're just re-typeset cleanly."
            )
            InfoCard(
                icon: "eye",
                tint: Theme.clayDark,
                title: "Photos take real recognition",
                body: "Scans and photos go through optical music recognition. It's good, not infallible — always check the result against your original."
            )
            InfoCard(
                icon: "macbook",
                tint: Theme.sky,
                title: "Runs entirely on your Mac",
                body: "Recognition runs locally, so a dense page can take a few minutes. Nothing you upload leaves this computer."
            )
        }
        .frame(maxWidth: 760)
    }
}

private struct InfoCard: View {
    let icon: String
    let tint: Color
    let title: String
    let text: String

    init(icon: String, tint: Color, title: String, body: String) {
        self.icon = icon
        self.tint = tint
        self.title = title
        self.text = body
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(tint)
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Theme.ink)
            Text(text)
                .font(.system(size: 12))
                .foregroundStyle(Theme.ink.opacity(0.6))
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Theme.ink.opacity(0.05))
        )
    }
}
