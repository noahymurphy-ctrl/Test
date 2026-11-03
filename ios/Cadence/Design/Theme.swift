import SwiftUI

/// Monochrome design language: true black, smoked-glass tiles, white "ink" at a few opacities,
/// dot-matrix numerals and small monospaced caps labels.
enum Theme {
    // Surfaces
    static let canvas = Color.black
    static let canvasRaised = Color(white: 0.085)
    static let tileTop = Color(white: 0.135)
    static let tileBottom = Color(white: 0.085)
    static let hairline = Color.white.opacity(0.09)

    // Ink
    static let ink = Color.white
    static let inkDim = Color.white.opacity(0.55)
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.6)
    static let textTertiary = Color.white.opacity(0.38)
    static let dotOff = Color.white.opacity(0.1)

    /// Brushed-silver fill for primary actions.
    static let chrome = LinearGradient(
        colors: [Color(white: 0.98), Color(white: 0.78), Color(white: 0.92)],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    static let cardRadius: CGFloat = 30

    static func readinessColor(_ score: Int) -> Color { ink }

    static func toneColor(_ tone: DailyBrief.Insight.Tone) -> Color {
        tone == .caution ? inkDim : ink
    }

    static func toneSymbol(_ tone: DailyBrief.Insight.Tone) -> String {
        switch tone {
        case .positive: "arrow.up.right"
        case .neutral: "minus"
        case .caution: "exclamationmark"
        }
    }
}

extension Metric {
    /// Everything is drawn in white ink; metrics are told apart by label and glyph, not hue.
    var tint: Color { Theme.ink }
}

extension SleepStageKind {
    /// Deeper sleep = brighter ink.
    var color: Color {
        switch self {
        case .deep: Color.white
        case .rem: Color.white.opacity(0.7)
        case .light: Color.white.opacity(0.42)
        case .awake: Color.white.opacity(0.2)
        }
    }
}

extension Font {
    /// SF Pro, for titles and body copy.
    static func display(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }

    /// Small monospaced caps, for widget-style labels ("TOTAL STEPS").
    static func label(_ size: CGFloat = 11, _ weight: Font.Weight = .medium) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
}

/// `TOTAL STEPS`-style caption.
struct MonoLabel: View {
    let text: String
    var size: CGFloat = 11
    var color: Color = Theme.textTertiary

    init(_ text: String, size: CGFloat = 11, color: Color = Theme.textTertiary) {
        self.text = text
        self.size = size
        self.color = color
    }

    var body: some View {
        Text(text.uppercased())
            .font(.label(size))
            .tracking(size * 0.12)
            .foregroundStyle(color)
    }
}
