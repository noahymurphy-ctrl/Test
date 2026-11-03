import SwiftData
import SwiftUI

struct HabitDetailView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    let habit: Habit
    let today: DayKey

    @State private var shownCurrent = 0.0
    @State private var shownBest = 0.0
    @State private var editing = false
    @State private var deleting = false

    private let weeks = 12

    var body: some View {
        ScrollView {
            if !deleting {
                content
                    .padding(.horizontal, Tuning.Layout.gutter)
                    .padding(.bottom, 40)
            }
        }
        .background(Theme.paper.ignoresSafeArea())
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Edit") { editing = true }
                    .font(Theme.mono(13, weight: .semibold))
            }
        }
        .sheet(isPresented: $editing, onDismiss: { if deleting { dismiss() } }) {
            HabitEditor(habit: habit, nextOrder: habit.sortOrder) { deleting = true }
        }
        .onDisappear {
            if deleting { context.delete(habit) }
        }
        .onAppear { countUp() }
        .onChange(of: habit.completions.count) { _, _ in countUp() }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 26) {
            // Title block
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 8) {
                    Readout("\(habit.tag) · since \(Fmt.date(DayKey(habit.createdAt), "dd MMM yy"))")
                    Text(habit.name)
                        .font(Theme.title(40))
                        .foregroundStyle(Theme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Readout(scheduleText)
                }
                Spacer()
                ZStack {
                    Circle().fill(habit.accent == .ink ? Theme.ink : habit.accent.color)
                    Image(systemName: habit.symbol)
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundStyle(habit.accent == .ink ? Theme.paper : .white)
                }
                .frame(width: 64, height: 64)
            }

            // Streaks
            HStack(spacing: 0) {
                stat("Current", shownCurrent)
                Rectangle().fill(Theme.ink).frame(width: 2)
                stat("Best", shownBest).padding(.leading, 16)
            }
            .frame(height: 96)
            .overlay(alignment: .top) { Rectangle().fill(Theme.ink).frame(height: 2) }
            .overlay(alignment: .bottom) { Rectangle().fill(Theme.ink).frame(height: 2) }

            // 12-week grid
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Readout("12 weeks")
                    Spacer()
                    Readout("Rate \(Int((rate * 100).rounded()))%")
                }
                grid
                legend
            }
        }
        .padding(.top, 8)
    }

    private func stat(_ label: String, _ value: Double) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Readout(label)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                CountingNumber(value: value, width: 2, font: Theme.mono(52, weight: .bold))
                Readout("days", size: 11)
            }
            .foregroundStyle(Theme.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Grid

    /// Sunday of the first column, so the last column holds the current week.
    private var gridStart: DayKey { today.adding(days: -(today.weekday - 1) - (weeks - 1) * 7) }

    private var grid: some View {
        let done = habit.completedDays
        return VStack(spacing: 5) {
            ForEach(0..<7, id: \.self) { r in
                HStack(spacing: 5) {
                    Text(Fmt.weekdayLetters[r])
                        .font(Theme.mono(9))
                        .foregroundStyle(Theme.ink.opacity(0.45))
                        .frame(width: 10)
                    ForEach(0..<weeks, id: \.self) { c in
                        dot(gridStart.adding(days: c * 7 + r), done: done)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func dot(_ day: DayKey, done: Set<DayKey>) -> some View {
        let isDone = done.contains(day)
        let isToday = day == today
        let tint = habit.accent == .ink ? Theme.accent : habit.accent.color
        ZStack {
            if day > today {
                Circle().fill(Theme.ink.opacity(0.06)).scaleEffect(0.35)
            } else if isDone {
                Circle().fill(isToday ? tint : Theme.ink)
            } else if habit.isScheduled(on: day) {
                Circle().strokeBorder(Theme.ink.opacity(0.35), lineWidth: 1.5)
            } else {
                Circle().fill(Theme.ink.opacity(0.25)).scaleEffect(0.25)
            }
            if isToday && !isDone {
                Circle().strokeBorder(tint, lineWidth: 2)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
        .animation(Tuning.Motion.dot, value: isDone)
        .onTapGesture {
            guard day <= today else { return }
            if habit.toggle(on: day, in: context) {
                Haptics.completed(finishedDay: false)
            } else {
                Haptics.uncompleted()
            }
        }
        .accessibilityLabel("\(Fmt.date(day, "EEEE d MMMM")), \(isDone ? "done" : "not done")")
    }

    private var legend: some View {
        HStack(spacing: 14) {
            legendItem(Circle().fill(Theme.ink), "Done")
            legendItem(Circle().strokeBorder(Theme.ink.opacity(0.35), lineWidth: 1.5), "Missed")
            legendItem(Circle().fill(Theme.ink.opacity(0.25)).scaleEffect(0.3), "Off")
            Spacer()
            Readout("Tap a day to edit", size: 9, opacity: 0.4)
        }
    }

    private func legendItem(_ shape: some View, _ text: String) -> some View {
        HStack(spacing: 5) {
            shape.frame(width: 10, height: 10)
            Readout(text, size: 9)
        }
    }

    // MARK: Derived

    private var scheduleText: String {
        if habit.isDaily { return "Daily" }
        return (1...7).filter(habit.schedule.contains)
            .map { ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][$0 - 1] }
            .joined(separator: " ")
    }

    private var rate: Double {
        Streak.rate(completed: habit.completedDays, weekdays: habit.schedule, from: gridStart, to: today)
    }

    private func countUp() {
        withAnimation(Tuning.Motion.count) {
            shownCurrent = Double(habit.currentStreak(today: today))
            shownBest = Double(habit.bestStreak(today: today))
        }
    }
}
