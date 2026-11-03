import Foundation

/// Builds the prompts Claude sees. The persona block never changes and the data block changes only when
/// a sync brings new numbers, so both are marked for prompt caching and follow-up questions are cheap.
enum CoachContext {
    static let persona = """
    You are Cadence, a personal health and performance analyst inside an iPhone app. The user wears a Fitbit; \
    their data comes from the Google Health API and is provided below.

    How to work:
    - Ground every claim in the user's actual numbers and name the specific days or values you're drawing on. \
    Compare against their own baseline rather than population norms whenever you can.
    - Look for relationships across metrics (e.g. late nights → lower HRV → higher resting HR), weekly rhythms, \
    and trends, not just single values. Say how confident you are when the signal is weak or data is missing.
    - Be specific and practical: concrete suggestions they can act on today or this week.
    - Today's step, calorie and zone-minute totals are partial because the day isn't over; don't treat them as low.
    - You are not a doctor. If something looks medically concerning (e.g. sustained resting-HR rise with low SpO₂), \
    say so plainly and suggest checking with a clinician, without being alarmist.
    - The Recovery score is the app's own estimate from HRV, resting HR and sleep vs. the 28-day baseline.

    Style: warm, direct, and concise, like a sharp coach texting a client. This is read on a phone: short paragraphs, \
    bullets when listing, **bold** for key numbers. No tables, no headers larger than ###, no preamble.
    """

    static func dataBlock(for snapshot: HealthSnapshot, readiness: Readiness?) -> String {
        var lines: [String] = []
        let tz = TimeZone.current.identifier
        lines.append("<health_data source=\"\(snapshot.isDemo ? "demo (synthetic sample data)" : "Fitbit via Google Health API")\" synced=\"\(snapshot.fetchedAt.formatted(.iso8601))\" timezone=\"\(tz)\">")

        if let readiness {
            let parts = readiness.components.map { "\($0.name) \(Int($0.score * 100))/100 (\($0.detail))" }.joined(separator: "; ")
            lines.append("Recovery score today: \(readiness.score)/100 (\(readiness.label)). Components: \(parts)")
        }

        lines.append("")
        lines.append("Baselines (prior 28 days, mean):")
        for metric in Metric.allCases {
            guard let mean = snapshot.baseline(metric) else { continue }
            let sd = snapshot.standardDeviation(metric).map { " ± \(metric.format($0))" } ?? ""
            lines.append("- \(metric.title): \(metric.format(mean))\(sd) \(metric.unit)")
        }

        lines.append("")
        lines.append("Daily log (oldest → newest; today last, partial). Sleep is the night ending that morning. Blank = no data.")
        lines.append("date | steps | km | kcal | zone min | active min | rest HR | HRV ms | SpO2 % | breaths/min | sleep (asleep; deep/light/REM/awake min; bed→wake)")
        let clock = DateFormatter()
        clock.locale = Locale(identifier: "en_US_POSIX")
        clock.dateFormat = "HH:mm"
        for day in snapshot.days {
            func v(_ x: Double?, _ digits: Int = 0) -> String { x.map { String(format: "%.\(digits)f", $0) } ?? "" }
            var sleep = ""
            if let s = day.sleep {
                sleep = "\(Metric.sleep.format(s.hoursAsleep)); \(s.deep)/\(s.light)/\(s.rem)/\(s.minutesAwake); \(clock.string(from: s.start))→\(clock.string(from: s.end))"
            }
            let weekday = day.date.formatted(.dateTime.weekday(.abbreviated))
            lines.append([
                "\(day.date.isoDay) \(weekday)",
                day.steps.map(String.init) ?? "",
                v(day.distanceKm, 1),
                v(day.calories),
                day.activeZoneMinutes.map(String.init) ?? "",
                day.activeMinutes.map(String.init) ?? "",
                v(day.restingHeartRate, 1),
                v(day.hrv, 1),
                v(day.spo2, 1),
                v(day.respiratoryRate, 1),
                sleep,
            ].joined(separator: " | "))
        }

        if !snapshot.workouts.isEmpty {
            lines.append("")
            lines.append("Workouts (newest first):")
            for w in snapshot.workouts.prefix(25) {
                var parts = ["\(w.start.formatted(.dateTime.year().month().day().hour().minute())) \(w.name)", "\(w.durationMinutes) min"]
                if let d = w.distanceKm, d > 0 { parts.append(String(format: "%.1f km", d)) }
                if let hr = w.avgHeartRate { parts.append("avg HR \(Int(hr))") }
                if let c = w.calories { parts.append("\(Int(c)) kcal") }
                if let z = w.activeZoneMinutes { parts.append("\(z) zone min") }
                lines.append("- " + parts.joined(separator: ", "))
            }
        }
        lines.append("</health_data>")
        return lines.joined(separator: "\n")
    }

    static func system(for snapshot: HealthSnapshot, readiness: Readiness?) -> [ClaudeClient.SystemBlock] {
        [
            .init(text: persona, cache: false),
            .init(text: dataBlock(for: snapshot, readiness: readiness), cache: true),
        ]
    }

    static func nowLine() -> String {
        "It is currently \(Date().formatted(.dateTime.weekday(.wide).month().day().hour().minute())) for the user."
    }
}
