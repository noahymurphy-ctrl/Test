import SwiftData
import SwiftUI

struct HabitEditor: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    let habit: Habit?
    let nextOrder: Int
    var onDelete: (() -> Void)?

    @State private var name: String
    @State private var symbol: String
    @State private var accent: Accent
    @State private var daily: Bool
    @State private var weekdays: Set<Int>
    @State private var confirmDelete = false
    @FocusState private var nameFocused: Bool

    static let symbols = [
        "drop.fill", "figure.walk", "figure.run", "bicycle", "dumbbell.fill", "figure.mind.and.body",
        "book.closed.fill", "pencil", "brain.head.profile", "music.note", "paintbrush.pointed.fill", "sparkles",
        "moon.zzz.fill", "bed.double.fill", "sun.max.fill", "leaf.fill", "cup.and.saucer.fill", "fork.knife",
        "pills.fill", "heart.fill", "phone.down.fill", "bolt.fill", "checkmark", "circle.fill",
    ]

    init(habit: Habit?, nextOrder: Int, onDelete: (() -> Void)? = nil) {
        self.habit = habit
        self.nextOrder = nextOrder
        self.onDelete = onDelete
        _name = State(initialValue: habit?.name ?? "")
        _symbol = State(initialValue: habit?.symbol ?? "drop.fill")
        _accent = State(initialValue: habit?.accent ?? .vermilion)
        _daily = State(initialValue: habit?.isDaily ?? true)
        _weekdays = State(initialValue: habit.map { $0.schedule } ?? Set(2...6))
    }

    private var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty && (daily || !weekdays.isEmpty)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    section("01 · Name") {
                        TextField("Drink water", text: $name)
                            .font(Theme.title(32))
                            .foregroundStyle(Theme.ink)
                            .focused($nameFocused)
                            .submitLabel(.done)
                        Rectangle().fill(Theme.ink).frame(height: 2)
                    }
                    section("02 · Icon") { symbolGrid }
                    section("03 · Frequency") { frequency }
                    section("04 · Accent") { palette }
                    if habit != nil {
                        Button("Delete habit", role: .destructive) { confirmDelete = true }
                            .font(Theme.mono(13, weight: .semibold))
                            .foregroundStyle(Accent.signal.color)
                    }
                }
                .padding(Tuning.Layout.gutter)
            }
            .background(Theme.paper.ignoresSafeArea())
            .safeAreaInset(edge: .bottom) { saveBar }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }.font(Theme.mono(13))
                }
                ToolbarItem(placement: .principal) {
                    Readout(habit == nil ? "New habit" : "Edit \(habit!.tag)", opacity: 0.8)
                }
            }
            .confirmationDialog("Delete \(name)? Its history goes too.", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("Delete", role: .destructive) {
                    dismiss()
                    onDelete?()
                }
            }
        }
        .tint(Theme.ink)
        .onAppear { if habit == nil { nameFocused = true } }
    }

    private func section<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Readout(title)
            content()
        }
    }

    private var symbolGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 6), spacing: 8) {
            ForEach(Self.symbols, id: \.self) { s in
                let on = s == symbol
                Button { symbol = s } label: {
                    Image(systemName: s)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(on ? Theme.paper : Theme.ink)
                        .frame(maxWidth: .infinity)
                        .aspectRatio(1, contentMode: .fit)
                        .background(Circle().fill(on ? Theme.ink : .clear))
                        .overlay(Circle().strokeBorder(Theme.ink.opacity(on ? 1 : 0.2), lineWidth: 1.5))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(s.replacingOccurrences(of: ".", with: " "))
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
    }

    private var frequency: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                pill("Daily", on: daily) { daily = true }
                pill("Chosen days", on: !daily) { daily = false }
            }
            if !daily {
                HStack(spacing: 8) {
                    ForEach(1...7, id: \.self) { wd in
                        let on = weekdays.contains(wd)
                        Button {
                            if on { weekdays.remove(wd) } else { weekdays.insert(wd) }
                        } label: {
                            Text(Fmt.weekdayLetters[wd - 1])
                                .font(Theme.mono(14, weight: .bold))
                                .foregroundStyle(on ? Theme.paper : Theme.ink)
                                .frame(maxWidth: .infinity)
                                .aspectRatio(1, contentMode: .fit)
                                .background(Circle().fill(on ? Theme.ink : .clear))
                                .overlay(Circle().strokeBorder(Theme.ink, lineWidth: 1.5))
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }
                .transition(.opacity)
            }
        }
        .animation(Tuning.Motion.press, value: daily)
    }

    private func pill(_ text: String, on: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(text.uppercased())
                .font(Theme.mono(12, weight: .semibold))
                .tracking(1)
                .foregroundStyle(on ? Theme.paper : Theme.ink)
                .padding(.horizontal, 16)
                .frame(height: 38)
                .background(Capsule().fill(on ? Theme.ink : .clear))
                .overlay(Capsule().strokeBorder(Theme.ink, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private var palette: some View {
        HStack(spacing: 12) {
            ForEach(Accent.allCases) { a in
                let on = a == accent
                Button { accent = a } label: {
                    Circle()
                        .fill(a.color)
                        .padding(on ? 6 : 0)
                        .overlay(Circle().strokeBorder(Theme.ink, lineWidth: on ? 2 : 0))
                        .frame(width: 48, height: 48)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(a.label)
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
        .animation(Tuning.Motion.press, value: accent)
    }

    private var saveBar: some View {
        Button(action: save) {
            Text(habit == nil ? "ADD HABIT" : "SAVE")
                .font(Theme.mono(15, weight: .bold))
                .tracking(1.5)
                .foregroundStyle(Theme.paper)
                .frame(maxWidth: .infinity)
                .frame(height: 58)
                .background(Capsule().fill(Theme.ink))
        }
        .buttonStyle(.plain)
        .disabled(!canSave)
        .opacity(canSave ? 1 : 0.3)
        .padding(.horizontal, Tuning.Layout.gutter)
        .padding(.bottom, 8)
        .background(Theme.paper)
    }

    private func save() {
        let days = daily ? Array(1...7) : weekdays.sorted()
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        if let habit {
            habit.name = trimmed
            habit.symbol = symbol
            habit.accent = accent
            habit.weekdays = days
        } else {
            context.insert(Habit(name: trimmed, symbol: symbol, accent: accent, weekdays: days, sortOrder: nextOrder))
        }
        dismiss()
    }
}
