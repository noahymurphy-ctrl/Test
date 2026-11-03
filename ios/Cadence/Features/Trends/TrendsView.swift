import Charts
import SwiftUI

enum TrendRange: Int, CaseIterable, Identifiable {
    case week = 7, fortnight = 14, month = 30
    var id: Int { rawValue }
    var label: String {
        switch self {
        case .week: "7D"
        case .fortnight: "14D"
        case .month: "30D"
        }
    }
}

struct TrendsView: View {
    @Environment(AppModel.self) private var model
    @State private var range: TrendRange = .fortnight

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground(accent: Theme.aqua)
                ScrollView {
                    VStack(spacing: 14) {
                        HStack {
                            Text("Trends").font(.rounded(30, .bold)).foregroundStyle(Theme.textPrimary)
                            Spacer()
                        }
                        .padding(.horizontal, 4)
                        .padding(.top, 8)

                        Picker("Range", selection: $range) {
                            ForEach(TrendRange.allCases) { Text($0.label).tag($0) }
                        }
                        .pickerStyle(.segmented)
                        .padding(.bottom, 4)

                        if let snapshot = model.health.snapshot {
                            ForEach(Metric.allCases) { metric in
                                if !snapshot.values(metric).isEmpty {
                                    NavigationLink(value: metric) {
                                        TrendCard(metric: metric, snapshot: snapshot, range: range)
                                    }
                                    .buttonStyle(PressableStyle())
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                    .animation(.snappy, value: range)
                }
                .scrollIndicators(.hidden)
            }
            .navigationDestination(for: Metric.self) { MetricDetailView(metric: $0) }
            .toolbar(.hidden, for: .navigationBar)
        }
        .sensoryFeedback(.selection, trigger: range)
    }
}

private struct TrendCard: View {
    let metric: Metric
    let snapshot: HealthSnapshot
    let range: TrendRange

    var body: some View {
        let points = snapshot.values(metric, lastDays: range.rawValue)
        let completed = points.filter { !(metric.accumulatesDuringDay && Calendar.cadence.isDateInToday($0.date)) }
        let average = completed.isEmpty ? nil : completed.map(\.value).reduce(0, +) / Double(completed.count)

        Card {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    IconBadge(symbol: metric.symbol, tint: metric.tint)
                    Text(metric.title).font(.headline).foregroundStyle(Theme.textPrimary)
                    Spacer()
                    if let average {
                        VStack(alignment: .trailing, spacing: 0) {
                            Text("\(metric.format(average)) \(metric == .sleep ? "" : metric.unit)")
                                .font(.subheadline.weight(.semibold)).monospacedDigit()
                                .foregroundStyle(Theme.textPrimary)
                            Text("\(range.label) avg").font(.caption2).foregroundStyle(Theme.textTertiary)
                        }
                    }
                }
                MetricChart(metric: metric, points: points, average: average, selectable: false)
                    .frame(height: 120)
            }
        }
    }
}

/// Shared chart used by trend cards (static) and the detail screen (scrubbable).
struct MetricChart: View {
    let metric: Metric
    let points: [(date: Date, value: Double)]
    let average: Double?
    var selectable: Bool
    @Binding var selection: Date?

    init(metric: Metric, points: [(date: Date, value: Double)], average: Double?, selectable: Bool, selection: Binding<Date?> = .constant(nil)) {
        self.metric = metric
        self.points = points
        self.average = average
        self.selectable = selectable
        _selection = selection
    }

    private var selectedPoint: (date: Date, value: Double)? {
        guard let selection else { return nil }
        return points.first { Calendar.cadence.isDate($0.date, inSameDayAs: selection) }
    }

    var body: some View {
        Chart {
            ForEach(points.indices, id: \.self) { i in
                let p = points[i]
                let dimmed = selectedPoint.map { !Calendar.cadence.isDate($0.date, inSameDayAs: p.date) } ?? false
                if metric.prefersBars {
                    BarMark(x: .value("Day", p.date, unit: .day), y: .value(metric.title, p.value), width: .ratio(0.62))
                        .foregroundStyle(metric.tint.gradient)
                        .opacity(dimmed ? 0.3 : 1)
                        .cornerRadius(4)
                } else {
                    AreaMark(x: .value("Day", p.date, unit: .day), y: .value(metric.title, p.value))
                        .foregroundStyle(LinearGradient(colors: [metric.tint.opacity(0.28), metric.tint.opacity(0)], startPoint: .top, endPoint: .bottom))
                        .interpolationMethod(.catmullRom)
                    LineMark(x: .value("Day", p.date, unit: .day), y: .value(metric.title, p.value))
                        .foregroundStyle(metric.tint)
                        .lineStyle(StrokeStyle(lineWidth: 2.5, lineCap: .round))
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Day", p.date, unit: .day), y: .value(metric.title, p.value))
                        .foregroundStyle(metric.tint)
                        .symbolSize(dimmed ? 0 : (points.count <= 14 ? 22 : 10))
                }
            }
            if let average {
                RuleMark(y: .value("Average", average))
                    .foregroundStyle(Color.white.opacity(0.35))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
            }
            if let p = selectedPoint {
                RuleMark(x: .value("Selected", p.date, unit: .day))
                    .foregroundStyle(Color.white.opacity(0.25))
            }
        }
        .chartYScale(domain: yDomain)
        .chartXAxis {
            AxisMarks(values: .stride(by: .day, count: points.count > 14 ? 7 : (points.count > 7 ? 3 : 1))) { _ in
                AxisValueLabel(format: .dateTime.day().month(.abbreviated), centered: true)
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .chartYAxis {
            AxisMarks(position: .trailing, values: .automatic(desiredCount: 3)) { value in
                AxisGridLine().foregroundStyle(Color.white.opacity(0.06))
                AxisValueLabel {
                    if let v = value.as(Double.self) {
                        Text(metric.formatShort(v)).foregroundStyle(Theme.textTertiary)
                    }
                }
            }
        }
        .modifier(SelectionModifier(enabled: selectable, selection: $selection))
    }

    private var yDomain: ClosedRange<Double> {
        let values = points.map(\.value) + (average.map { [$0] } ?? [])
        guard let lo = values.min(), let hi = values.max() else { return 0...1 }
        if metric.prefersBars { return 0...max(hi * 1.1, 1) }
        let pad = max((hi - lo) * 0.2, 0.5)
        return (lo - pad)...(hi + pad)
    }
}

private struct SelectionModifier: ViewModifier {
    let enabled: Bool
    @Binding var selection: Date?

    func body(content: Content) -> some View {
        if enabled {
            content.chartXSelection(value: $selection)
        } else {
            content.allowsHitTesting(false)
        }
    }
}
