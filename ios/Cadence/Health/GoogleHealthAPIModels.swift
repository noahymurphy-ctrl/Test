import Foundation

// Wire types for the Google Health API v4 (https://health.googleapis.com/v4),
// the successor to the legacy Fitbit Web API. Field names follow the API's
// discovery document. int64 values arrive as JSON strings, so numeric fields
// decode through `FlexNumber`.

struct FlexNumber: Decodable, Hashable {
    let value: Double

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let d = try? c.decode(Double.self) {
            value = d
        } else if let s = try? c.decode(String.self), let d = Double(s) {
            value = d
        } else {
            throw DecodingError.dataCorruptedError(in: c, debugDescription: "Expected number or numeric string")
        }
    }
}

struct APIDate: Codable, Hashable {
    var year: Int
    var month: Int
    var day: Int

    init(_ date: Date) {
        let c = Calendar.cadence.dateComponents([.year, .month, .day], from: date)
        year = c.year ?? 1970
        month = c.month ?? 1
        day = c.day ?? 1
    }

    var localDate: Date? {
        Calendar.cadence.date(from: DateComponents(year: year, month: month, day: day))
    }
}

struct APITimeOfDay: Codable, Hashable {
    var hours: Int?
    var minutes: Int?
    var seconds: Int?
    var nanos: Int?
}

struct APICivilDateTime: Codable, Hashable {
    var date: APIDate
    var time: APITimeOfDay?

    static func midnight(_ date: Date) -> APICivilDateTime {
        APICivilDateTime(date: APIDate(date), time: APITimeOfDay(hours: 0, minutes: 0, seconds: 0, nanos: 0))
    }
}

// MARK: dailyRollUp

struct DailyRollUpRequest: Encodable {
    struct Range: Encodable {
        let start: APICivilDateTime
        let end: APICivilDateTime
    }

    let range: Range
    let windowSizeDays: Int
    let pageSize: Int?
    let pageToken: String?
}

struct DailyRollUpResponse: Decodable {
    let rollupDataPoints: [RollupDataPoint]?
    let nextPageToken: String?
}

struct RollupDataPoint: Decodable {
    struct Steps: Decodable { let countSum: FlexNumber? }
    struct Calories: Decodable { let kcalSum: FlexNumber? }
    struct Distance: Decodable { let millimetersSum: FlexNumber? }
    struct HeartRate: Decodable {
        let beatsPerMinuteAvg: FlexNumber?
        let beatsPerMinuteMin: FlexNumber?
        let beatsPerMinuteMax: FlexNumber?
    }
    struct ZoneMinutes: Decodable {
        let sumInFatBurnHeartZone: FlexNumber?
        let sumInCardioHeartZone: FlexNumber?
        let sumInPeakHeartZone: FlexNumber?

        var total: Double {
            (sumInFatBurnHeartZone?.value ?? 0) + (sumInCardioHeartZone?.value ?? 0) + (sumInPeakHeartZone?.value ?? 0)
        }
    }
    struct ActiveMinutes: Decodable {
        struct ByLevel: Decodable {
            let activeMinutesSum: FlexNumber?
            let activityLevel: String?
        }
        let activeMinutesRollupByActivityLevel: [ByLevel]?

        var total: Double {
            (activeMinutesRollupByActivityLevel ?? []).reduce(0) { $0 + ($1.activeMinutesSum?.value ?? 0) }
        }
    }

    let civilStartTime: APICivilDateTime?
    let steps: Steps?
    let totalCalories: Calories?
    let distance: Distance?
    let heartRate: HeartRate?
    let activeZoneMinutes: ZoneMinutes?
    let activeMinutes: ActiveMinutes?
}

// MARK: list

struct ListDataPointsResponse: Decodable {
    let dataPoints: [APIDataPoint]?
    let nextPageToken: String?
}

struct APIDataPoint: Decodable {
    struct DailyRHR: Decodable { let date: APIDate?; let beatsPerMinute: FlexNumber? }
    struct DailyHRV: Decodable { let date: APIDate?; let averageHeartRateVariabilityMilliseconds: FlexNumber? }
    struct DailySpO2: Decodable { let date: APIDate?; let averagePercentage: FlexNumber? }
    struct DailyResp: Decodable { let date: APIDate?; let breathsPerMinute: FlexNumber? }

    let name: String?
    let dailyRestingHeartRate: DailyRHR?
    let dailyHeartRateVariability: DailyHRV?
    let dailyOxygenSaturation: DailySpO2?
    let dailyRespiratoryRate: DailyResp?
    let sleep: APISleep?
    let exercise: APIExercise?
}

struct APISessionInterval: Decodable {
    let startTime: String?
    let endTime: String?
}

struct APISleep: Decodable {
    struct Summary: Decodable {
        struct Stage: Decodable { let type: String?; let minutes: FlexNumber? }
        let minutesAsleep: FlexNumber?
        let minutesAwake: FlexNumber?
        let minutesInSleepPeriod: FlexNumber?
        let stagesSummary: [Stage]?
    }
    struct Stage: Decodable {
        let type: String?
        let startTime: String?
        let endTime: String?
    }
    struct Metadata: Decodable {
        let mainSleep: Bool?
        let nap: Bool?
    }

    let interval: APISessionInterval?
    let summary: Summary?
    let stages: [Stage]?
    let metadata: Metadata?
}

struct APIExercise: Decodable {
    struct Metrics: Decodable {
        let caloriesKcal: FlexNumber?
        let averageHeartRateBeatsPerMinute: FlexNumber?
        let distanceMillimeters: FlexNumber?
        let activeZoneMinutes: FlexNumber?
    }

    let displayName: String?
    let exerciseType: String?
    let interval: APISessionInterval?
    let activeDuration: String?
    let metricsSummary: Metrics?
}

// MARK: errors

struct GoogleAPIErrorEnvelope: Decodable {
    struct Body: Decodable {
        struct Detail: Decodable { let reason: String? }
        let code: Int?
        let message: String?
        let status: String?
        let details: [Detail]?
    }
    let error: Body
}

extension String {
    /// `"OUTDOOR_RUN"` → `"Outdoor Run"`
    var humanizedEnum: String {
        split(separator: "_").map { $0.prefix(1) + $0.dropFirst().lowercased() }.joined(separator: " ")
    }
}
