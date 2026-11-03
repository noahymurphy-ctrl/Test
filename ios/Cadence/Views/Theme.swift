import SwiftUI
import UIKit

enum Theme {
    /// Warm off-white in light mode, near-black in dark.
    static let paper = dynamic(light: (0.949, 0.937, 0.914), dark: (0.055, 0.055, 0.051))
    /// Near-black in light mode, warm off-white in dark.
    static let ink = dynamic(light: (0.078, 0.078, 0.075), dark: (0.937, 0.922, 0.890))
    /// The app's single global accent: today, a finished day.
    static let accent = Accent.vermilion.color

    static func title(_ size: CGFloat) -> Font { .system(size: size, weight: .heavy, design: .rounded) }
    static func mono(_ size: CGFloat = 11, weight: Font.Weight = .medium) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }

    private static func dynamic(light: (Double, Double, Double), dark: (Double, Double, Double)) -> Color {
        Color(UIColor { traits in
            let c = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(red: c.0, green: c.1, blue: c.2, alpha: 1)
        })
    }
}

/// Small uppercase monospaced label, styled like a technical readout.
struct Readout: View {
    let text: String
    var size: CGFloat = 11
    var opacity: Double = 0.55

    init(_ text: String, size: CGFloat = 11, opacity: Double = 0.55) {
        self.text = text
        self.size = size
        self.opacity = opacity
    }

    var body: some View {
        Text(text.uppercased())
            .font(Theme.mono(size))
            .tracking(1.2)
            .foregroundStyle(Theme.ink.opacity(opacity))
    }
}

/// Faint dot grid behind the Today screen.
struct DotGrid: View {
    var spacing: CGFloat = 14
    var radius: CGFloat = 0.8
    var opacity: Double = 0.09

    var body: some View {
        Canvas { ctx, size in
            var path = Path()
            var y = spacing / 2
            while y < size.height {
                var x = spacing / 2
                while x < size.width {
                    path.addEllipse(in: CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2))
                    x += spacing
                }
                y += spacing
            }
            ctx.fill(path, with: .color(Theme.ink.opacity(opacity)))
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

enum Fmt {
    static func date(_ day: DayKey, _ pattern: String) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = pattern
        return f.string(from: day.anchor).uppercased()
    }

    static func pad(_ n: Int, _ width: Int = 2) -> String {
        String(repeating: "0", count: max(0, width - String(n).count)) + String(n)
    }

    static let weekdayLetters = ["S", "M", "T", "W", "T", "F", "S"]
}
