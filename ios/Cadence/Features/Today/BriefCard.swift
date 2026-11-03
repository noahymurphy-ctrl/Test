import SwiftUI

struct BriefCard: View {
    @Environment(AppModel.self) private var model
    @State private var expanded = true

    var body: some View {
        Card(padding: 20) {
            VStack(alignment: .leading, spacing: 16) {
                header
                content
            }
        }
        .overlay(alignment: .top) {
            // Hairline of Claude's color across the top edge.
            Capsule()
                .fill(Theme.claudeGradient)
                .frame(height: 2)
                .padding(.horizontal, 40)
                .opacity(0.7)
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.88), value: model.brief.phase)
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 9, style: .continuous).fill(Color(red: 0.85, green: 0.52, blue: 0.36).opacity(0.16))
                ClaudeSpark(size: 14, animating: model.brief.phase == .loading)
            }
            .frame(width: 30, height: 30)
            VStack(alignment: .leading, spacing: 1) {
                Text("Daily Brief").font(.headline).foregroundStyle(Theme.textPrimary)
                Text(subtitle).font(.caption).foregroundStyle(Theme.textTertiary)
            }
            Spacer()
            if model.hasClaudeKey, model.brief.phase != .loading {
                Button {
                    Task { await model.generateBriefIfNeeded(force: true) }
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.textSecondary)
                        .frame(width: 30, height: 30)
                        .background(Color.white.opacity(0.06), in: Circle())
                }
                .accessibilityLabel("Regenerate brief")
            }
        }
    }

    private var subtitle: String {
        if model.brief.phase == .loading { return "Claude is analyzing your last 30 days…" }
        if let at = model.brief.generatedAt { return "Claude · \(at.formatted(date: .omitted, time: .shortened))" }
        return "Powered by Claude"
    }

    @ViewBuilder
    private var content: some View {
        if !model.hasClaudeKey {
            VStack(alignment: .leading, spacing: 12) {
                Text("Add your Claude API key to get a personalized analysis of your sleep, recovery and training every morning.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.textSecondary)
                Button("Add API Key") { model.showSettings = true }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.claudeGradient)
            }
        } else {
            switch model.brief.phase {
            case .idle, .loading:
                skeleton
            case .failed(let message):
                VStack(alignment: .leading, spacing: 10) {
                    Label(message, systemImage: "exclamationmark.triangle.fill")
                        .font(.footnote)
                        .foregroundStyle(Theme.amber)
                    Button("Try Again") { Task { await model.generateBriefIfNeeded(force: true) } }
                        .font(.subheadline.weight(.semibold))
                }
            case .ready(let brief):
                BriefContent(brief: brief)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
            }
        }
    }

    private var skeleton: some View {
        VStack(alignment: .leading, spacing: 12) {
            SkeletonLine(width: 230, height: 18)
            SkeletonLine(height: 11)
            SkeletonLine(height: 11)
            SkeletonLine(width: 180, height: 11)
            HStack(spacing: 10) {
                ForEach(0..<2) { _ in
                    RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.white.opacity(0.06)).frame(height: 70)
                }
            }
            .padding(.top, 4)
        }
        .shimmering()
    }
}

private struct BriefContent: View {
    @Environment(AppModel.self) private var model
    let brief: DailyBrief

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(brief.headline)
                    .font(.rounded(21, .bold))
                    .foregroundStyle(Theme.textPrimary)
                    .fixedSize(horizontal: false, vertical: true)
                Text(brief.summary)
                    .font(.system(size: 15))
                    .foregroundStyle(Theme.textSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }

            VStack(spacing: 10) {
                ForEach(brief.insights) { insight in
                    InsightRow(insight: insight)
                }
            }

            // Today's focus
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "scope")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.claudeGradient)
                    .padding(.top, 2)
                VStack(alignment: .leading, spacing: 3) {
                    Text("TODAY'S FOCUS")
                        .font(.system(size: 10, weight: .bold)).tracking(1.4)
                        .foregroundStyle(Color(red: 0.98, green: 0.72, blue: 0.5))
                    Text(brief.focus.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.textPrimary)
                    Text(brief.focus.detail).font(.footnote).foregroundStyle(Theme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(red: 0.85, green: 0.52, blue: 0.36).opacity(0.1), in: RoundedRectangle(cornerRadius: 16, style: .continuous))

            Button {
                model.ask("Tell me more about today's brief: \(brief.headline)")
            } label: {
                HStack {
                    Text("Ask a follow-up")
                    Spacer()
                    Image(systemName: "arrow.right")
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.textPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(PressableStyle())
        }
    }
}

private struct InsightRow: View {
    let insight: DailyBrief.Insight

    var body: some View {
        let tone = Theme.toneColor(insight.tone)
        HStack(alignment: .top, spacing: 12) {
            IconBadge(symbol: insight.relatedMetric?.symbol ?? "lightbulb.fill",
                      tint: insight.relatedMetric?.tint ?? tone, size: 32)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(insight.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.textPrimary)
                    Circle().fill(tone).frame(width: 6, height: 6)
                }
                Text(insight.detail)
                    .font(.footnote)
                    .foregroundStyle(Theme.textSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }
}
