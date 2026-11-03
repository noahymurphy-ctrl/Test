import Charts
import SwiftUI

struct MetricDetailView: View {
    @Environment(AppModel.self) private var model
    let metric: Metric

    @State private var range: TrendRange = .month
    @State private var selection: Date?

    var body: some View {
        ZStack {
            AppBackground(accent: metric.tint)
            if let snapshot = model.health.snapshot {
                content(snapshot)
            }
        }
        .navigationTitle(metric.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .sensoryFeedback(.selection, trigger: selection.map { Calendar.cadence.startOfDay(for: $0) })
    }

    private func content(_ snapshot: HealthSnapshot) -> some View {
        let points = snapshot.values(metric, lastDays: range.rawValue)
        let complete = points.filter { !(metric.accumulatesDuringDay && Calendar.cadence.isDateInToday($0.date)) }
        let values = complete.map(\.value)
        let average = values.isEmpty ? nil : values.reduce(0, +) / Double(values.count)
        let shown = selection.flatMap { s in points.first { Calendar.cadence.isDate($0.date, inSameDayAs: s) } } ?? points.last

        return ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Hero value
                VStack(alignment: .leading, spacing: 4) {
                    Text(shown.map { label(for: $0.date) } ?? "No data")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Theme.textTertiary)
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text(shown.map { metric.format($0.value) } ?? "—")
                            .font(.rounded(52, .bold))
                            .monospacedDigit()
                            .contentTransition(.numericText())
                            .foregroundStyle(Theme.textPrimary)
                        if metric != .sleep {
                            Text(metric.unit).font(.title3.weight(.medium)).foregroundStyle(Theme.textTertiary)
                        }
                    }
                    .animation(.snappy, value: shown?.value)
                }
                .padding(.horizontal, 4)

                Card {
                    VStack(spacing: 14) {
                        Picker("Range", selection: $range) {
                            ForEach(TrendRange.allCases) { Text($0.label).tag($0) }
                        }
                        .pickerStyle(.segmented)
                        MetricChart(metric: metric, points: points, average: average, selectable: true, selection: $selection)
                            .frame(height: 240)
                    }
                }

                stats(values: values, snapshot: snapshot)

                Card {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("About \(metric.title)").font(.headline).foregroundStyle(Theme.textPrimary)
                        Text(explainer)
                            .font(.subheadline)
                            .foregroundStyle(Theme.textSecondary)
                            .lineSpacing(3)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                Button {
                    model.ask("Analyze my \(metric.title.lowercased()) over the last \(range.rawValue) days. What's driving the pattern, and what should I do about it?")
                } label: {
                    HStack(spacing: 10) {
                        ClaudeSpark(size: 15)
                        Text("Ask Claude about \(metric.title)")
                    }
                }
                .buttonStyle(PrimaryButtonStyle(gradient: Theme.claudeGradient))
                .padding(.top, 4)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .scrollIndicators(.hidden)
    }

    private func stats(values: [Double], snapshot: HealthSnapshot) -> some View {
        let half = values.count / 2
        let firstHalf = values.prefix(half), secondHalf = values.suffix(values.count - half)
        let trend: Double? = (half >= 2)
            ? (secondHalf.reduce(0, +) / Double(secondHalf.count)) - (firstHalf.reduce(0, +) / Double(firstHalf.count))
            : nil

        return HStack(spacing: 10) {
            statTile("Average", values.isEmpty ? "—" : metric.format(values.reduce(0, +) / Double(values.count)))
            statTile("Low", values.min().map(metric.format) ?? "—")
            statTile("High", values.max().map(metric.format) ?? "—")
            statTile("Trend", trend.map { ($0 >= 0 ? "+" : "−") + metric.formatShort(abs($0)) } ?? "—",
                     color: trendColor(trend))
        }
    }

    private func statTile(_ title: String, _ value: String, color: Color = Theme.textPrimary) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased()).font(.system(size: 10, weight: .bold)).tracking(1).foregroundStyle(Theme.textTertiary)
            Text(value)
                .font(.rounded(16, .bold)).monospacedDigit()
                .foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.canvasRaised.opacity(0.8), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Theme.hairline))
    }

    private func trendColor(_ trend: Double?) -> Color {
        guard let trend, let better = metric.higherIsBetter, abs(trend) > 0.0001 else { return Theme.textPrimary }
        return (trend > 0) == better ? Theme.mint : Theme.amber
    }

    private func label(for date: Date) -> String {
        if Calendar.cadence.isDateInToday(date) { return metric.accumulatesDuringDay ? "TODAY SO FAR" : "TODAY" }
        if Calendar.cadence.isDateInYesterday(date) { return "YESTERDAY" }
        return date.formatted(.dateTime.weekday(.wide).month().day()).uppercased()
    }

    private var explainer: String {
        switch metric {
        case .steps: "A simple, reliable signal of daily movement. Consistency across the week matters more than any single big day."
        case .sleep: "Time actually asleep, excluding time awake in bed. Most adults recover best with 7–9 hours and a consistent schedule."
        case .restingHeartRate: "Measured while you sleep. A rise of several bpm above your baseline often signals stress, illness, alcohol or accumulated fatigue."
        case .hrv: "Heart rate variability reflects how well your nervous system is recovering. Compare it only against your own baseline; higher than usual generally means better recovered."
        case .activeZoneMinutes: "Minutes spent in fat-burn, cardio and peak heart-rate zones. Guidelines suggest about 150 per week."
        case .calories: "Total energy burned, including your resting metabolism. Today's value keeps growing until midnight."
        case .spo2: "Average blood oxygen saturation during sleep. Most healthy readings sit between 95% and 100%."
        case .respiratoryRate: "Breaths per minute during sleep. It's usually very stable, so a sustained change is worth noticing."
        }
    }
}
