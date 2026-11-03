import Foundation

// MARK: - Domain models (what the UI and Claude see)

struct DayMetrics: Codable, Identifiable, Hashable {
    var date: Date
    var id: Date { date }

    var steps: Int?
    var distanceKm: Double?
    var calories: Double?
    var activeZoneMinutes: Int?
    var activeMinutes: Int?
    var avgHeartRate: Double?
    var restingHeartRate: Double?
    var hrv: Double?
    var spo2: Double?
    var respiratoryRate: Double?
    /// The main sleep that *ended* on this day (i.e. "last night" for this date).
    var sleep: SleepNight?

    init(date: Date) { self.date = date }
}

struct SleepNight: Codable, Identifiable, Hashable {
    var id: String
    var start: Date
    var end: Date
    var minutesAsleep: Int
    var minutesAwake: Int
    var deep: Int
    var light: Int
    var rem: Int
    var segments: [SleepSegment]

    var minutesInBed: Int { max(Int(end.timeIntervalSince(start) / 60), minutesAsleep) }
    var hoursAsleep: Double { Double(minutesAsleep) / 60 }
    var efficiency: Double { minutesInBed > 0 ? Double(minutesAsleep) / Double(minutesInBed) : 0 }
    var hasStages: Bool { deep + light + rem > 0 }
}

struct SleepSegment: Codable, Hashable {
    var stage: SleepStageKind
    var start: Date
    var end: Date
}

enum SleepStageKind: String, Codable, CaseIterable, Hashable {
    case awake, rem, light, deep

    var label: String {
        switch self {
        case .awake: "Awake"
        case .rem: "REM"
        case .light: "Light"
        case .deep: "Deep"
        }
    }

    /// Vertical order on a hypnogram (awake on top).
    var depth: Int {
        switch self {
        case .awake: 3
        case .rem: 2
        case .light: 1
        case .deep: 0
        }
    }
}

struct Workout: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var start: Date
    var durationMinutes: Int
    var calories: Double?
    var avgHeartRate: Double?
    var distanceKm: Double?
    var activeZoneMinutes: Int?
}

struct HealthSnapshot: Codable {
    /// Ascending by date; the last element is today.
    var days: [DayMetrics]
    var workouts: [Workout]
    var fetchedAt: Date
    var isDemo: Bool

    var today: DayMetrics? { days.last }

    var lastSleep: SleepNight? {
        days.reversed().lazy.compactMap(\.sleep).first
    }

    func values(_ metric: Metric, lastDays: Int? = nil) -> [(date: Date, value: Double)] {
        let slice = lastDays.map { Array(days.suffix($0)) } ?? days
        return slice.compactMap { day in metric.value(in: day).map { (day.date, $0) } }
    }

    /// Mean of the metric over the window *before* today (so today can be compared to it).
    func baseline(_ metric: Metric, window: Int = 28) -> Double? {
        let prior = days.dropLast().suffix(window).compactMap { metric.value(in: $0) }
        guard prior.count >= 3 else { return nil }
        return prior.reduce(0, +) / Double(prior.count)
    }

    func standardDeviation(_ metric: Metric, window: Int = 28) -> Double? {
        let prior = days.dropLast().suffix(window).compactMap { metric.value(in: $0) }
        guard prior.count >= 5 else { return nil }
        let mean = prior.reduce(0, +) / Double(prior.count)
        let variance = prior.map { ($0 - mean) * ($0 - mean) }.reduce(0, +) / Double(prior.count - 1)
        return variance.squareRoot()
    }

    /// Latest value, falling back to yesterday for metrics that are often not synced yet.
    func latest(_ metric: Metric) -> (date: Date, value: Double)? {
        for day in days.reversed().prefix(2) {
            if let v = metric.value(in: day) { return (day.date, v) }
        }
        return nil
    }
}

// MARK: - Metric catalog

enum Metric: String, CaseIterable, Identifiable, Codable {
    case steps, sleep, restingHeartRate, hrv, activeZoneMinutes, calories, spo2, respiratoryRate

    var id: String { rawValue }

    var title: String {
        switch self {
        case .steps: "Steps"
        case .sleep: "Sleep"
        case .restingHeartRate: "Resting HR"
        case .hrv: "HRV"
        case .activeZoneMinutes: "Zone Minutes"
        case .calories: "Energy"
        case .spo2: "Blood Oxygen"
        case .respiratoryRate: "Breathing Rate"
        }
    }

    var unit: String {
        switch self {
        case .steps: "steps"
        case .sleep: "hrs"
        case .restingHeartRate: "bpm"
        case .hrv: "ms"
        case .activeZoneMinutes: "min"
        case .calories: "kcal"
        case .spo2: "%"
        case .respiratoryRate: "br/min"
        }
    }

    var symbol: String {
        switch self {
        case .steps: "figure.walk"
        case .sleep: "moon.stars.fill"
        case .restingHeartRate: "heart.fill"
        case .hrv: "waveform.path.ecg"
        case .activeZoneMinutes: "bolt.heart.fill"
        case .calories: "flame.fill"
        case .spo2: "drop.fill"
        case .respiratoryRate: "lungs.fill"
        }
    }

    /// `true` = up is good, `false` = down is good, `nil` = neutral.
    var higherIsBetter: Bool? {
        switch self {
        case .restingHeartRate: false
        case .respiratoryRate, .spo2: nil
        default: true
        }
    }

    /// Bars for cumulative daily totals, lines for physiological signals.
    var prefersBars: Bool {
        switch self {
        case .steps, .activeZoneMinutes, .calories, .sleep: true
        default: false
        }
    }

    /// Whether today's value is a running total that is still accumulating.
    var accumulatesDuringDay: Bool {
        switch self {
        case .steps, .activeZoneMinutes, .calories: true
        default: false
        }
    }

    func value(in day: DayMetrics) -> Double? {
        switch self {
        case .steps: day.steps.map(Double.init)
        case .sleep: day.sleep?.hoursAsleep
        case .restingHeartRate: day.restingHeartRate
        case .hrv: day.hrv
        case .activeZoneMinutes: day.activeZoneMinutes.map(Double.init)
        case .calories: day.calories
        case .spo2: day.spo2
        case .respiratoryRate: day.respiratoryRate
        }
    }

    func format(_ value: Double) -> String {
        switch self {
        case .steps, .calories:
            return value.formatted(.number.precision(.fractionLength(0)))
        case .sleep:
            let total = Int((value * 60).rounded())
            return "\(total / 60)h \(String(format: "%02d", total % 60))m"
        case .restingHeartRate, .hrv, .activeZoneMinutes:
            return value.formatted(.number.precision(.fractionLength(0)))
        case .spo2, .respiratoryRate:
            return value.formatted(.number.precision(.fractionLength(1)))
        }
    }

    /// Format used in compact places where the unit is shown separately.
    func formatShort(_ value: Double) -> String {
        switch self {
        case .sleep: value.formatted(.number.precision(.fractionLength(1)))
        case .steps where value >= 10_000: (value / 1000).formatted(.number.precision(.fractionLength(1))) + "k"
        default: format(value)
        }
    }
}
