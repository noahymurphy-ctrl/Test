import SwiftUI

enum Theme {
    // Surfaces
    static let canvas = Color(red: 0.027, green: 0.031, blue: 0.055)
    static let canvasRaised = Color(red: 0.055, green: 0.063, blue: 0.10)
    static let hairline = Color.white.opacity(0.08)

    // Text
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.62)
    static let textTertiary = Color.white.opacity(0.38)

    // Brand
    static let aqua = Color(red: 0.36, green: 0.92, blue: 0.85)
    static let violet = Color(red: 0.55, green: 0.45, blue: 1.0)
    static let coral = Color(red: 1.0, green: 0.48, blue: 0.42)
    static let amber = Color(red: 1.0, green: 0.76, blue: 0.36)
    static let mint = Color(red: 0.45, green: 0.95, blue: 0.6)
    static let sky = Color(red: 0.42, green: 0.7, blue: 1.0)
    static let rose = Color(red: 1.0, green: 0.42, blue: 0.62)

    static let brandGradient = LinearGradient(colors: [aqua, violet], startPoint: .topLeading, endPoint: .bottomTrailing)
    static let claudeGradient = LinearGradient(
        colors: [Color(red: 0.85, green: 0.52, blue: 0.36), Color(red: 0.98, green: 0.72, blue: 0.5)],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    static let cardRadius: CGFloat = 26

    static func readinessColor(_ score: Int) -> Color {
        switch score {
        case 80...: mint
        case 65..<80: aqua
        case 50..<65: amber
        default: coral
        }
    }

    static func toneColor(_ tone: DailyBrief.Insight.Tone) -> Color {
        switch tone {
        case .positive: mint
        case .neutral: sky
        case .caution: amber
        }
    }
}

extension Metric {
    var tint: Color {
        switch self {
        case .steps: Theme.aqua
        case .sleep: Theme.violet
        case .restingHeartRate: Theme.rose
        case .hrv: Theme.mint
        case .activeZoneMinutes: Theme.amber
        case .calories: Theme.coral
        case .spo2: Theme.sky
        case .respiratoryRate: Color(red: 0.6, green: 0.85, blue: 1.0)
        }
    }
}

extension SleepStageKind {
    var color: Color {
        switch self {
        case .awake: Theme.coral
        case .rem: Theme.sky
        case .light: Color(red: 0.5, green: 0.55, blue: 1.0)
        case .deep: Theme.violet
        }
    }
}

extension Font {
    static func rounded(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}
