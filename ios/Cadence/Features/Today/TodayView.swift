import SwiftUI

struct TodayView: View {
    @Environment(AppModel.self) private var model
    @State private var refreshTick = 0

    private let gridMetrics: [Metric] = [.steps, .restingHeartRate, .hrv, .activeZoneMinutes, .calories, .spo2]

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground(accent: model.readiness.map { Theme.readinessColor($0.score) } ?? Theme.violet)
                ScrollView {
                    VStack(spacing: 16) {
                        header
                        statusBanner
                        if let snapshot = model.health.snapshot {
                            ReadinessCard(readiness: model.readiness, snapshot: snapshot)
                            BriefCard()
                            metricGrid(snapshot)
                            if let night = snapshot.lastSleep {
                                Button { model.selectedTab = .sleep } label: { SleepSummaryCard(night: night) }
                                    .buttonStyle(PressableStyle())
                            }
                            if !snapshot.workouts.isEmpty { workouts(snapshot) }
                            footer(snapshot)
                        } else {
                            loadingPlaceholder
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                }
                .scrollIndicators(.hidden)
                .refreshable {
                    await model.refresh()
                    refreshTick += 1
                }
            }
            .navigationDestination(for: Metric.self) { MetricDetailView(metric: $0) }
            .toolbar(.hidden, for: .navigationBar)
        }
        .sensoryFeedback(.success, trigger: refreshTick)
    }

    // MARK: Sections

    private var header: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(Date().formatted(.dateTime.weekday(.wide).month(.wide).day()).uppercased())
                    .font(.system(size: 12, weight: .semibold))
                    .tracking(1.2)
                    .foregroundStyle(Theme.textTertiary)
                Text(greeting)
                    .font(.rounded(30, .bold))
                    .foregroundStyle(Theme.textPrimary)
            }
            Spacer()
            Button { model.showSettings = true } label: {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 30))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(Theme.textSecondary)
            }
            .accessibilityLabel("Settings")
        }
        .padding(.top, 8)
        .padding(.horizontal, 4)
    }

    @ViewBuilder
    private var statusBanner: some View {
        if model.health.needsAccountLink {
            banner(symbol: "link.badge.plus", tint: Theme.amber,
                   text: "Link your Fitbit to Google Health to sync.", action: "Open",
                   url: URL(string: "https://fitbit.google.com/auth/signup"))
        } else if let error = model.health.lastError {
            banner(symbol: "exclamationmark.triangle.fill", tint: Theme.amber, text: error, action: nil, url: nil)
        } else if model.health.snapshot?.isDemo == true {
            banner(symbol: "sparkles.rectangle.stack", tint: Theme.sky,
                   text: "You're viewing sample data.", action: "Connect", url: nil) {
                model.showSettings = true
            }
        }
    }

    private func banner(symbol: String, tint: Color, text: String, action: String?, url: URL?,
                        perform: (() -> Void)? = nil) -> some View {
        HStack(spacing: 12) {
            Image(systemName: symbol).foregroundStyle(tint)
            Text(text)
                .font(.footnote.weight(.medium))
                .foregroundStyle(Theme.textSecondary)
                .lineLimit(3)
            Spacer(minLength: 0)
            if let action {
                if let url {
                    Link(action, destination: url).font(.footnote.weight(.semibold))
                } else {
                    Button(action) { perform?() }.font(.footnote.weight(.semibold))
                }
            }
        }
        .padding(14)
        .background(tint.opacity(0.1), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(tint.opacity(0.2)))
    }

    private func metricGrid(_ snapshot: HealthSnapshot) -> some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            ForEach(gridMetrics) { metric in
                NavigationLink(value: metric) {
                    MetricTile(metric: metric, snapshot: snapshot)
                }
                .buttonStyle(PressableStyle())
            }
        }
    }

    private func workouts(_ snapshot: HealthSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Recent Workouts", trailing: "\(snapshot.workouts.filter { $0.start > Date().adding(days: -7) }.count) this week")
                .padding(.top, 8)
            Card(padding: 6) {
                VStack(spacing: 0) {
                    ForEach(Array(snapshot.workouts.prefix(4).enumerated()), id: \.element.id) { index, workout in
                        WorkoutRow(workout: workout)
                        if index < min(snapshot.workouts.count, 4) - 1 {
                            Divider().overlay(Theme.hairline).padding(.leading, 60)
                        }
                    }
                }
            }
        }
    }

    private func footer(_ snapshot: HealthSnapshot) -> some View {
        Text(snapshot.isDemo ? "Sample data" : "Synced \(snapshot.fetchedAt.formatted(.relative(presentation: .named)))")
            .font(.caption)
            .foregroundStyle(Theme.textTertiary)
            .padding(.top, 8)
    }

    private var loadingPlaceholder: some View {
        VStack(spacing: 16) {
            ForEach(0..<3) { _ in
                Card {
                    VStack(alignment: .leading, spacing: 12) {
                        SkeletonLine(width: 120, height: 14)
                        SkeletonLine(height: 10)
                        SkeletonLine(width: 200, height: 10)
                    }
                    .frame(height: 120, alignment: .top)
                }
                .shimmering()
            }
        }
    }

    private var greeting: String {
        switch Calendar.cadence.component(.hour, from: Date()) {
        case 5..<12: "Good morning"
        case 12..<17: "Good afternoon"
        default: "Good evening"
        }
    }
}

// MARK: - Readiness

struct ReadinessCard: View {
    let readiness: Readiness?
    let snapshot: HealthSnapshot

    var body: some View {
        Card(padding: 20) {
            if let readiness {
                HStack(spacing: 22) {
                    ScoreRing(score: readiness.score)
                        .frame(width: 132, height: 132)
                    VStack(alignment: .leading, spacing: 12) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(readiness.label)
                                .font(.rounded(24, .bold))
                                .foregroundStyle(Theme.readinessColor(readiness.score))
                            Text(readiness.guidance)
                                .font(.footnote)
                                .foregroundStyle(Theme.textSecondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(readiness.components) { component in
                                ComponentBar(component: component, tint: Theme.readinessColor(readiness.score))
                            }
                        }
                    }
                }
            } else {
                HStack(spacing: 14) {
                    IconBadge(symbol: "gauge.with.dots.needle.33percent", tint: Theme.textSecondary, size: 44)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Recovery is calibrating").font(.headline).foregroundStyle(Theme.textPrimary)
                        Text("Wear your Fitbit to sleep for a few nights to build your baseline.")
                            .font(.footnote).foregroundStyle(Theme.textSecondary)
                    }
                }
            }
        }
    }
}

private struct ComponentBar: View {
    let component: Readiness.Component
    let tint: Color
    @State private var shown = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(component.name).font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.textPrimary)
                Spacer()
                Text(component.detail).font(.system(size: 11)).foregroundStyle(Theme.textTertiary).lineLimit(1)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.07))
                    Capsule().fill(tint.gradient)
                        .frame(width: geo.size.width * (shown ? component.score : 0))
                }
            }
            .frame(height: 5)
        }
        .onAppear { withAnimation(.spring(response: 1, dampingFraction: 0.85).delay(0.25)) { shown = true } }
    }
}

// MARK: - Metric tile

struct MetricTile: View {
    let metric: Metric
    let snapshot: HealthSnapshot

    var body: some View {
        let latest = snapshot.latest(metric)
        let baseline = snapshot.baseline(metric)
        Card(padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    IconBadge(symbol: metric.symbol, tint: metric.tint, size: 28)
                    Spacer()
                    if let latest, let baseline, !(metric.accumulatesDuringDay && Calendar.cadence.isDateInToday(latest.date)) {
                        DeltaChip(metric: metric, value: latest.value, baseline: baseline)
                    }
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text(metric.title)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.textSecondary)
                    HStack(alignment: .firstTextBaseline, spacing: 3) {
                        Text(latest.map { metric.formatShort($0.value) } ?? "—")
                            .font(.rounded(26, .bold))
                            .monospacedDigit()
                            .foregroundStyle(Theme.textPrimary)
                            .contentTransition(.numericText())
                        Text(metric.unit)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Theme.textTertiary)
                    }
                }
                Sparkline(points: snapshot.values(metric, lastDays: 14), tint: metric.tint, bars: metric.prefersBars)
                    .frame(height: 34)
            }
        }
    }
}

// MARK: - Sleep summary

struct SleepSummaryCard: View {
    let night: SleepNight

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    IconBadge(symbol: "moon.stars.fill", tint: Theme.violet)
                    Text("Last Night").font(.headline).foregroundStyle(Theme.textPrimary)
                    Spacer()
                    Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(Theme.textTertiary)
                }
                HStack(alignment: .firstTextBaseline) {
                    Text(Metric.sleep.format(night.hoursAsleep))
                        .font(.rounded(30, .bold))
                        .foregroundStyle(Theme.textPrimary)
                    Spacer()
                    Text("\(night.start.formatted(date: .omitted, time: .shortened)) – \(night.end.formatted(date: .omitted, time: .shortened))")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(Theme.textSecondary)
                }
                if night.hasStages {
                    StageBar(night: night).frame(height: 10)
                    HStack(spacing: 14) {
                        ForEach([SleepStageKind.deep, .rem, .light, .awake], id: \.self) { stage in
                            HStack(spacing: 5) {
                                Circle().fill(stage.color).frame(width: 7, height: 7)
                                Text("\(stage.label) \(minutes(stage))m")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(Theme.textSecondary)
                            }
                        }
                    }
                }
            }
        }
    }

    private func minutes(_ stage: SleepStageKind) -> Int {
        switch stage {
        case .deep: night.deep
        case .rem: night.rem
        case .light: night.light
        case .awake: night.minutesAwake
        }
    }
}

struct StageBar: View {
    let night: SleepNight

    var body: some View {
        let parts: [(SleepStageKind, Int)] = [(.deep, night.deep), (.rem, night.rem), (.light, night.light), (.awake, night.minutesAwake)]
        let total = max(parts.reduce(0) { $0 + $1.1 }, 1)
        GeometryReader { geo in
            HStack(spacing: 2) {
                ForEach(parts.indices, id: \.self) { i in
                    Capsule()
                        .fill(parts[i].0.color.gradient)
                        .frame(width: max(geo.size.width * CGFloat(parts[i].1) / CGFloat(total) - 2, 0))
                }
            }
        }
    }
}

// MARK: - Workout row

struct WorkoutRow: View {
    let workout: Workout

    var body: some View {
        HStack(spacing: 14) {
            IconBadge(symbol: symbol, tint: Theme.amber, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(workout.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.textPrimary)
                Text(workout.start.formatted(.dateTime.weekday(.abbreviated).hour().minute()))
                    .font(.caption).foregroundStyle(Theme.textTertiary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(workout.durationMinutes) min").font(.subheadline.weight(.semibold)).monospacedDigit().foregroundStyle(Theme.textPrimary)
                Text(subtitle).font(.caption).monospacedDigit().foregroundStyle(Theme.textTertiary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
    }

    private var subtitle: String {
        var parts: [String] = []
        if let d = workout.distanceKm, d > 0.1 { parts.append(String(format: "%.1f km", d)) }
        if let hr = workout.avgHeartRate { parts.append("\(Int(hr)) bpm") }
        if parts.isEmpty, let c = workout.calories { parts.append("\(Int(c)) kcal") }
        return parts.joined(separator: " · ")
    }

    private var symbol: String {
        let n = workout.name.lowercased()
        if n.contains("run") { return "figure.run" }
        if n.contains("walk") || n.contains("hike") { return "figure.hiking" }
        if n.contains("bik") || n.contains("cycl") { return "figure.outdoor.cycle" }
        if n.contains("swim") { return "figure.pool.swim" }
        if n.contains("strength") || n.contains("weight") { return "dumbbell.fill" }
        if n.contains("yoga") { return "figure.yoga" }
        return "figure.mixed.cardio"
    }
}
