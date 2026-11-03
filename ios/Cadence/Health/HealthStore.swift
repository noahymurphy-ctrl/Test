import Foundation
import Observation

/// Owns the current health snapshot: loads from disk cache instantly, then syncs from Google Health.
@MainActor
@Observable
final class HealthStore {
    enum Source: String { case demo, googleHealth }

    private(set) var snapshot: HealthSnapshot?
    private(set) var isSyncing = false
    private(set) var lastError: String?
    private(set) var needsAccountLink = false

    let historyDays = 30

    @ObservationIgnored private let auth: GoogleAuth
    @ObservationIgnored private let client: GoogleHealthClient

    init(auth: GoogleAuth) {
        self.auth = auth
        client = GoogleHealthClient(
            accessToken: { try await auth.validAccessToken() },
            forceRefresh: { try await auth.refresh().accessToken }
        )
        snapshot = Self.loadCache()
    }

    func clearError() { lastError = nil }

    func verifyConnection() async throws {
        do {
            try await client.verifyIdentity()
            needsAccountLink = false
        } catch HealthAPIError.accountNotLinked {
            needsAccountLink = true
            throw HealthAuthError.accountNotLinked
        }
    }

    func sync(source: Source) async {
        guard !isSyncing else { return }
        isSyncing = true
        defer { isSyncing = false }
        lastError = nil

        switch source {
        case .demo:
            try? await Task.sleep(nanoseconds: 450_000_000) // let the refresh animation breathe
            snapshot = DemoData.snapshot(days: historyDays)
        case .googleHealth:
            do {
                let fresh = try await fetch()
                snapshot = fresh
                needsAccountLink = false
                Self.saveCache(fresh)
            } catch HealthAPIError.accountNotLinked {
                needsAccountLink = true
                lastError = HealthAuthError.accountNotLinked.errorDescription
            } catch {
                lastError = error.localizedDescription
            }
        }
    }

    func reset() {
        snapshot = nil
        lastError = nil
        needsAccountLink = false
        Self.saveCache(nil)
    }

    // MARK: Fetch

    private func fetch() async throws -> HealthSnapshot {
        let start = Date().startOfDay.adding(days: -(historyDays - 1))
        let end = Date().startOfDay.adding(days: 1)
        let startDay = start.isoDay
        let sleepFrom = start.adding(days: -1).rfc3339UTC
        let client = client

        // Every stream is fetched concurrently and fails independently: a missing scope or an
        // unsupported metric shouldn't blank the whole dashboard. Auth problems still surface.
        async let steps = attempt { try await client.dailyRollUp("steps", from: start, to: end) }
        async let calories = attempt { try await client.dailyRollUp("total-calories", from: start, to: end) }
        async let distance = attempt { try await client.dailyRollUp("distance", from: start, to: end) }
        async let heartRate = attempt { try await client.dailyRollUp("heart-rate", from: start, to: end) }
        async let azm = attempt { try await client.dailyRollUp("active-zone-minutes", from: start, to: end) }
        async let activeMinutes = attempt { try await client.dailyRollUp("active-minutes", from: start, to: end) }
        async let rhr = attempt {
            try await client.list("daily-resting-heart-rate", filter: "daily_resting_heart_rate.date >= \"\(startDay)\"", pageSize: 100)
        }
        async let hrv = attempt {
            try await client.list("daily-heart-rate-variability", filter: "daily_heart_rate_variability.date >= \"\(startDay)\"", pageSize: 100)
        }
        async let spo2 = attempt {
            try await client.list("daily-oxygen-saturation", filter: "daily_oxygen_saturation.date >= \"\(startDay)\"", pageSize: 100)
        }
        async let resp = attempt {
            try await client.list("daily-respiratory-rate", filter: "daily_respiratory_rate.date >= \"\(startDay)\"", pageSize: 100)
        }
        async let sleep = attempt {
            try await client.list("sleep", filter: "sleep.interval.end_time >= \"\(sleepFrom)\"", pageSize: 25)
        }
        async let exercise = attempt {
            try await client.list("exercise", filter: "exercise.interval.civil_start_time >= \"\(startDay)\"", pageSize: 25)
        }

        let results: [Result<Any, Error>] = [
            await steps.erased, await calories.erased, await distance.erased, await heartRate.erased,
            await azm.erased, await activeMinutes.erased, await rhr.erased, await hrv.erased,
            await spo2.erased, await resp.erased, await sleep.erased, await exercise.erased,
        ]
        let failures = results.compactMap { r -> Error? in if case .failure(let e) = r { return e } else { return nil } }
        if let authError = failures.first(where: { ($0 as? HealthAPIError)?.isAuthProblem == true || $0 is HealthAuthError }) {
            throw authError
        }
        if failures.count == results.count, let first = failures.first { throw first }

        var raw = RawHealthData()
        raw.steps = (try? await steps.get()) ?? []
        raw.calories = (try? await calories.get()) ?? []
        raw.distance = (try? await distance.get()) ?? []
        raw.heartRate = (try? await heartRate.get()) ?? []
        raw.zoneMinutes = (try? await azm.get()) ?? []
        raw.activeMinutes = (try? await activeMinutes.get()) ?? []
        raw.restingHeartRate = (try? await rhr.get()) ?? []
        raw.hrv = (try? await hrv.get()) ?? []
        raw.spo2 = (try? await spo2.get()) ?? []
        raw.respiratoryRate = (try? await resp.get()) ?? []
        raw.sleep = (try? await sleep.get()) ?? []
        raw.exercise = (try? await exercise.get()) ?? []

        return SnapshotBuilder.build(raw, start: start, days: historyDays)
    }

    // MARK: Cache

    private static var cacheURL: URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("health-snapshot.json")
    }

    private static func loadCache() -> HealthSnapshot? {
        guard let data = try? Data(contentsOf: cacheURL) else { return nil }
        return try? JSONDecoder().decode(HealthSnapshot.self, from: data)
    }

    private static func saveCache(_ snapshot: HealthSnapshot?) {
        guard let snapshot, let data = try? JSONEncoder().encode(snapshot) else {
            try? FileManager.default.removeItem(at: cacheURL)
            return
        }
        try? data.write(to: cacheURL, options: [.atomic, .completeFileProtection])
    }
}

private func attempt<T>(_ body: () async throws -> T) async -> Result<T, Error> {
    do { return .success(try await body()) } catch { return .failure(error) }
}

private extension Result {
    var erased: Result<Any, Error> {
        switch self {
        case .success(let v): .success(v)
        case .failure(let e): .failure(e)
        }
    }
}
