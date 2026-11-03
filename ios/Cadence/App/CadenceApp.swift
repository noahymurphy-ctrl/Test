import SwiftData
import SwiftUI

@main
struct CadenceApp: App {
    let container: ModelContainer

    init() {
        let args = ProcessInfo.processInfo.arguments
        let inMemory = args.contains("-seed") || args.contains("-uitest")
        do {
            container = try ModelContainer(
                for: Habit.self, Completion.self,
                configurations: ModelConfiguration(isStoredInMemoryOnly: inMemory)
            )
        } catch {
            fatalError("Could not open store: \(error)")
        }
        if args.contains("-seed") { DemoData.seed(container.mainContext) }
    }

    var body: some Scene {
        WindowGroup {
            TodayView()
        }
        .modelContainer(container)
    }
}

/// Sample habits with history, for screenshots and previews. Launch with `-seed`.
enum DemoData {
    @MainActor
    static func seed(_ context: ModelContext) {
        let today = DayKey.today()
        let specs: [(String, String, Accent, [Int], Int, Double)] = [
            ("Drink water", "drop.fill", .cobalt, Array(1...7), 23, 0.95),
            ("Read 20 pages", "book.closed.fill", .vermilion, Array(1...7), 9, 0.8),
            ("Run", "figure.run", .signal, [2, 4, 6], 5, 0.85),
            ("Meditate", "figure.mind.and.body", .ochre, Array(1...7), 0, 0.6),
            ("No phone in bed", "phone.down.fill", .ink, Array(1...7), 3, 0.7),
        ]
        var rng = SystemRandomNumberGenerator()
        for (i, s) in specs.enumerated() {
            let h = Habit(name: s.0, symbol: s.1, accent: s.2, weekdays: s.3, sortOrder: i)
            h.createdAt = today.adding(days: -90).anchor
            context.insert(h)
            for back in 1...84 {
                let day = today.adding(days: -back)
                // Guarantee the stated current streak, then fill older history at a rate.
                let inStreak = back <= s.4
                let breaksStreak = back == s.4 + 1
                if inStreak || (!breaksStreak && Double.random(in: 0...1, using: &rng) < s.5) {
                    if h.isScheduled(on: day) || inStreak {
                        let c = Completion(day: day)
                        context.insert(c)
                        h.completions.append(c)
                    }
                }
            }
            if i < 2 {
                let c = Completion(day: today)
                context.insert(c)
                h.completions.append(c)
            }
        }
    }
}
