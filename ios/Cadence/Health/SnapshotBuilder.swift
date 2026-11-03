import Foundation

/// Raw API results for one sync, before they're merged into per-day metrics.
struct RawHealthData {
    var steps: [RollupDataPoint] = []
    var calories: [RollupDataPoint] = []
    var distance: [RollupDataPoint] = []
    var heartRate: [RollupDataPoint] = []
    var zoneMinutes: [RollupDataPoint] = []
    var activeMinutes: [RollupDataPoint] = []
    var restingHeartRate: [APIDataPoint] = []
    var hrv: [APIDataPoint] = []
    var spo2: [APIDataPoint] = []
    var respiratoryRate: [APIDataPoint] = []
    var sleep: [APIDataPoint] = []
    var exercise: [APIDataPoint] = []
}

enum SnapshotBuilder {
    static func build(_ raw: RawHealthData, start: Date, days: Int, now: Date = Date()) -> HealthSnapshot {
        var byDay: [Date: DayMetrics] = [:]
        for offset in 0..<days {
            let d = start.adding(days: offset).startOfDay
            byDay[d] = DayMetrics(date: d)
        }

        func rollupDay(_ point: RollupDataPoint) -> Date? {
            point.civilStartTime?.date.localDate?.startOfDay
        }

        func apply(_ points: [RollupDataPoint], _ update: (inout DayMetrics, RollupDataPoint) -> Void) {
            for p in points {
                guard let day = rollupDay(p), byDay[day] != nil else { continue }
                update(&byDay[day]!, p)
            }
        }

        apply(raw.steps) { d, p in d.steps = p.steps?.countSum.map { Int($0.value) } }
        apply(raw.calories) { d, p in d.calories = p.totalCalories?.kcalSum?.value }
        apply(raw.distance) { d, p in d.distanceKm = p.distance?.millimetersSum.map { $0.value / 1_000_000 } }
        apply(raw.heartRate) { d, p in d.avgHeartRate = p.heartRate?.beatsPerMinuteAvg?.value }
        apply(raw.zoneMinutes) { d, p in d.activeZoneMinutes = p.activeZoneMinutes.map { Int($0.total) } }
        apply(raw.activeMinutes) { d, p in d.activeMinutes = p.activeMinutes.map { Int($0.total) } }

        func applyDaily(_ points: [APIDataPoint], date: (APIDataPoint) -> APIDate?, value: (APIDataPoint) -> Double?,
                        _ set: (inout DayMetrics, Double) -> Void) {
            for p in points {
                guard let day = date(p)?.localDate?.startOfDay, byDay[day] != nil, let v = value(p) else { continue }
                set(&byDay[day]!, v)
            }
        }

        applyDaily(raw.restingHeartRate, date: { $0.dailyRestingHeartRate?.date },
                   value: { $0.dailyRestingHeartRate?.beatsPerMinute?.value }) { $0.restingHeartRate = $1 }
        applyDaily(raw.hrv, date: { $0.dailyHeartRateVariability?.date },
                   value: { $0.dailyHeartRateVariability?.averageHeartRateVariabilityMilliseconds?.value }) { $0.hrv = $1 }
        applyDaily(raw.spo2, date: { $0.dailyOxygenSaturation?.date },
                   value: { $0.dailyOxygenSaturation?.averagePercentage?.value }) { $0.spo2 = $1 }
        applyDaily(raw.respiratoryRate, date: { $0.dailyRespiratoryRate?.date },
                   value: { $0.dailyRespiratoryRate?.breathsPerMinute?.value }) { $0.respiratoryRate = $1 }

        // Sleep: attach each night to the day it ended on. Prefer the main sleep, else the longest.
        for (index, point) in raw.sleep.enumerated() {
            guard let night = sleepNight(from: point, fallbackID: "sleep-\(index)") else { continue }
            let day = night.end.startOfDay
            guard byDay[day] != nil else { continue }
            let isMain = point.sleep?.metadata?.mainSleep == true
            if let existing = byDay[day]!.sleep, !isMain, existing.minutesAsleep >= night.minutesAsleep { continue }
            byDay[day]!.sleep = night
        }

        let workouts = raw.exercise.enumerated().compactMap { index, point in
            workout(from: point, fallbackID: "exercise-\(index)")
        }
        .sorted { $0.start > $1.start }

        return HealthSnapshot(
            days: byDay.values.sorted { $0.date < $1.date },
            workouts: workouts,
            fetchedAt: now,
            isDemo: false
        )
    }

    static func sleepNight(from point: APIDataPoint, fallbackID: String) -> SleepNight? {
        guard let sleep = point.sleep,
              let start = RFC3339.parse(sleep.interval?.startTime),
              let end = RFC3339.parse(sleep.interval?.endTime), end > start else { return nil }

        var minutesByStage: [String: Int] = [:]
        for s in sleep.summary?.stagesSummary ?? [] {
            guard let type = s.type, let m = s.minutes?.value else { continue }
            minutesByStage[type, default: 0] += Int(m)
        }

        let segments: [SleepSegment] = (sleep.stages ?? []).compactMap { stage in
            guard let s = RFC3339.parse(stage.startTime), let e = RFC3339.parse(stage.endTime),
                  let kind = stageKind(stage.type) else { return nil }
            return SleepSegment(stage: kind, start: s, end: e)
        }
        .sorted { $0.start < $1.start }

        let inBed = Int(end.timeIntervalSince(start) / 60)
        let awake = sleep.summary?.minutesAwake.map { Int($0.value) } ?? minutesByStage["AWAKE"] ?? 0
        let asleep = sleep.summary?.minutesAsleep.map { Int($0.value) } ?? max(inBed - awake, 0)

        return SleepNight(
            id: point.name ?? fallbackID,
            start: start,
            end: end,
            minutesAsleep: asleep,
            minutesAwake: awake,
            deep: minutesByStage["DEEP"] ?? 0,
            light: minutesByStage["LIGHT"] ?? 0,
            rem: minutesByStage["REM"] ?? 0,
            segments: segments
        )
    }

    static func stageKind(_ raw: String?) -> SleepStageKind? {
        switch raw {
        case "AWAKE", "RESTLESS": .awake
        case "REM": .rem
        case "LIGHT", "ASLEEP": .light
        case "DEEP": .deep
        default: nil
        }
    }

    static func workout(from point: APIDataPoint, fallbackID: String) -> Workout? {
        guard let ex = point.exercise,
              let start = RFC3339.parse(ex.interval?.startTime) else { return nil }
        let end = RFC3339.parse(ex.interval?.endTime)
        let seconds = parseGoogleDuration(ex.activeDuration) ?? end.map { $0.timeIntervalSince(start) } ?? 0
        let name = ex.displayName?.isEmpty == false ? ex.displayName! : (ex.exerciseType ?? "Workout").humanizedEnum
        return Workout(
            id: point.name ?? fallbackID,
            name: name,
            start: start,
            durationMinutes: Int(seconds / 60),
            calories: ex.metricsSummary?.caloriesKcal?.value,
            avgHeartRate: ex.metricsSummary?.averageHeartRateBeatsPerMinute?.value,
            distanceKm: ex.metricsSummary?.distanceMillimeters.map { $0.value / 1_000_000 },
            activeZoneMinutes: ex.metricsSummary?.activeZoneMinutes.map { Int($0.value) }
        )
    }
}
