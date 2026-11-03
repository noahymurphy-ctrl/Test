import XCTest
@testable import Cadence

final class StreakTests: XCTestCase {

    // MARK: Helpers

    private let daily = Set(1...7)
    private let mwf: Set<Int> = [2, 4, 6]

    private func d(_ y: Int, _ m: Int, _ day: Int) -> DayKey { DayKey(year: y, month: m, day: day) }

    private func tz(_ id: String) -> TimeZone { TimeZone(identifier: id)! }

    /// An instant given as local wall-clock time in a zone.
    private func instant(_ y: Int, _ m: Int, _ day: Int, _ h: Int, _ min: Int, _ s: Int = 0, in zone: String) -> Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = tz(zone)
        return cal.date(from: DateComponents(year: y, month: m, day: day, hour: h, minute: min, second: s))!
    }

    private func run(_ start: DayKey, count: Int) -> Set<DayKey> {
        Set((0..<count).map { start.adding(days: $0) })
    }

    // MARK: Basics

    func testEmptyIsZero() {
        XCTAssertEqual(Streak.current(completed: [], weekdays: daily, today: d(2026, 11, 3)), 0)
        XCTAssertEqual(Streak.best(completed: [], weekdays: daily, today: d(2026, 11, 3)), 0)
    }

    func testConsecutiveDaysEndingToday() {
        let done = run(d(2026, 10, 30), count: 5) // Oct 30 … Nov 3
        XCTAssertEqual(Streak.current(completed: done, weekdays: daily, today: d(2026, 11, 3)), 5)
    }

    func testTodayPendingDoesNotBreakStreak() {
        let done = run(d(2026, 10, 30), count: 4) // through Nov 2
        XCTAssertEqual(Streak.current(completed: done, weekdays: daily, today: d(2026, 11, 3)), 4)
    }

    func testMissedYesterdayBreaks() {
        let done: Set = [d(2026, 10, 31), d(2026, 11, 1)]
        XCTAssertEqual(Streak.current(completed: done, weekdays: daily, today: d(2026, 11, 3)), 0)
        XCTAssertEqual(Streak.current(completed: done.union([d(2026, 11, 3)]), weekdays: daily, today: d(2026, 11, 3)), 1)
    }

    func testUnscheduledDaysAreSkipped() {
        // Mon Nov 2, Wed Nov 4, Fri Nov 6 2026; Tue/Thu are off days.
        let done: Set = [d(2026, 11, 2), d(2026, 11, 4), d(2026, 11, 6)]
        XCTAssertEqual(Streak.current(completed: done, weekdays: mwf, today: d(2026, 11, 7)), 3)
        // Missing Wed breaks it.
        let gap: Set = [d(2026, 11, 2), d(2026, 11, 6)]
        XCTAssertEqual(Streak.current(completed: gap, weekdays: mwf, today: d(2026, 11, 7)), 1)
    }

    func testBestStreakAcrossGap() {
        let done = run(d(2026, 10, 1), count: 6).union(run(d(2026, 10, 10), count: 3))
        XCTAssertEqual(Streak.best(completed: done, weekdays: daily, today: d(2026, 10, 12)), 6)
        XCTAssertEqual(Streak.current(completed: done, weekdays: daily, today: d(2026, 10, 12)), 3)
    }

    // MARK: Midnight boundaries

    func testLastSecondAndFirstSecondAreDifferentDays() {
        let late = instant(2026, 11, 2, 23, 59, 59, in: "America/New_York")
        let early = instant(2026, 11, 3, 0, 0, 0, in: "America/New_York")
        let a = DayKey(late, in: tz("America/New_York"))
        let b = DayKey(early, in: tz("America/New_York"))
        XCTAssertEqual(a, d(2026, 11, 2))
        XCTAssertEqual(b, d(2026, 11, 3))
        XCTAssertEqual(a.days(to: b), 1)
    }

    func testCompletionAtOneSecondToMidnightKeepsStreakAfterMidnight() {
        let zone = tz("Europe/London")
        let done: Set = [
            DayKey(instant(2026, 11, 1, 9, 0, in: "Europe/London"), in: zone),
            DayKey(instant(2026, 11, 2, 23, 59, 59, in: "Europe/London"), in: zone),
        ]
        let justAfterMidnight = DayKey(instant(2026, 11, 3, 0, 0, 1, in: "Europe/London"), in: zone)
        XCTAssertEqual(Streak.current(completed: done, weekdays: daily, today: justAfterMidnight), 2)
    }

    func testMonthYearAndLeapBoundaries() {
        XCTAssertEqual(d(2026, 12, 31).adding(days: 1), d(2027, 1, 1))
        XCTAssertEqual(d(2028, 2, 28).adding(days: 1), d(2028, 2, 29))
        XCTAssertEqual(d(2028, 2, 29).adding(days: 1), d(2028, 3, 1))
        XCTAssertEqual(d(2027, 2, 28).adding(days: 1), d(2027, 3, 1))
        let done = run(d(2027, 12, 30), count: 4) // Dec 30 → Jan 2
        XCTAssertEqual(Streak.current(completed: done, weekdays: daily, today: d(2028, 1, 2)), 4)
    }

    // MARK: Time zones and DST

    func testTravelWestKeepsCapturedDay() {
        // Done at 23:30 in Los Angeles on Nov 2. That instant is already Nov 3 in New York.
        let doneAt = instant(2026, 11, 2, 23, 30, in: "America/Los_Angeles")
        let captured = DayKey(doneAt, in: tz("America/Los_Angeles"))
        XCTAssertEqual(captured, d(2026, 11, 2))
        XCTAssertEqual(DayKey(doneAt, in: tz("America/New_York")), d(2026, 11, 3))

        // User lands in New York. Today there is Nov 3, pending. Nov 2 still counts.
        let done: Set = [d(2026, 11, 1), captured]
        let todayNY = DayKey(instant(2026, 11, 3, 8, 0, in: "America/New_York"), in: tz("America/New_York"))
        XCTAssertEqual(Streak.current(completed: done, weekdays: daily, today: todayNY), 2)
    }

    func testFlyingBackAcrossDateLineWithFutureCompletion() {
        // Done on Nov 4 in Tokyo, then flew to LA where it is still Nov 3.
        let doneTokyo = instant(2026, 11, 4, 9, 0, in: "Asia/Tokyo")
        let done: Set = [d(2026, 11, 2), d(2026, 11, 3), DayKey(doneTokyo, in: tz("Asia/Tokyo"))]
        let todayLA = DayKey(instant(2026, 11, 3, 18, 0, in: "America/Los_Angeles"), in: tz("America/Los_Angeles"))
        XCTAssertEqual(todayLA, d(2026, 11, 3))
        XCTAssertEqual(Streak.current(completed: done, weekdays: daily, today: todayLA), 2)
        XCTAssertEqual(Streak.best(completed: done, weekdays: daily, today: todayLA), 3)
    }

    func testSameInstantDiffersByZone() {
        let instant = instant(2026, 11, 3, 12, 0, in: "UTC")
        XCTAssertEqual(DayKey(instant, in: tz("Pacific/Kiritimati")), d(2026, 11, 4)) // UTC+14
        XCTAssertEqual(DayKey(instant, in: tz("Pacific/Pago_Pago")), d(2026, 11, 3))  // UTC-11
    }

    func testSpringForwardDayIsOneDay() {
        // US DST starts Sun Mar 8 2026: that local day has 23 hours.
        let zone = tz("America/New_York")
        let keys = [
            DayKey(instant(2026, 3, 7, 23, 30, in: "America/New_York"), in: zone),
            DayKey(instant(2026, 3, 8, 3, 30, in: "America/New_York"), in: zone),
            DayKey(instant(2026, 3, 9, 0, 15, in: "America/New_York"), in: zone),
        ]
        XCTAssertEqual(keys, [d(2026, 3, 7), d(2026, 3, 8), d(2026, 3, 9)])
        XCTAssertEqual(Streak.current(completed: Set(keys), weekdays: daily, today: d(2026, 3, 9)), 3)
    }

    func testFallBackRepeatedHourIsSameDay() {
        // US DST ends Sun Nov 1 2026: 1:30 AM happens twice.
        let zone = tz("America/New_York")
        let first = instant(2026, 11, 1, 5, 30, in: "UTC")  // 1:30 EDT
        let second = instant(2026, 11, 1, 6, 30, in: "UTC") // 1:30 EST
        XCTAssertEqual(DayKey(first, in: zone), DayKey(second, in: zone))
        XCTAssertEqual(d(2026, 10, 31).adding(days: 2), d(2026, 11, 2))
        XCTAssertEqual(Streak.current(completed: run(d(2026, 10, 30), count: 4), weekdays: daily, today: d(2026, 11, 2)), 4)
    }

    // MARK: Misc

    func testWeekdayConvention() {
        XCTAssertEqual(d(2026, 11, 1).weekday, 1) // Sunday
        XCTAssertEqual(d(2026, 11, 7).weekday, 7) // Saturday
    }

    func testRawRoundTrip() {
        XCTAssertEqual(DayKey(raw: 20261103), d(2026, 11, 3))
        XCTAssertEqual(d(2026, 11, 3).raw, 20261103)
        XCTAssertNil(DayKey(raw: 20261300))
    }

    func testRateIgnoresPendingToday() {
        let done: Set = [d(2026, 11, 1), d(2026, 11, 2)]
        XCTAssertEqual(Streak.rate(completed: done, weekdays: daily, from: d(2026, 11, 1), to: d(2026, 11, 3)), 1.0)
        XCTAssertEqual(Streak.rate(completed: [d(2026, 11, 1)], weekdays: daily, from: d(2026, 11, 1), to: d(2026, 11, 3)), 0.5)
    }
}
