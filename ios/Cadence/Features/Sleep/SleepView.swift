import Charts
import SwiftUI

struct SleepView: View {
    @Environment(AppModel.self) private var model
    @State private var selectedNightIndex: Int?

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground(accent: Theme.violet)
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Sleep").font(.rounded(30, .bold)).foregroundStyle(Theme.textPrimary)
                            .padding(.horizontal, 4).padding(.top, 8)

                        if let snapshot = model.health.snapshot {
                            let nights = snapshot.days.compactMap(\.sleep)
                            if let night = selectedNight(in: nights) {
                                nightHero(night)
                                if !night.segments.isEmpty {
                                    Card {
                                        VStack(alignment: .leading, spacing: 12) {
                                            Text("Stages").font(.headline).foregroundStyle(Theme.textPrimary)
                                            Hypnogram(night: night).frame(height: 170)
                                        }
                                    }
                                }
                                if night.hasStages { stageBreakdown(night) }
                            }
                            if nights.count > 1 {
                                durationHistory(nights: Array(nights.suffix(14)), all: nights)
                                consistency(nights: Array(nights.suffix(14)))
                            }
                            if nights.isEmpty {
                                Card {
                                    Text("No sleep recorded yet. Wear your Fitbit to bed and it'll show up here the next morning.")
                                        .foregroundStyle(Theme.textSecondary)
                                }
                            }
                            Button {
                                model.ask("Give me a deep analysis of my sleep over the last two weeks: duration, stages, timing consistency, and how it relates to my HRV and resting heart rate. What's the one change that would help most?")
                            } label: {
                                HStack(spacing: 10) {
                                    ClaudeSpark(size: 15)
                                    Text("Analyze my sleep")
                                }
                            }
                            .buttonStyle(PrimaryButtonStyle(gradient: Theme.claudeGradient))
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                }
                .scrollIndicators(.hidden)
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    // MARK: Sections

    private func nightHero(_ night: SleepNight) -> some View {
        Card(padding: 20) {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(nightLabel(night)).font(.footnote.weight(.semibold)).foregroundStyle(Theme.textTertiary)
                        Text(Metric.sleep.format(night.hoursAsleep))
                            .font(.rounded(44, .bold))
                            .foregroundStyle(Theme.textPrimary)
                            .contentTransition(.numericText())
                    }
                    Spacer()
                    EfficiencyRing(value: night.efficiency).frame(width: 74, height: 74)
                }
                HStack(spacing: 0) {
                    timeColumn("Bedtime", night.start, symbol: "bed.double.fill")
                    Spacer()
                    timeColumn("Wake", night.end, symbol: "sunrise.fill")
                    Spacer()
                    VStack(alignment: .leading, spacing: 3) {
                        Label("In bed", systemImage: "clock.fill").font(.caption).foregroundStyle(Theme.textTertiary)
                        Text(Metric.sleep.format(Double(night.minutesInBed) / 60))
                            .font(.subheadline.weight(.semibold)).monospacedDigit().foregroundStyle(Theme.textPrimary)
                    }
                }
            }
        }
    }

    private func timeColumn(_ title: String, _ date: Date, symbol: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Label(title, systemImage: symbol).font(.caption).foregroundStyle(Theme.textTertiary)
            Text(date.formatted(date: .omitted, time: .shortened))
                .font(.subheadline.weight(.semibold)).monospacedDigit().foregroundStyle(Theme.textPrimary)
        }
    }

    private func stageBreakdown(_ night: SleepNight) -> some View {
        let rows: [(SleepStageKind, Int)] = [(.deep, night.deep), (.rem, night.rem), (.light, night.light), (.awake, night.minutesAwake)]
        let total = max(rows.reduce(0) { $0 + $1.1 }, 1)
        return Card {
            VStack(spacing: 14) {
                ForEach(rows.indices, id: \.self) { i in
                    let stage = rows[i].0
                    let minutes = rows[i].1
                    VStack(spacing: 6) {
                        HStack {
                            Circle().fill(stage.color).frame(width: 8, height: 8)
                            Text(stage.label).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.textPrimary)
                            Spacer()
                            Text("\(minutes / 60)h \(minutes % 60)m").font(.subheadline).monospacedDigit().foregroundStyle(Theme.textSecondary)
                            Text("\(Int(Double(minutes) / Double(total) * 100))%")
                                .font(.subheadline.weight(.semibold)).monospacedDigit()
                                .foregroundStyle(Theme.textPrimary)
                                .frame(width: 44, alignment: .trailing)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.white.opacity(0.06))
                                Capsule().fill(stage.color.gradient).frame(width: geo.size.width * CGFloat(minutes) / CGFloat(total))
                            }
                        }
                        .frame(height: 6)
                    }
                }
            }
        }
    }

    private func durationHistory(nights: [SleepNight], all: [SleepNight]) -> some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Last \(nights.count) Nights").font(.headline).foregroundStyle(Theme.textPrimary)
                    Spacer()
                    let avg = nights.map(\.hoursAsleep).reduce(0, +) / Double(nights.count)
                    Text("avg \(Metric.sleep.format(avg))").font(.footnote.weight(.semibold)).foregroundStyle(Theme.textSecondary)
                }
                Chart {
                    ForEach(nights) { night in
                        let stages: [(SleepStageKind, Int)] = night.hasStages
                            ? [(.deep, night.deep), (.rem, night.rem), (.light, night.light)]
                            : [(.light, night.minutesAsleep)]
                        ForEach(stages.indices, id: \.self) { i in
                            BarMark(x: .value("Night", night.end, unit: .day),
                                    y: .value("Hours", Double(stages[i].1) / 60),
                                    width: .ratio(0.6))
                                .foregroundStyle(stages[i].0.color)
                                .opacity(isSelected(night, in: all) ? 1 : 0.85)
                        }
                    }
                    RuleMark(y: .value("Goal", 8))
                        .foregroundStyle(Color.white.opacity(0.3))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
                        .annotation(position: .top, alignment: .leading) {
                            Text("8h goal").font(.caption2).foregroundStyle(Theme.textTertiary)
                        }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 3)) { _ in
                        AxisValueLabel(format: .dateTime.weekday(.narrow), centered: true).foregroundStyle(Theme.textTertiary)
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .trailing, values: [0, 4, 8]) { value in
                        AxisGridLine().foregroundStyle(Color.white.opacity(0.06))
                        AxisValueLabel { Text("\(value.as(Int.self) ?? 0)h").foregroundStyle(Theme.textTertiary) }
                    }
                }
                .chartOverlay { proxy in
                    GeometryReader { geo in
                        Rectangle().fill(.clear).contentShape(Rectangle())
                            .onTapGesture { location in
                                guard let plot = proxy.plotFrame else { return }
                                let x = location.x - geo[plot].origin.x
                                guard let date: Date = proxy.value(atX: x),
                                      let index = all.firstIndex(where: { Calendar.cadence.isDate($0.end, inSameDayAs: date) }) else { return }
                                withAnimation(.snappy) { selectedNightIndex = index }
                            }
                    }
                }
                .frame(height: 170)
                .sensoryFeedback(.selection, trigger: selectedNightIndex)
            }
        }
    }

    private func consistency(nights: [SleepNight]) -> some View {
        // Bedtime spread, measured in minutes from 6pm so midnight doesn't wrap.
        func minutesFromSixPM(_ d: Date) -> Double {
            let c = Calendar.cadence.dateComponents([.hour, .minute], from: d)
            let m = Double((c.hour ?? 0) * 60 + (c.minute ?? 0))
            return m < 18 * 60 ? m + 6 * 60 : m - 18 * 60
        }
        let bedtimes = nights.map { minutesFromSixPM($0.start) }
        let mean = bedtimes.reduce(0, +) / Double(bedtimes.count)
        let sd = (bedtimes.map { ($0 - mean) * ($0 - mean) }.reduce(0, +) / Double(max(bedtimes.count - 1, 1))).squareRoot()
        let avgBed = Calendar.cadence.startOfDay(for: Date()).addingTimeInterval((18 * 60 + mean) * 60)
        let label = sd < 30 ? "Very consistent" : sd < 60 ? "Fairly consistent" : "Irregular"
        let color = sd < 30 ? Theme.mint : sd < 60 ? Theme.aqua : Theme.amber

        return Card {
            HStack(spacing: 14) {
                IconBadge(symbol: "metronome.fill", tint: color, size: 40)
                VStack(alignment: .leading, spacing: 3) {
                    Text("Schedule").font(.caption.weight(.semibold)).foregroundStyle(Theme.textTertiary)
                    Text(label).font(.headline).foregroundStyle(Theme.textPrimary)
                    Text("Avg bedtime \(avgBed.formatted(date: .omitted, time: .shortened)) · ±\(Int(sd)) min")
                        .font(.footnote).foregroundStyle(Theme.textSecondary)
                }
                Spacer()
            }
        }
    }

    private func selectedNight(in nights: [SleepNight]) -> SleepNight? {
        if let i = selectedNightIndex, nights.indices.contains(i) { return nights[i] }
        return nights.last
    }

    private func isSelected(_ night: SleepNight, in all: [SleepNight]) -> Bool {
        guard let i = selectedNightIndex, all.indices.contains(i) else { return night.id == all.last?.id }
        return all[i].id == night.id
    }

    private func nightLabel(_ night: SleepNight) -> String {
        if Calendar.cadence.isDateInToday(night.end) { return "LAST NIGHT" }
        return night.end.formatted(.dateTime.weekday(.wide).month().day()).uppercased()
    }
}

private struct EfficiencyRing: View {
    let value: Double

    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.07), lineWidth: 7)
            Circle()
                .trim(from: 0, to: value)
                .stroke(Theme.violet.gradient, style: StrokeStyle(lineWidth: 7, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: -1) {
                Text("\(Int(value * 100))").font(.rounded(20, .bold)).foregroundStyle(Theme.textPrimary)
                Text("EFFIC.").font(.system(size: 8, weight: .bold)).tracking(0.8).foregroundStyle(Theme.textTertiary)
            }
        }
        .animation(.spring(response: 0.8, dampingFraction: 0.85), value: value)
    }
}

struct Hypnogram: View {
    let night: SleepNight

    var body: some View {
        Chart {
            ForEach(night.segments.indices, id: \.self) { i in
                let s = night.segments[i]
                RectangleMark(
                    xStart: .value("Start", s.start),
                    xEnd: .value("End", s.end),
                    yStart: .value("Depth", Double(s.stage.depth) - 0.38),
                    yEnd: .value("Depth", Double(s.stage.depth) + 0.38)
                )
                .foregroundStyle(s.stage.color.gradient)
                .cornerRadius(3)
            }
        }
        .chartYScale(domain: -0.6...3.6)
        .chartYAxis {
            AxisMarks(position: .leading, values: [0.0, 1.0, 2.0, 3.0]) { value in
                AxisValueLabel {
                    let depth = Int(value.as(Double.self) ?? 0)
                    Text(SleepStageKind.allCases.first { $0.depth == depth }?.label ?? "")
                        .font(.caption2)
                        .foregroundStyle(Theme.textTertiary)
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .stride(by: .hour, count: 2)) { _ in
                AxisGridLine().foregroundStyle(Color.white.opacity(0.05))
                AxisValueLabel(format: .dateTime.hour()).foregroundStyle(Theme.textTertiary)
            }
        }
    }
}
