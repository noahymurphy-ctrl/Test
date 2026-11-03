import Foundation
import Observation

@MainActor
@Observable
final class BriefModel {
    enum Phase: Equatable {
        case idle
        case loading
        case ready(DailyBrief)
        case failed(String)
    }

    private(set) var phase: Phase = .idle
    private(set) var generatedAt: Date?

    private struct Cached: Codable {
        let fingerprint: String
        let brief: DailyBrief
        let generatedAt: Date
    }

    private static let cacheKey = "dailyBrief.cache"

    init() {
        if let data = UserDefaults.standard.data(forKey: Self.cacheKey),
           let cached = try? JSONDecoder().decode(Cached.self, from: data),
           Calendar.cadence.isDateInToday(cached.generatedAt) {
            phase = .ready(cached.brief)
            generatedAt = cached.generatedAt
        }
    }

    var brief: DailyBrief? {
        if case .ready(let b) = phase { return b }
        return nil
    }

    func generate(snapshot: HealthSnapshot, readiness: Readiness?, apiKey: String, force: Bool) async {
        if case .loading = phase { return }
        let fingerprint = Self.fingerprint(snapshot)
        if !force, brief != nil, cachedFingerprint == fingerprint { return }

        let hadBrief = brief
        phase = .loading
        do {
            let client = ClaudeClient(apiKey: apiKey)
            let result = try await client.structured(
                DailyBrief.self,
                system: CoachContext.system(for: snapshot, readiness: readiness),
                prompt: CoachContext.nowLine() + "\n\n" + DailyBriefPrompt.instruction,
                schema: DailyBriefPrompt.schema,
                effort: "medium"
            )
            phase = .ready(result)
            generatedAt = Date()
            let cached = Cached(fingerprint: fingerprint, brief: result, generatedAt: Date())
            UserDefaults.standard.set(try? JSONEncoder().encode(cached), forKey: Self.cacheKey)
        } catch {
            // Keep showing the previous brief if a refresh fails.
            phase = hadBrief.map { .ready($0) } ?? .failed(error.localizedDescription)
        }
    }

    func reset() {
        phase = .idle
        generatedAt = nil
        UserDefaults.standard.removeObject(forKey: Self.cacheKey)
    }

    private var cachedFingerprint: String? {
        guard let data = UserDefaults.standard.data(forKey: Self.cacheKey),
              let cached = try? JSONDecoder().decode(Cached.self, from: data) else { return nil }
        return cached.fingerprint
    }

    /// Regenerate only when the meaningful inputs change (new night of sleep, new recovery signals, a new day).
    private static func fingerprint(_ s: HealthSnapshot) -> String {
        let t = s.today
        return [
            t?.date.isoDay ?? "",
            s.isDemo ? "demo" : "live",
            t?.sleep?.id ?? "",
            t?.hrv.map { String(format: "%.0f", $0) } ?? "",
            t?.restingHeartRate.map { String(format: "%.0f", $0) } ?? "",
            s.workouts.first?.id ?? "",
        ].joined(separator: "|")
    }
}
