import Foundation

/// A transparent, on-device recovery estimate built from HRV, resting heart rate and sleep,
/// each compared against the user's own 28-day baseline. Not a medical measure.
struct Readiness: Equatable {
    struct Component: Equatable, Identifiable {
        let name: String
        let score: Double // 0...1
        let detail: String
        var id: String { name }
    }

    let score: Int
    let components: [Component]

    var label: String {
        switch score {
        case 80...: "Primed"
        case 65..<80: "Ready"
        case 50..<65: "Steady"
        default: "Recover"
        }
    }

    var guidance: String {
        switch score {
        case 80...: "Green light for a hard session."
        case 65..<80: "Good day for quality training."
        case 50..<65: "Keep intensity moderate."
        default: "Prioritize rest and easy movement."
        }
    }

    static func compute(from snapshot: HealthSnapshot) -> Readiness? {
        guard let today = snapshot.today else { return nil }
        var parts: [(Component, Double)] = []

        func zScore(_ metric: Metric, value: Double) -> Double? {
            guard let mean = snapshot.baseline(metric), let sd = snapshot.standardDeviation(metric), sd > 0 else { return nil }
            return (value - mean) / sd
        }

        func squash(_ z: Double) -> Double { min(max(0.5 + z / 4, 0), 1) }

        if let hrv = snapshot.latest(.hrv)?.value, let z = zScore(.hrv, value: hrv) {
            let pct = snapshot.baseline(.hrv).map { (hrv / $0 - 1) * 100 } ?? 0
            parts.append((Component(name: "HRV", score: squash(z), detail: String(format: "%+.0f%% vs baseline", pct)), 0.4))
        }

        if let rhr = snapshot.latest(.restingHeartRate)?.value, let z = zScore(.restingHeartRate, value: rhr) {
            let delta = snapshot.baseline(.restingHeartRate).map { rhr - $0 } ?? 0
            parts.append((Component(name: "Resting HR", score: squash(-z), detail: String(format: "%+.1f bpm vs baseline", delta)), 0.3))
        }

        if let sleep = today.sleep {
            let duration = min(sleep.hoursAsleep / 8.0, 1.05)
            let score = min(max(duration * 0.75 + sleep.efficiency * 0.25, 0), 1)
            parts.append((Component(name: "Sleep", score: score, detail: "\(Metric.sleep.format(sleep.hoursAsleep)) · \(Int(sleep.efficiency * 100))% efficient"), 0.3))
        }

        guard !parts.isEmpty else { return nil }
        let totalWeight = parts.reduce(0) { $0 + $1.1 }
        let weighted = parts.reduce(0) { $0 + $1.0.score * $1.1 } / totalWeight
        return Readiness(score: Int((weighted * 100).rounded()), components: parts.map(\.0))
    }
}
