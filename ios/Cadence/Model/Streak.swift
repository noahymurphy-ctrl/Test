import Foundation

/// Streak math. Pure functions over day keys so they test without SwiftData.
///
/// Rules:
/// - A completed day extends the streak, scheduled or not.
/// - A missed *scheduled* day breaks it. Unscheduled days are skipped.
/// - Today never breaks a streak: it is still in progress until midnight.
enum Streak {

    static func current(completed: Set<DayKey>, weekdays: Set<Int>, today: DayKey) -> Int {
        guard let earliest = completed.min() else { return 0 }
        var day = completed.contains(today) ? today : today.adding(days: -1)
        var count = 0
        while day >= earliest {
            if completed.contains(day) {
                count += 1
            } else if weekdays.contains(day.weekday) {
                break
            }
            day = day.adding(days: -1)
        }
        return count
    }

    static func best(completed: Set<DayKey>, weekdays: Set<Int>, today: DayKey) -> Int {
        guard let earliest = completed.min(), let latest = completed.max() else { return 0 }
        let end = max(today, latest)
        var day = earliest, run = 0, best = 0
        while day <= end {
            if completed.contains(day) {
                run += 1
                best = max(best, run)
            } else if weekdays.contains(day.weekday) && day != today {
                run = 0
            }
            day = day.adding(days: 1)
        }
        return best
    }

    /// Share of scheduled days in `from...to` that were completed (0...1). Today counts only if done.
    static func rate(completed: Set<DayKey>, weekdays: Set<Int>, from: DayKey, to today: DayKey) -> Double {
        var day = from, scheduled = 0, done = 0
        while day <= today {
            let isDone = completed.contains(day)
            if weekdays.contains(day.weekday) && (day != today || isDone) {
                scheduled += 1
                if isDone { done += 1 }
            }
            day = day.adding(days: 1)
        }
        return scheduled == 0 ? 0 : Double(done) / Double(scheduled)
    }
}
