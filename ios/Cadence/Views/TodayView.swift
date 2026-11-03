import Combine
import SwiftData
import SwiftUI

struct TodayView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.scenePhase) private var scenePhase
    @Query private var habits: [Habit]

    @State private var today = DayKey.today()
    @State private var showingNew = false
    @State private var detail: Habit?

    // Press + reorder state
    @GestureState private var pressedID: UUID?
    @State private var dragID: UUID?
    @State private var dragStart = 0
    @State private var dragTarget = 0
    @State private var dragY: CGFloat = 0

    /// Sorted locally (not via @Query) so sortOrder edits re-render in the same transaction.
    private var ordered: [Habit] { habits.sorted { $0.sortOrder < $1.sortOrder } }
    private var scheduled: [Habit] { ordered.filter { $0.isScheduled(on: today) } }

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.paper.ignoresSafeArea()
                DotGrid().ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        header
                        list
                        footer
                    }
                    .padding(.horizontal, Tuning.Layout.gutter)
                    .padding(.bottom, 40)
                }
                .scrollDisabled(dragID != nil)
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(item: $detail) { HabitDetailView(habit: $0, today: today) }
            .sheet(isPresented: $showingNew) { HabitEditor(habit: nil, nextOrder: (ordered.last?.sortOrder ?? -1) + 1) }
        }
        .tint(Theme.ink)
        .onChange(of: pressedID) { _, id in if id != nil { Haptics.warmUp() } }
        .onChange(of: scenePhase) { _, phase in if phase == .active { refreshDay() } }
        .onReceive(dayChanges) { _ in refreshDay() }
        .task { openForScreenshots() }
    }

    /// `-detail` / `-new` launch flags jump straight to a screen (CI screenshots).
    private func openForScreenshots() {
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-detail") { detail = ordered.first }
        if args.contains("-new") { showingNew = true }
    }

    // MARK: Header

    private var header: some View {
        let list = scheduled
        let done = list.filter { $0.isDone(on: today) }.count
        let fraction = list.isEmpty ? 0 : Double(done) / Double(list.count)
        return VStack(alignment: .leading, spacing: 14) {
            HStack {
                Readout("Cadence · \(Fmt.date(today, "EEE dd MMM yyyy"))", opacity: 0.7)
                Spacer()
                Button { showingNew = true } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(Theme.paper)
                        .frame(width: 44, height: 44)
                        .background(Circle().fill(Theme.ink))
                }
                .accessibilityLabel("New habit")
            }
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        CountingNumber(value: fraction * 100, font: Theme.title(72))
                            .animation(Tuning.Motion.count, value: fraction)
                        Text("%").font(Theme.title(30))
                    }
                    .foregroundStyle(Theme.ink)
                    Readout("Done \(Fmt.pad(done))/\(Fmt.pad(list.count)) · Day \(Fmt.pad(today.ordinal, 3))")
                }
                Spacer()
                DayRings(fraction: fraction, items: list.map { $0.isDone(on: today) })
                    .frame(width: 124, height: 124)
            }
            Rectangle().fill(Theme.ink).frame(height: 2)
        }
        .padding(.top, 8)
    }

    // MARK: List

    @ViewBuilder
    private var list: some View {
        let rows = scheduled
        if rows.isEmpty {
            EmptyState(hasHabits: !habits.isEmpty)
        } else {
            VStack(spacing: Tuning.Layout.rowSpacing) {
                ForEach(Array(rows.enumerated()), id: \.element.id) { i, habit in
                    HabitCapsule(
                        index: i,
                        name: habit.name,
                        symbol: habit.symbol,
                        accent: habit.accent,
                        done: habit.isDone(on: today),
                        streak: habit.currentStreak(today: today)
                    )
                    .contentShape(Capsule())
                    .accessibilityIdentifier("habit.\(habit.name)")
                    .scaleEffect(scale(for: habit.id))
                    .offset(y: offset(for: i, id: habit.id))
                    .zIndex(dragID == habit.id ? 1 : 0)
                    .animation(Tuning.Motion.press, value: pressedID == habit.id)
                    .animation(Tuning.Motion.press, value: dragID == habit.id)
                    .gesture(gesture(for: habit, index: i, rows: rows))
                    .accessibilityAction { toggle(habit) }
                    .accessibilityAction(named: "History") { detail = habit }
                }
            }
        }
    }

    private var footer: some View {
        let resting = habits.count - scheduled.count
        return VStack(alignment: .leading, spacing: 4) {
            if resting > 0 { Readout("\(Fmt.pad(resting)) resting today") }
            if !habits.isEmpty { Readout("Tap · complete   Hold · history   Hold+drag · order", size: 9, opacity: 0.4) }
        }
    }

    // MARK: Interaction

    private func gesture(for habit: Habit, index: Int, rows: [Habit]) -> some Gesture {
        let hold = LongPressGesture(minimumDuration: Tuning.Gesture.longPress)
            .sequenced(before: DragGesture(minimumDistance: 0, coordinateSpace: .global))
            .updating($pressedID) { _, state, _ in state = habit.id }
            .onChanged { value in
                guard case .second(true, let drag) = value else { return }
                if dragID == nil { beginDrag(habit.id, at: index) }
                if let drag { moveDrag(drag.translation.height, count: rows.count) }
            }
            .onEnded { value in
                guard case .second(true, let drag) = value else { return }
                let moved = abs(drag?.translation.height ?? 0)
                if moved < Tuning.Gesture.openSlop && dragTarget == dragStart {
                    resetDrag()
                    detail = habit
                } else {
                    commitDrag(rows)
                }
            }
        let tap = TapGesture().onEnded { toggle(habit) }
        return hold.exclusively(before: tap)
    }

    private func toggle(_ habit: Habit) {
        let nowDone = habit.toggle(on: today, in: context)
        if nowDone {
            Haptics.completed(finishedDay: scheduled.allSatisfy { $0.isDone(on: today) })
        } else {
            Haptics.uncompleted()
        }
    }

    private func scale(for id: UUID) -> CGFloat {
        if dragID == id { return Tuning.Motion.liftedScale }
        if pressedID == id { return Tuning.Motion.pressedScale }
        return 1
    }

    private func offset(for i: Int, id: UUID) -> CGFloat {
        guard let dragID else { return 0 }
        if id == dragID { return dragY }
        let pitch = Tuning.Layout.rowPitch
        if dragStart < i && i <= dragTarget { return -pitch }
        if dragTarget <= i && i < dragStart { return pitch }
        return 0
    }

    private func beginDrag(_ id: UUID, at index: Int) {
        dragID = id
        dragStart = index
        dragTarget = index
        dragY = 0
    }

    private func moveDrag(_ y: CGFloat, count: Int) {
        dragY = y
        let target = min(max(dragStart + Int((y / Tuning.Layout.rowPitch).rounded()), 0), count - 1)
        guard target != dragTarget else { return }
        withAnimation(Tuning.Motion.reorder) { dragTarget = target }
        Haptics.reorderStep()
    }

    private func commitDrag(_ rows: [Habit]) {
        var visible = rows
        visible.move(fromOffsets: IndexSet(integer: dragStart), toOffset: dragTarget > dragStart ? dragTarget + 1 : dragTarget)
        // Write the new visible order back into the slots those habits held in the full list,
        // so habits not scheduled today keep their places.
        var full = ordered
        let ids = Set(visible.map(\.id))
        let slots = full.indices.filter { ids.contains(full[$0].id) }
        for (slot, habit) in zip(slots, visible) { full[slot] = habit }
        withAnimation(Tuning.Motion.reorder) {
            for (i, habit) in full.enumerated() { habit.sortOrder = i }
            resetDrag()
        }
    }

    private func resetDrag() {
        dragID = nil
        dragY = 0
        dragStart = 0
        dragTarget = 0
    }

    // MARK: Day rollover

    private var dayChanges: AnyPublisher<Notification, Never> {
        let nc = NotificationCenter.default
        return Publishers.MergeMany(
            nc.publisher(for: .NSCalendarDayChanged),
            nc.publisher(for: .NSSystemTimeZoneDidChange),
            nc.publisher(for: UIApplication.significantTimeChangeNotification)
        )
        .receive(on: RunLoop.main)
        .eraseToAnyPublisher()
    }

    private func refreshDay() {
        NSTimeZone.resetSystemTimeZone()
        let now = DayKey.today()
        if now != today { today = now }
    }
}

private struct EmptyState: View {
    let hasHabits: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 0) {
                HalfCircle().fill(Theme.ink).frame(width: 60, height: 120)
                Circle().fill(Theme.accent).frame(width: 60, height: 60)
                HalfCircle().fill(Theme.ink).frame(width: 60, height: 120).rotationEffect(.degrees(180))
            }
            Text(hasHabits ? "Rest day." : "Nothing\nyet.")
                .font(Theme.title(44))
                .foregroundStyle(Theme.ink)
            Readout(hasHabits ? "No habits scheduled today" : "Tap + to add your first habit")
        }
        .padding(.top, 30)
    }
}

/// Left half of a circle, flat edge on the right.
struct HalfCircle: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.addArc(center: CGPoint(x: rect.maxX, y: rect.midY), radius: min(rect.width, rect.height / 2),
                 startAngle: .degrees(90), endAngle: .degrees(270), clockwise: false)
        p.closeSubpath()
        return p
    }
}
