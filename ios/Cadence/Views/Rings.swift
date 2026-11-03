import SwiftUI

/// A number that counts to its new value instead of snapping.
/// Animate it by changing `value` inside an animation (see `Tuning.Motion.count`).
struct CountingNumber: View, Animatable {
    var value: Double
    var width: Int = 0
    var font: Font

    var animatableData: Double {
        get { value }
        set { value = newValue }
    }

    var body: some View {
        Text(Fmt.pad(Int(value.rounded()), width))
            .font(font)
            .monospacedDigit()
    }
}

/// Day progress as concentric rings: one heavy outer ring for the day,
/// one thin inner ring per habit (up to 6) that closes when that habit is done.
struct DayRings: View {
    let fraction: Double
    let items: [Bool]

    private let outerWidth: CGFloat = 11
    private let innerWidth: CGFloat = 2.5
    private let innerStep: CGFloat = 7

    var body: some View {
        let complete = fraction >= 1 && !items.isEmpty
        ZStack {
            ring(width: outerWidth, inset: 0, trim: fraction, color: complete ? Theme.accent : Theme.ink)
            ForEach(Array(items.prefix(6).enumerated()), id: \.offset) { i, done in
                ring(
                    width: innerWidth,
                    inset: outerWidth + 6 + CGFloat(i) * innerStep,
                    trim: done ? 1 : 0,
                    color: Theme.ink
                )
            }
            if complete {
                Circle()
                    .fill(Theme.accent)
                    .padding(outerWidth + 10 + CGFloat(min(items.count, 6)) * innerStep)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(Tuning.Motion.ring, value: fraction)
        .animation(Tuning.Motion.ring, value: items)
        .accessibilityElement()
        .accessibilityLabel("\(Int(fraction * 100)) percent of today done")
    }

    private func ring(width: CGFloat, inset: CGFloat, trim: Double, color: Color) -> some View {
        ZStack {
            Circle().stroke(Theme.ink.opacity(0.1), lineWidth: width)
            Circle()
                .trim(from: 0, to: trim)
                .stroke(color, style: StrokeStyle(lineWidth: width, lineCap: .butt))
                .rotationEffect(.degrees(-90))
        }
        .padding(inset + width / 2)
    }
}
