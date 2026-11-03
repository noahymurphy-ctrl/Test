import Foundation

/// Claude's structured morning analysis, rendered as native cards on the Today screen.
struct DailyBrief: Codable, Equatable {
    struct Insight: Codable, Equatable, Identifiable, Hashable {
        enum Tone: String, Codable { case positive, neutral, caution }
        var title: String
        var detail: String
        var metric: String
        var tone: Tone
        var id: String { title }

        var relatedMetric: Metric? {
            switch metric {
            case "steps": .steps
            case "sleep": .sleep
            case "resting_heart_rate": .restingHeartRate
            case "hrv": .hrv
            case "active_zone_minutes": .activeZoneMinutes
            case "calories": .calories
            case "spo2": .spo2
            case "respiratory_rate": .respiratoryRate
            default: nil
            }
        }
    }

    struct Focus: Codable, Equatable {
        var title: String
        var detail: String
    }

    var headline: String
    var summary: String
    var insights: [Insight]
    var focus: Focus
}

enum DailyBriefPrompt {
    static let instruction = """
    Write today's brief for the user from their health data.
    - headline: 6–9 words capturing the single most important thing about how they're doing today.
    - summary: 2–3 sentences tying together recovery, sleep and recent activity, with specific numbers.
    - insights: exactly 3, each a distinct, non-obvious pattern or trend from the last 1–4 weeks, with numbers. \
    title ≤ 5 words; detail 1–2 sentences. metric is the most relevant metric key, or "general".
    - focus: one concrete thing to do today (title ≤ 6 words, detail 1–2 sentences), calibrated to their recovery.
    """

    static let schema: [String: Any] = [
        "type": "object",
        "properties": [
            "headline": ["type": "string"],
            "summary": ["type": "string"],
            "insights": [
                "type": "array",
                "items": [
                    "type": "object",
                    "properties": [
                        "title": ["type": "string"],
                        "detail": ["type": "string"],
                        "metric": [
                            "type": "string",
                            "enum": ["steps", "sleep", "resting_heart_rate", "hrv", "active_zone_minutes",
                                     "calories", "spo2", "respiratory_rate", "general"],
                        ],
                        "tone": ["type": "string", "enum": ["positive", "neutral", "caution"]],
                    ],
                    "required": ["title", "detail", "metric", "tone"],
                    "additionalProperties": false,
                ],
            ],
            "focus": [
                "type": "object",
                "properties": [
                    "title": ["type": "string"],
                    "detail": ["type": "string"],
                ],
                "required": ["title", "detail"],
                "additionalProperties": false,
            ],
        ],
        "required": ["headline", "summary", "insights", "focus"],
        "additionalProperties": false,
    ]
}
