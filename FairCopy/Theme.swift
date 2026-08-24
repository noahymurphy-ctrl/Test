import SwiftUI

/// Claude/Anthropic brand palette, matching the web app's tokens.
enum Theme {
    /// #141413 — primary text and dark fills
    static let ink = Color(red: 0x14 / 255.0, green: 0x14 / 255.0, blue: 0x13 / 255.0)
    /// #faf9f5 — the warm cream page background
    static let paper = Color(red: 0xFA / 255.0, green: 0xF9 / 255.0, blue: 0xF5 / 255.0)
    /// #b0aea5 — secondary elements
    static let mist = Color(red: 0xB0 / 255.0, green: 0xAE / 255.0, blue: 0xA5 / 255.0)
    /// #e8e6dc — subtle fills
    static let haze = Color(red: 0xE8 / 255.0, green: 0xE6 / 255.0, blue: 0xDC / 255.0)
    /// #d97757 — the terracotta/clay accent
    static let clay = Color(red: 0xD9 / 255.0, green: 0x77 / 255.0, blue: 0x57 / 255.0)
    /// #c15f3c — clay, darkened for text on light fills
    static let clayDark = Color(red: 0xC1 / 255.0, green: 0x5F / 255.0, blue: 0x3C / 255.0)
    /// #6a9bcc — secondary blue accent
    static let sky = Color(red: 0x6A / 255.0, green: 0x9B / 255.0, blue: 0xCC / 255.0)
    /// #788c5d — tertiary green accent
    static let sage = Color(red: 0x78 / 255.0, green: 0x8C / 255.0, blue: 0x5D / 255.0)
}
