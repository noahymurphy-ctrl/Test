import Foundation
import SwiftData
import SwiftUI

@Model
final class Habit {
    var id: UUID = UUID()
    var name: String = ""
    var symbol: String = "circle"
    var accentRaw: String = Accent.vermilion.rawValue
    /// Calendar weekdays, 1 = Sunday … 7 = Saturday. All seven = daily.
    var weekdays: [Int] = Array(1...7)
    var sortOrder: Int = 0
    var createdAt: Date = Date.now

    @Relationship(deleteRule: .cascade, inverse: \Completion.habit)
    var completions: [Completion] = []

    init(name: String, symbol: String, accent: Accent, weekdays: [Int], sortOrder: Int) {
        self.name = name
        self.symbol = symbol
        self.accentRaw = accent.rawValue
        self.weekdays = weekdays
        self.sortOrder = sortOrder
    }

    var accent: Accent {
        get { Accent(rawValue: accentRaw) ?? .vermilion }
        set { accentRaw = newValue.rawValue }
    }

    var schedule: Set<Int> { Set(weekdays) }
    var isDaily: Bool { schedule.count == 7 }

    var completedDays: Set<DayKey> { Set(completions.compactMap { DayKey(raw: $0.day) }) }

    func isScheduled(on day: DayKey) -> Bool { schedule.contains(day.weekday) }

    func isDone(on day: DayKey) -> Bool { completions.contains { $0.day == day.raw } }

    /// Toggles completion for `day`. Returns the new state.
    @discardableResult
    func toggle(on day: DayKey, in context: ModelContext) -> Bool {
        if let existing = completions.first(where: { $0.day == day.raw }) {
            completions.removeAll { $0.day == day.raw }
            context.delete(existing)
            return false
        }
        let c = Completion(day: day)
        context.insert(c)
        completions.append(c)
        return true
    }

    func currentStreak(today: DayKey) -> Int {
        Streak.current(completed: completedDays, weekdays: schedule, today: today)
    }

    func bestStreak(today: DayKey) -> Int {
        Streak.best(completed: completedDays, weekdays: schedule, today: today)
    }

    /// Short technical ID, e.g. "H-3F2A".
    var tag: String { "H-" + id.uuidString.prefix(4) }
}

@Model
final class Completion {
    /// DayKey.raw (yyyymmdd) of the local day the habit was done.
    var day: Int = 0
    var completedAt: Date = Date.now
    var habit: Habit?

    init(day: DayKey) {
        self.day = day.raw
    }
}

/// The restricted accent palette. Used sparingly: completion marks and "today".
enum Accent: String, CaseIterable, Identifiable {
    case vermilion, signal, cobalt, ochre, ink

    var id: String { rawValue }

    var color: Color {
        switch self {
        case .vermilion: Color(red: 0.91, green: 0.29, blue: 0.11)
        case .signal: Color(red: 0.89, green: 0.17, blue: 0.15)
        case .cobalt: Color(red: 0.16, green: 0.29, blue: 0.86)
        case .ochre: Color(red: 0.86, green: 0.63, blue: 0.13)
        case .ink: Theme.ink
        }
    }

    var label: String { rawValue.uppercased() }
}
