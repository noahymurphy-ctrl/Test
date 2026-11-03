import Foundation

/// A calendar day as the user experienced it, independent of time zone after capture.
///
/// A completion is stamped with the local day at the moment of tapping. Day arithmetic
/// runs on a fixed UTC Gregorian calendar, so DST shifts and travel never add or drop days.
struct DayKey: Hashable, Comparable, Sendable, CustomStringConvertible {
    let year: Int
    let month: Int
    let day: Int

    init(year: Int, month: Int, day: Int) {
        self.year = year
        self.month = month
        self.day = day
    }

    /// The local calendar day containing `date` in `timeZone`.
    init(_ date: Date, in timeZone: TimeZone = .current) {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let c = cal.dateComponents([.year, .month, .day], from: date)
        self.init(year: c.year!, month: c.month!, day: c.day!)
    }

    /// Storage form: yyyymmdd, e.g. 20261103.
    init?(raw: Int) {
        let y = raw / 10_000, m = (raw / 100) % 100, d = raw % 100
        guard (1...12).contains(m), (1...31).contains(d) else { return nil }
        self.init(year: y, month: m, day: d)
    }

    var raw: Int { year * 10_000 + month * 100 + day }

    static func today(now: Date = .now, in timeZone: TimeZone = .current) -> DayKey {
        DayKey(now, in: timeZone)
    }

    // MARK: Arithmetic (UTC, so every day is exactly one step)

    private static let utc: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }()

    /// Noon UTC on this day. Only for arithmetic and formatting.
    var anchor: Date {
        Self.utc.date(from: DateComponents(year: year, month: month, day: day, hour: 12))!
    }

    func adding(days n: Int) -> DayKey {
        DayKey(Self.utc.date(byAdding: .day, value: n, to: anchor)!, in: Self.utc.timeZone)
    }

    /// Whole days from `self` to `other` (positive if `other` is later).
    func days(to other: DayKey) -> Int {
        Self.utc.dateComponents([.day], from: anchor, to: other.anchor).day!
    }

    /// 1 = Sunday … 7 = Saturday (Calendar convention).
    var weekday: Int { Self.utc.component(.weekday, from: anchor) }

    /// Day of year, 1-based.
    var ordinal: Int { Self.utc.ordinality(of: .day, in: .year, for: anchor)! }

    static func < (a: DayKey, b: DayKey) -> Bool { a.raw < b.raw }

    var description: String { String(format: "%04d-%02d-%02d", year, month, day) }
}
