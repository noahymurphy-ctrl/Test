import Foundation
import Observation

@MainActor
@Observable
final class CoachModel {
    struct Message: Identifiable, Equatable {
        enum Role { case user, assistant }
        let id = UUID()
        let role: Role
        var text: String
        var thinking: String = ""
        var isStreaming = false
        var failed = false
    }

    private(set) var messages: [Message] = []
    private(set) var isResponding = false

    /// Frozen at the start of a conversation so the cached prompt prefix stays byte-identical across turns.
    @ObservationIgnored private var system: [ClaudeClient.SystemBlock]?
    /// What Claude actually sees. Append-only: earlier turns are never rewritten.
    @ObservationIgnored private var turns: [ClaudeClient.Turn] = []
    @ObservationIgnored private var task: Task<Void, Never>?

    static let suggestions = [
        "How did my sleep affect my recovery this week?",
        "What's driving my HRV trend?",
        "Am I training too hard or not enough?",
        "What should I change to sleep better?",
        "Compare this week to last week",
        "Plan my training for the next 3 days",
    ]

    func send(_ text: String, snapshot: HealthSnapshot, readiness: Readiness?, apiKey: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isResponding else { return }

        if system == nil { system = CoachContext.system(for: snapshot, readiness: readiness) }
        let wireText = turns.isEmpty ? CoachContext.nowLine() + "\n\n" + trimmed : trimmed

        messages.append(Message(role: .user, text: trimmed))
        messages.append(Message(role: .assistant, text: "", isStreaming: true))
        let assistantID = messages[messages.count - 1].id
        turns.append(.init(role: .user, text: wireText))
        isResponding = true

        let client = ClaudeClient(apiKey: apiKey)
        let system = system ?? []
        let turnsSnapshot = turns

        task = Task { [weak self] in
            var reply = ""
            var stopReason: String?
            do {
                for try await event in client.stream(system: system, turns: turnsSnapshot) {
                    guard let self else { return }
                    switch event {
                    case .thinking(let t): self.update(assistantID) { $0.thinking += t }
                    case .text(let t):
                        reply += t
                        self.update(assistantID) { $0.text += t }
                    case .finished(let reason): stopReason = reason
                    }
                }
                guard let self else { return }
                if stopReason == "refusal" {
                    self.update(assistantID) {
                        $0.text += ($0.text.isEmpty ? "" : "\n\n") + (ClaudeError.refusal.errorDescription ?? "")
                        $0.failed = reply.isEmpty
                    }
                }
                if !reply.isEmpty {
                    self.turns.append(.init(role: .assistant, text: reply))
                } else {
                    // Nothing usable came back: drop the dangling user turn so the next send stays valid.
                    self.turns.removeLast()
                }
            } catch {
                guard let self else { return }
                let cancelled = error is CancellationError || (error as? URLError)?.code == .cancelled
                if reply.isEmpty {
                    self.turns.removeLast()
                    self.update(assistantID) {
                        $0.text = cancelled ? "Stopped." : (error.localizedDescription)
                        $0.failed = !cancelled
                    }
                } else {
                    self.turns.append(.init(role: .assistant, text: reply))
                }
            }
            self?.update(assistantID) { $0.isStreaming = false }
            self?.isResponding = false
        }
    }

    func stop() { task?.cancel() }

    func reset() {
        task?.cancel()
        messages = []
        turns = []
        system = nil
        isResponding = false
    }

    private func update(_ id: UUID, _ change: (inout Message) -> Void) {
        guard let i = messages.firstIndex(where: { $0.id == id }) else { return }
        change(&messages[i])
    }
}
