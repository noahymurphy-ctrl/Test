import SwiftUI

struct LibraryListView: View {
    @Environment(LibraryStore.self) private var library
    @Environment(ConversionManager.self) private var conversions

    @Binding var selectedPieceID: String?

    var body: some View {
        List(selection: $selectedPieceID) {
            if !conversions.activeJobs.isEmpty {
                Section("Converting") {
                    ForEach(conversions.activeJobs) { job in
                        JobRowView(job: job)
                    }
                }
            }

            Section("Library") {
                if library.pieces.isEmpty {
                    Text("Converted scores will show up here.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .padding(.vertical, 4)
                } else {
                    ForEach(library.pieces) { piece in
                        PieceRowView(piece: piece)
                            .tag(piece.id)
                    }
                }
            }

            failedJobsSection
        }
        .listStyle(.sidebar)
        .navigationTitle("Fair Copy")
    }

    @ViewBuilder
    private var failedJobsSection: some View {
        let failed = conversions.jobs.filter { $0.status == .failed }
        if !failed.isEmpty {
            Section("Didn't convert") {
                ForEach(failed) { job in
                    JobRowView(job: job)
                }
            }
        }
    }
}

struct PieceRowView: View {
    let piece: Piece

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(piece.title)
                .font(.body.weight(.medium))
                .lineLimit(1)
            HStack(spacing: 6) {
                Text(piece.sourceKind.badgeLabel)
                    .font(.caption2.weight(.semibold))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 1.5)
                    .background(
                        (piece.sourceKind.isRecognized ? Theme.clay : Theme.sage).opacity(0.18),
                        in: Capsule()
                    )
                    .foregroundStyle(piece.sourceKind.isRecognized ? Theme.clayDark : Theme.sage)
                if !piece.warnings.isEmpty {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption2)
                        .foregroundStyle(Theme.clayDark)
                        .help("\(piece.warnings.count) note(s) to review")
                }
            }
        }
        .padding(.vertical, 2)
    }
}

struct JobRowView: View {
    let job: ConversionJob
    @Environment(ConversionManager.self) private var conversions

    var body: some View {
        HStack(spacing: 8) {
            switch job.status {
            case .queued:
                Image(systemName: "clock")
                    .foregroundStyle(.secondary)
            case .running:
                ProgressView()
                    .controlSize(.small)
            case .done:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Theme.sage)
            case .failed:
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(Theme.clayDark)
            }

            VStack(alignment: .leading, spacing: 1) {
                Text(job.filename)
                    .font(.callout.weight(.medium))
                    .lineLimit(1)
                Text(job.status == .failed ? (job.errorMessage ?? "Failed") : job.stage)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            Spacer(minLength: 0)

            if job.status == .failed {
                Button {
                    conversions.dismiss(job)
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.tertiary)
                }
                .buttonStyle(.plain)
                .help("Dismiss")
            }
        }
        .padding(.vertical, 2)
    }
}
