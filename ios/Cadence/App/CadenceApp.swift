import SwiftUI

@main
struct CadenceApp: App {
    @State private var model = AppModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .preferredColorScheme(.dark)
                .tint(Theme.ink)
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active, model.hasOnboarded else { return }
            // Refresh on foreground if the data is more than 15 minutes old.
            let age = model.health.snapshot.map { Date().timeIntervalSince($0.fetchedAt) } ?? .infinity
            if age > 15 * 60 { Task { await model.refresh() } }
        }
    }
}

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ZStack {
            if model.hasOnboarded {
                MainTabView()
                    .transition(.opacity.combined(with: .scale(scale: 1.02)))
            } else {
                OnboardingView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: model.hasOnboarded)
    }
}

struct MainTabView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        TabView(selection: $model.selectedTab) {
            TodayView()
                .tabItem { Label("Today", systemImage: "circle.hexagongrid.fill") }
                .tag(AppTab.today)
            TrendsView()
                .tabItem { Label("Trends", systemImage: "chart.xyaxis.line") }
                .tag(AppTab.trends)
            SleepView()
                .tabItem { Label("Sleep", systemImage: "moon.zzz.fill") }
                .tag(AppTab.sleep)
            CoachView()
                .tabItem { Label("Coach", systemImage: "sparkles") }
                .tag(AppTab.coach)
        }
        .sheet(isPresented: $model.showSettings) {
            SettingsView()
        }
        .task {
            if model.health.snapshot == nil || model.brief.brief == nil {
                await model.refresh()
            }
        }
        .onAppear {
            let appearance = UITabBarAppearance()
            appearance.configureWithDefaultBackground()
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
            appearance.backgroundColor = UIColor(Theme.canvas.opacity(0.6))
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}
