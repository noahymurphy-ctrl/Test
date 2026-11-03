import SwiftUI

struct CoachView: View {
    @Environment(AppModel.self) private var model
    @State private var draft = ""
    @State private var sendTick = 0
    @FocusState private var inputFocused: Bool

    private var coach: CoachModel { model.coach }

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground(accent: Theme.ink)
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 22) {
                            if coach.messages.isEmpty {
                                emptyState
                            } else {
                                ForEach(coach.messages) { message in
                                    MessageView(message: message).id(message.id)
                                }
                            }
                            Color.clear.frame(height: 1).id("bottom")
                        }
                        .padding(.horizontal, 18)
                        .padding(.top, 8)
                        .padding(.bottom, 12)
                    }
                    .scrollIndicators(.hidden)
                    .scrollDismissesKeyboard(.interactively)
                    .onChange(of: coach.messages.last?.text) {
                        proxy.scrollTo("bottom", anchor: .bottom)
                    }
                    .onChange(of: coach.messages.count) {
                        withAnimation(.snappy) { proxy.scrollTo("bottom", anchor: .bottom) }
                    }
                }
            }
            .safeAreaInset(edge: .bottom) { inputBar }
            .navigationTitle("Coach")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.hidden, for: .navigationBar)
            .toolbar {
                if !coach.messages.isEmpty {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { coach.reset() } label: { Image(systemName: "square.and.pencil") }
                            .disabled(coach.isResponding)
                            .accessibilityLabel("New conversation")
                    }
                }
            }
        }
        .sensoryFeedback(.impact(weight: .light), trigger: sendTick)
    }

    // MARK: Empty state

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 26) {
            VStack(alignment: .leading, spacing: 14) {
                ZStack {
                    Circle().fill(Theme.chrome).opacity(0.18).frame(width: 64, height: 64).blur(radius: 6)
                    ClaudeSpark(size: 30, animating: true)
                }
                Text("Ask anything about\nyour health data.")
                    .font(.display(28, .bold))
                    .foregroundStyle(Theme.textPrimary)
                Text("Claude sees your last 30 days of sleep, recovery, heart and activity data from Fitbit.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.textSecondary)
            }
            .padding(.top, 30)

            if !model.hasClaudeKey {
                Button("Add your Claude API key") { model.showSettings = true }
                    .buttonStyle(PrimaryButtonStyle(gradient: Theme.chrome))
            }

            VStack(alignment: .leading, spacing: 10) {
                ForEach(CoachModel.suggestions, id: \.self) { suggestion in
                    Button { send(suggestion) } label: {
                        HStack {
                            Text(suggestion)
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(Theme.textPrimary)
                                .multilineTextAlignment(.leading)
                            Spacer(minLength: 8)
                            Image(systemName: "arrow.up.right").font(.caption.weight(.bold)).foregroundStyle(Theme.textTertiary)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(Theme.canvasRaised.opacity(0.85), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Theme.hairline))
                    }
                    .buttonStyle(PressableStyle())
                    .disabled(model.health.snapshot == nil)
                }
            }
        }
    }

    // MARK: Input

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("", text: $draft, prompt: Text("Ask Claude…").foregroundStyle(Theme.textTertiary), axis: .vertical)
                .lineLimit(1...5)
                .focused($inputFocused)
                .foregroundStyle(Theme.textPrimary)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .submitLabel(.send)
                .onSubmit { send(draft) }

            Button {
                if coach.isResponding { coach.stop() } else { send(draft) }
            } label: {
                Image(systemName: coach.isResponding ? "stop.fill" : "arrow.up")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.black)
                    .frame(width: 36, height: 36)
                    .background(canSend || coach.isResponding ? AnyShapeStyle(Theme.chrome) : AnyShapeStyle(Color.white.opacity(0.15)), in: Circle())
                    .contentTransition(.symbolEffect(.replace))
            }
            .disabled(!canSend && !coach.isResponding)
            .padding(.trailing, 6)
            .padding(.bottom, 6)
            .accessibilityLabel(coach.isResponding ? "Stop" : "Send")
        }
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(Theme.hairline))
        .padding(.horizontal, 12)
        .padding(.bottom, 8)
    }

    private var canSend: Bool {
        !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && model.health.snapshot != nil
    }

    private func send(_ text: String) {
        guard let snapshot = model.health.snapshot, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        coach.send(text, snapshot: snapshot, readiness: model.readiness, apiKey: model.claudeAPIKey)
        draft = ""
        sendTick += 1
    }
}

// MARK: - Message

private struct MessageView: View {
    let message: CoachModel.Message

    var body: some View {
        switch message.role {
        case .user:
            HStack {
                Spacer(minLength: 48)
                Text(message.text)
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.textPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 11)
                    .background(Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .textSelection(.enabled)
            }
            .transition(.move(edge: .bottom).combined(with: .opacity))
        case .assistant:
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 7) {
                    ClaudeSpark(size: 12, animating: message.isStreaming)
                    Text("Claude").font(.caption.weight(.semibold)).foregroundStyle(Theme.textTertiary)
                }
                if message.text.isEmpty && message.isStreaming {
                    ThinkingIndicator(summary: message.thinking)
                } else if message.failed {
                    Label(message.text, systemImage: "exclamationmark.triangle.fill")
                        .font(.subheadline)
                        .foregroundStyle(Theme.ink)
                } else {
                    MarkdownText(text: message.text)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .transition(.opacity)
        }
    }
}

private struct ThinkingIndicator: View {
    let summary: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                TimelineView(.animation) { context in
                    let t = context.date.timeIntervalSinceReferenceDate * 5
                    HStack(spacing: 5) {
                        ForEach(0..<3) { i in
                            let wave = sin(t - Double(i) * 0.9)
                            Circle()
                                .fill(Theme.chrome)
                                .frame(width: 7, height: 7)
                                .scaleEffect(1 + 0.3 * wave)
                                .opacity(0.55 + 0.45 * wave)
                        }
                    }
                }
                Text("Analyzing your data").font(.footnote.weight(.medium)).foregroundStyle(Theme.textTertiary)
            }
            if let line = latestLine {
                Text(line)
                    .font(.footnote)
                    .italic()
                    .foregroundStyle(Theme.textTertiary.opacity(0.8))
                    .lineLimit(2)
                    .transition(.opacity)
                    .id(line)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: latestLine)
    }

    /// The most recent sentence of the summarized reasoning, as a quiet progress hint.
    private var latestLine: String? {
        let trimmed = summary.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let lines = trimmed.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        return lines.last.map { $0.replacingOccurrences(of: "**", with: "") }
    }
}
