import Foundation

enum HealthAPIError: LocalizedError {
    case http(Int, String)
    case accountNotLinked
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .http(let code, let message): "Google Health returned \(code): \(message)"
        case .accountNotLinked: HealthAuthError.accountNotLinked.errorDescription
        case .unauthorized: HealthAuthError.unauthorized.errorDescription
        }
    }

    var isAuthProblem: Bool {
        switch self {
        case .accountNotLinked, .unauthorized: true
        case .http: false
        }
    }
}

/// Thin, typed client over the Google Health API v4.
struct GoogleHealthClient: Sendable {
    /// Returns a valid access token (refreshing if needed).
    let accessToken: @Sendable () async throws -> String
    /// Forces a refresh and returns the new access token.
    let forceRefresh: @Sendable () async throws -> String

    private let base = URL(string: "https://health.googleapis.com/v4/users/me/")!
    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        return URLSession(configuration: config)
    }()

    init(accessToken: @escaping @Sendable () async throws -> String,
         forceRefresh: @escaping @Sendable () async throws -> String) {
        self.accessToken = accessToken
        self.forceRefresh = forceRefresh
    }

    // MARK: Endpoints

    func verifyIdentity() async throws {
        _ = try await send(path: "identity", method: "GET", body: nil)
    }

    /// Daily totals for `[start, endExclusive)`, transparently chunked to the API's per-type range limit and paginated.
    func dailyRollUp(_ dataType: String, from start: Date, to endExclusive: Date) async throws -> [RollupDataPoint] {
        let maxDays = Self.fourteenDayTypes.contains(dataType) ? 14 : 90
        var results: [RollupDataPoint] = []
        var chunkStart = start.startOfDay
        while chunkStart < endExclusive {
            let chunkEnd = min(chunkStart.adding(days: maxDays), endExclusive)
            var pageToken: String?
            repeat {
                let request = DailyRollUpRequest(
                    range: .init(start: .midnight(chunkStart), end: .midnight(chunkEnd)),
                    windowSizeDays: 1,
                    pageSize: maxDays,
                    pageToken: pageToken
                )
                let data = try await send(
                    path: "dataTypes/\(dataType)/dataPoints:dailyRollUp",
                    method: "POST",
                    body: try JSONEncoder().encode(request)
                )
                let page = try JSONDecoder().decode(DailyRollUpResponse.self, from: data)
                results += page.rollupDataPoints ?? []
                pageToken = page.nextPageToken?.isEmpty == false ? page.nextPageToken : nil
            } while pageToken != nil
            chunkStart = chunkEnd
        }
        return results
    }

    func list(_ dataType: String, filter: String, pageSize: Int, maxPages: Int = 10) async throws -> [APIDataPoint] {
        var results: [APIDataPoint] = []
        var pageToken: String?
        var pages = 0
        repeat {
            var query = [URLQueryItem(name: "filter", value: filter), URLQueryItem(name: "pageSize", value: String(pageSize))]
            if let pageToken { query.append(URLQueryItem(name: "pageToken", value: pageToken)) }
            let data = try await send(path: "dataTypes/\(dataType)/dataPoints", method: "GET", body: nil, query: query)
            let page = try JSONDecoder().decode(ListDataPointsResponse.self, from: data)
            results += page.dataPoints ?? []
            pageToken = page.nextPageToken?.isEmpty == false ? page.nextPageToken : nil
            pages += 1
        } while pageToken != nil && pages < maxPages
        return results
    }

    // MARK: Transport

    private static let fourteenDayTypes: Set<String> = [
        "heart-rate", "active-minutes", "total-calories", "calories-in-heart-rate-zone",
    ]

    private func send(path: String, method: String, body: Data?, query: [URLQueryItem] = []) async throws -> Data {
        var components = URLComponents(url: base.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { components.queryItems = query }
        // `appendingPathComponent` percent-encodes ":" in custom methods like `dataPoints:dailyRollUp`; undo that.
        components.percentEncodedPath = components.percentEncodedPath.replacingOccurrences(of: "%3A", with: ":")

        var request = URLRequest(url: components.url!)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        var didRefresh = false
        var backoff: UInt64 = 500_000_000
        for attempt in 0..<4 {
            let token = didRefresh ? try await forceRefresh() : try await accessToken()
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            let (data, response) = try await session.data(for: request)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0

            if [429, 500, 503, 504].contains(status) && attempt < 3 {
                try await Task.sleep(nanoseconds: backoff)
                backoff *= 2
                continue
            }

            switch status {
            case 200..<300:
                return data
            case 401 where !didRefresh:
                didRefresh = true
                continue
            case 401:
                throw HealthAPIError.unauthorized
            default:
                let envelope = try? JSONDecoder().decode(GoogleAPIErrorEnvelope.self, from: data)
                if envelope?.error.details?.contains(where: { $0.reason == "ACCOUNT_NOT_LINKED" }) == true {
                    throw HealthAPIError.accountNotLinked
                }
                throw HealthAPIError.http(status, envelope?.error.message ?? HTTPURLResponse.localizedString(forStatusCode: status))
            }
        }
        throw HealthAPIError.http(503, "Service unavailable after retries")
    }
}
