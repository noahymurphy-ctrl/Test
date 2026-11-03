import SwiftUI

/// Full-width habit capsule. An ink capsule sweeps in from the leading edge when done,
/// and the label inverts as the sweep passes under it.
struct HabitCapsule: View {
    let index: Int
    let name: String
    let symbol: String
    let accent: Accent
    let done: Bool
    let streak: Int

    @State private var fill: CGFloat = 0

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width, h = geo.size.height
            ZStack(alignment: .leading) {
                Theme.paper
                label(inverted: false)
                sweep(w: w, h: h, color: Theme.ink)
                label(inverted: true)
                    .mask(alignment: .leading) { sweep(w: w, h: h, color: .black) }
            }
            .clipShape(Capsule())
            .overlay(Capsule().strokeBorder(Theme.ink, lineWidth: 2))
        }
        .frame(height: Tuning.Layout.capsuleHeight)
        .onAppear { fill = done ? 1 : 0 }
        .onChange(of: done) { _, now in
            withAnimation(Tuning.Motion.fill) { fill = now ? 1 : 0 }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(name)
        .accessibilityValue(done ? "Done, \(streak) day streak" : "Not done, \(streak) day streak")
        .accessibilityAddTraits(.isButton)
        .accessibilityHint("Double tap to toggle. Touch and hold for history.")
    }

    /// A capsule wider than the row by one height, sliding in so its round end leads.
    private func sweep(w: CGFloat, h: CGFloat, color: Color) -> some View {
        Capsule()
            .fill(color)
            .frame(width: w + h, height: h)
            .offset(x: (fill - 1) * (w + h))
            .frame(width: w, height: h, alignment: .leading) // keep the oversize shape out of layout
    }

    private func label(inverted: Bool) -> some View {
        let fg = inverted ? Theme.paper : Theme.ink
        return HStack(spacing: 14) {
            disc(inverted: inverted)
            VStack(alignment: .leading, spacing: 3) {
                Text(name)
                    .font(Theme.title(20))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Text("№\(Fmt.pad(index + 1))")
                    .font(Theme.mono(10))
                    .tracking(1.2)
                    .opacity(0.55)
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 2) {
                CountingNumber(value: Double(streak), width: 2, font: Theme.mono(20, weight: .bold))
                    .animation(Tuning.Motion.count, value: streak)
                Text("STREAK")
                    .font(Theme.mono(9))
                    .tracking(1.2)
                    .opacity(0.55)
            }
        }
        .foregroundStyle(fg)
        .padding(.leading, 10)
        .padding(.trailing, 26)
        .frame(maxHeight: .infinity)
    }

    private func disc(inverted: Bool) -> some View {
        let size = Tuning.Layout.capsuleHeight - 20
        return ZStack {
            if inverted {
                Circle().fill(accent == .ink ? Theme.paper : accent.color)
                Image(systemName: symbol)
                    .foregroundStyle(accent == .ink ? Theme.ink : .white)
            } else {
                Circle().strokeBorder(Theme.ink, lineWidth: 2)
                Image(systemName: symbol).foregroundStyle(Theme.ink)
            }
        }
        .font(.system(size: 22, weight: .semibold))
        .frame(width: size, height: size)
    }
}
