import Foundation

extension Calendar {
    static var cadence: Calendar {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        return cal
    }
}

extension Date {
    var startOfDay: Date { Calendar.cadence.startOfDay(for: self) }

    func adding(days: Int) -> Date {
        Calendar.cadence.date(byAdding: .day, value: days, to: self) ?? self
    }

    /// `YYYY-MM-DD` in the user's time zone.
    var isoDay: String {
        let c = Calendar.cadence.dateComponents([.year, .month, .day], from: self)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    var rfc3339UTC: String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        f.timeZone = TimeZone(identifier: "UTC")
        return f.string(from: self)
    }
}

enum RFC3339 {
    private static let fractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let plain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static func parse(_ string: String?) -> Date? {
        guard let string else { return nil }
        return fractional.date(from: string) ?? plain.date(from: string)
    }
}

/// Parses google-duration strings like `"3600s"` or `"1234.5s"`.
func parseGoogleDuration(_ string: String?) -> TimeInterval? {
    guard var s = string, s.hasSuffix("s") else { return nil }
    s.removeLast()
    return TimeInterval(s)
}
