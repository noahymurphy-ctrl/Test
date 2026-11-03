import Charts
import SwiftUI

// MARK: - Background

struct AppBackground: View {
    var accent: Color = Theme.violet

    var body: some View {
        ZStack {
            Theme.canvas
            Circle()
                .fill(accent.opacity(0.22))
                .frame(width: 420, height: 420)
                .blur(radius: 120)
                .offset(x: -140, y: -320)
            Circle()
                .fill(Theme.aqua.opacity(0.12))
                .frame(width: 360, height: 360)
                .blur(radius: 120)
                .offset(x: 170, y: -120)
        }
        .ignoresSafeArea()
    }
}

// MARK: - Card

struct Card<Content: View>: View {
    var padding: CGFloat = 18
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.canvasRaised.opacity(0.72), in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                    .strokeBorder(
                        LinearGradient(colors: [.white.opacity(0.16), .white.opacity(0.03)], startPoint: .top, endPoint: .bottom),
                        lineWidth: 1
                    )
            }
    }
}

/// Subtle press-down scale for tappable cards.
struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.975 : 1)
            .opacity(configuration.isPressed ? 0.9 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

struct SectionHeader: View {
    let title: String
    var trailing: String?

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.rounded(20, .bold))
                .foregroundStyle(Theme.textPrimary)
            Spacer()
            if let trailing {
                Text(trailing)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .padding(.horizontal, 4)
    }
}

struct IconBadge: View {
    let symbol: String
    let tint: Color
    var size: CGFloat = 30

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: size * 0.46, weight: .semibold))
            .foregroundStyle(tint)
            .frame(width: size, height: size)
            .background(tint.opacity(0.16), in: RoundedRectangle(cornerRadius: size * 0.32, style: .continuous))
    }
}

// MARK: - Score ring

struct ScoreRing: View {
    let score: Int
    var lineWidth: CGFloat = 14
    @State private var progress: Double = 0

    var body: some View {
        let color = Theme.readinessColor(score)
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.07), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    AngularGradient(colors: [color.opacity(0.35), color, color], center: .center,
                                    startAngle: .degrees(0), endAngle: .degrees(360 * max(progress, 0.01))),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .shadow(color: color.opacity(0.55), radius: 12)
            VStack(spacing: 0) {
                Text("\(score)")
                    .font(.rounded(46, .bold))
                    .monospacedDigit()
                    .contentTransition(.numericText(value: Double(score)))
                    .foregroundStyle(Theme.textPrimary)
                Text("RECOVERY")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1.6)
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .onAppear { animate() }
        .onChange(of: score) { animate() }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Recovery score \(score) out of 100")
    }

    private func animate() {
        withAnimation(.spring(response: 1.2, dampingFraction: 0.85).delay(0.1)) {
            progress = Double(score) / 100
        }
    }
}

// MARK: - Sparkline

struct Sparkline: View {
    let points: [(date: Date, value: Double)]
    let tint: Color
    var bars = false

    var body: some View {
        Chart {
            ForEach(points.indices, id: \.self) { i in
                let p = points[i]
                if bars {
                    BarMark(x: .value("Day", p.date, unit: .day), y: .value("Value", p.value))
                        .foregroundStyle(i == points.count - 1 ? tint : tint.opacity(0.35))
                        .cornerRadius(3)
                } else {
                    AreaMark(x: .value("Day", p.date), y: .value("Value", p.value))
                        .foregroundStyle(LinearGradient(colors: [tint.opacity(0.35), tint.opacity(0)], startPoint: .top, endPoint: .bottom))
                        .interpolationMethod(.catmullRom)
                    LineMark(x: .value("Day", p.date), y: .value("Value", p.value))
                        .foregroundStyle(tint)
                        .lineStyle(StrokeStyle(lineWidth: 2, lineCap: .round))
                        .interpolationMethod(.catmullRom)
                }
            }
        }
        .chartXAxis(.hidden)
        .chartYAxis(.hidden)
        .chartYScale(domain: yDomain)
        .chartLegend(.hidden)
        .allowsHitTesting(false)
    }

    private var yDomain: ClosedRange<Double> {
        let values = points.map(\.value)
        guard let lo = values.min(), let hi = values.max() else { return 0...1 }
        if bars { return 0...max(hi, 1) }
        let pad = max((hi - lo) * 0.25, 0.5)
        return (lo - pad)...(hi + pad)
    }
}

// MARK: - Delta chip

struct DeltaChip: View {
    let metric: Metric
    let value: Double
    let baseline: Double

    var body: some View {
        let delta = value - baseline
        let pct = baseline != 0 ? delta / baseline * 100 : 0
        let good: Bool? = metric.higherIsBetter.map { $0 ? delta >= 0 : delta <= 0 }
        let color = abs(pct) < 3 ? Theme.textSecondary : (good == nil ? Theme.sky : (good! ? Theme.mint : Theme.amber))

        HStack(spacing: 3) {
            Image(systemName: abs(pct) < 3 ? "equal" : (delta > 0 ? "arrow.up.right" : "arrow.down.right"))
                .font(.system(size: 9, weight: .heavy))
            Text(abs(pct) < 3 ? "Typical" : String(format: "%.0f%%", abs(pct)))
                .font(.system(size: 11, weight: .semibold))
                .monospacedDigit()
        }
        .foregroundStyle(color)
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(color.opacity(0.14), in: Capsule())
    }
}

// MARK: - Shimmer

struct Shimmer: ViewModifier {
    @State private var phase: CGFloat = -1

    func body(content: Content) -> some View {
        content
            .overlay {
                GeometryReader { geo in
                    LinearGradient(colors: [.clear, .white.opacity(0.18), .clear], startPoint: .leading, endPoint: .trailing)
                        .frame(width: geo.size.width * 0.6)
                        .offset(x: phase * geo.size.width * 1.6)
                }
                .mask(content)
                .allowsHitTesting(false)
            }
            .onAppear {
                withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) { phase = 1 }
            }
    }
}

extension View {
    func shimmering() -> some View { modifier(Shimmer()) }
}

struct SkeletonLine: View {
    var width: CGFloat? = nil
    var height: CGFloat = 12

    var body: some View {
        RoundedRectangle(cornerRadius: height / 2, style: .continuous)
            .fill(Color.white.opacity(0.08))
            .frame(maxWidth: width ?? .infinity)
            .frame(width: width, height: height)
    }
}

// MARK: - Claude mark

struct ClaudeSpark: View {
    var size: CGFloat = 16
    var animating = false
    @State private var rotation: Double = 0

    var body: some View {
        Image(systemName: "sparkle")
            .font(.system(size: size, weight: .semibold))
            .foregroundStyle(Theme.claudeGradient)
            .rotationEffect(.degrees(rotation))
            .onAppear {
                guard animating else { return }
                withAnimation(.linear(duration: 4).repeatForever(autoreverses: false)) { rotation = 360 }
            }
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    var gradient: LinearGradient = Theme.brandGradient

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.rounded(17, .semibold))
            .foregroundStyle(Color.black.opacity(0.85))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 17)
            .background(gradient, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: Theme.aqua.opacity(0.25), radius: 18, y: 8)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.rounded(17, .semibold))
            .foregroundStyle(Theme.textPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 17)
            .background(Color.white.opacity(configuration.isPressed ? 0.12 : 0.07),
                        in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(Theme.hairline))
    }
}
