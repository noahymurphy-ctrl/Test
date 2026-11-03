import Foundation
import Observation

enum AppTab: Hashable { case today, trends, sleep, coach }

/// Root state shared through the environment.
@MainActor
@Observable
final class AppModel {
    let auth = GoogleAuth()
    let health: HealthStore
    let brief: BriefModel
    let coach: CoachModel

    var selectedTab: AppTab = .today
    var showSettings = false

    var hasOnboarded: Bool {
        didSet { UserDefaults.standard.set(hasOnboarded, forKey: "hasOnboarded") }
    }

    var useDemoData: Bool {
        didSet { UserDefaults.standard.set(useDemoData, forKey: "useDemoData") }
    }

    private(set) var claudeAPIKey: String

    init() {
        health = HealthStore(auth: auth)
        brief = BriefModel()
        coach = CoachModel()
        hasOnboarded = UserDefaults.standard.bool(forKey: "hasOnboarded")
        useDemoData = UserDefaults.standard.bool(forKey: "useDemoData")
        claudeAPIKey = Keychain.string(for: "claude.apiKey") ?? ""
    }

    var dataSource: HealthStore.Source { useDemoData || !auth.isConnected ? .demo : .googleHealth }
    var hasClaudeKey: Bool { !claudeAPIKey.isEmpty }
    var readiness: Readiness? { health.snapshot.flatMap(Readiness.compute(from:)) }

    func setClaudeAPIKey(_ key: String) {
        claudeAPIKey = key.trimmingCharacters(in: .whitespacesAndNewlines)
        Keychain.setString(claudeAPIKey.isEmpty ? nil : claudeAPIKey, for: "claude.apiKey")
    }

    /// Sync health data, then (re)generate the brief if the data changed.
    func refresh(forceBrief: Bool = false) async {
        await health.sync(source: dataSource)
        await generateBriefIfNeeded(force: forceBrief)
    }

    func generateBriefIfNeeded(force: Bool = false) async {
        guard let snapshot = health.snapshot, hasClaudeKey else { return }
        await brief.generate(snapshot: snapshot, readiness: readiness, apiKey: claudeAPIKey, force: force)
    }

    func ask(_ prompt: String) {
        selectedTab = .coach
        guard let snapshot = health.snapshot else { return }
        coach.send(prompt, snapshot: snapshot, readiness: readiness, apiKey: claudeAPIKey)
    }

    func disconnectFitbit() {
        auth.signOut()
        health.reset()
        brief.reset()
        coach.reset()
    }

    func resetEverything() {
        disconnectFitbit()
        setClaudeAPIKey("")
        useDemoData = false
        hasOnboarded = false
    }
}
