import Foundation

/// Realistic, deterministic sample data so the app is fully explorable before connecting a Fitbit.
enum DemoData {
    static func snapshot(days: Int = 30, now: Date = Date()) -> HealthSnapshot {
        var rng = SeededRandom(seed: 42)
        let today = now.startOfDay
        var result: [DayMetrics] = []
        var workouts: [Workout] = []

        for offset in stride(from: days - 1, through: 0, by: -1) {
            let date = today.adding(days: -offset)
            var day = DayMetrics(date: date)
            let weekday = Calendar.cadence.component(.weekday, from: date)
            let isWeekend = weekday == 1 || weekday == 7
            let trend = Double(days - offset) / Double(days) // gentle improvement over the month
            let isToday = offset == 0
            let hourFraction = isToday ? min(max(now.timeIntervalSince(today) / 86_400, 0.25), 1) : 1

            let baseSteps = isWeekend ? 11_500.0 : 8_900.0
            day.steps = Int((baseSteps + rng.gaussian() * 2_200 + trend * 900) * hourFraction)
            day.distanceKm = Double(day.steps ?? 0) * 0.00076
            day.calories = (2_150 + Double(day.steps ?? 0) * 0.045 + rng.gaussian() * 90) * (isToday ? hourFraction : 1)
            day.activeMinutes = Int(max(18, 42 + rng.gaussian() * 16) * hourFraction)
            day.avgHeartRate = 71 + rng.gaussian() * 3

            // A rough patch ~10 days ago (late nights, a hard block) makes the trends interesting.
            let strain = (offset >= 8 && offset <= 11) ? 1.0 : 0.0
            day.restingHeartRate = 57.5 - trend * 1.8 + strain * 3.2 + rng.gaussian() * 1.1
            day.hrv = 48 + trend * 6 - strain * 9 + rng.gaussian() * 4.5
            day.spo2 = 96.4 + rng.gaussian() * 0.6
            day.respiratoryRate = 14.6 + strain * 0.6 + rng.gaussian() * 0.35

            // Sleep that ended this morning.
            let bedtimeShift = (isWeekend ? 50.0 : 0) + strain * 70 + rng.gaussian() * 25
            let bed = date.addingTimeInterval(-(60 * 60 * 1.5) + bedtimeShift * 60) // ~22:30
            let asleepMinutes = Int(max(300, 462 - strain * 70 + rng.gaussian() * 30 + trend * 12))
            day.sleep = makeNight(bed: bed, asleepMinutes: asleepMinutes, rng: &rng, id: "demo-sleep-\(offset)")

            // Workouts on a believable schedule.
            if [2, 4, 7].contains(weekday) || (weekday == 6 && offset % 2 == 0) {
                let kind = weekday == 7 ? ("Long Run", 74, 9.8) : weekday == 4 ? ("Strength Training", 48, 0.0) : ("Run", 38, 6.2)
                let startHour = weekday == 7 ? 8.5 : 18.25
                let w = Workout(
                    id: "demo-w-\(offset)",
                    name: kind.0,
                    start: date.addingTimeInterval(startHour * 3600),
                    durationMinutes: kind.1 + Int(rng.gaussian() * 4),
                    calories: Double(kind.1) * (kind.2 > 0 ? 11.2 : 7.4),
                    avgHeartRate: kind.2 > 0 ? 148 + rng.gaussian() * 5 : 118 + rng.gaussian() * 6,
                    distanceKm: kind.2 > 0 ? kind.2 + rng.gaussian() * 0.4 : nil,
                    activeZoneMinutes: kind.2 > 0 ? kind.1 + 12 : 22
                )
                if !(isToday && now < w.start) {
                    workouts.append(w)
                    day.activeZoneMinutes = (w.activeZoneMinutes ?? 0) + Int(max(0, 8 + rng.gaussian() * 6))
                }
            }
            if day.activeZoneMinutes == nil {
                day.activeZoneMinutes = Int(max(0, (14 + rng.gaussian() * 9) * hourFraction))
            }
            result.append(day)
        }

        return HealthSnapshot(days: result, workouts: workouts.sorted { $0.start > $1.start }, fetchedAt: now, isDemo: true)
    }

    private static func makeNight(bed: Date, asleepMinutes: Int, rng: inout SeededRandom, id: String) -> SleepNight {
        var segments: [SleepSegment] = []
        var cursor = bed
        var deep = 0, light = 0, rem = 0, awake = 0
        var asleepSoFar = 0

        func push(_ kind: SleepStageKind, _ minutes: Int) {
            let end = cursor.addingTimeInterval(Double(minutes) * 60)
            segments.append(SleepSegment(stage: kind, start: cursor, end: end))
            cursor = end
            switch kind {
            case .deep: deep += minutes; asleepSoFar += minutes
            case .light: light += minutes; asleepSoFar += minutes
            case .rem: rem += minutes; asleepSoFar += minutes
            case .awake: awake += minutes
            }
        }

        push(.awake, Int(max(4, 12 + rng.gaussian() * 5)))
        var cycle = 0
        while asleepSoFar + 35 < asleepMinutes {
            let deepShare = max(0.05, 0.32 - Double(cycle) * 0.07)
            let remShare = min(0.42, 0.14 + Double(cycle) * 0.07)
            let cycleLength = 90 + rng.gaussian() * 8
            push(.light, Int(cycleLength * 0.30))
            push(.deep, Int(cycleLength * deepShare))
            push(.light, Int(cycleLength * (0.68 - deepShare - remShare + 0.02)))
            push(.rem, Int(cycleLength * remShare))
            if rng.next() < 0.45 { push(.awake, Int(max(1, 3 + rng.gaussian() * 2))) }
            cycle += 1
        }
        push(.awake, Int(max(3, 8 + rng.gaussian() * 3)))

        return SleepNight(id: id, start: bed, end: cursor, minutesAsleep: asleepSoFar, minutesAwake: awake,
                          deep: deep, light: light, rem: rem, segments: segments)
    }
}

/// Small deterministic PRNG (SplitMix64) + Box–Muller gaussian.
struct SeededRandom {
    private var state: UInt64
    init(seed: UInt64) { state = seed }

    mutating func next() -> Double {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        z ^= z >> 31
        return Double(z >> 11) / Double(1 << 53)
    }

    mutating func gaussian() -> Double {
        let u1 = max(next(), 1e-12), u2 = next()
        return (-2 * log(u1)).squareRoot() * cos(2 * .pi * u2)
    }
}
