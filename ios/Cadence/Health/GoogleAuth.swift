import CryptoKit
import Foundation
import Observation

enum HealthAuthError: LocalizedError {
    case missingClientID
    case stateMismatch
    case missingCode
    case notSignedIn
    case tokenExchange(String)
    case accountNotLinked
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .missingClientID:
            "Add your Google OAuth iOS client ID to Config/Config.xcconfig (GOOGLE_CLIENT_ID)."
        case .stateMismatch: "Sign-in was interrupted. Please try again."
        case .missingCode: "Google didn't return an authorization code."
        case .notSignedIn: "Connect your Fitbit account to continue."
        case .tokenExchange(let message): "Couldn't finish signing in: \(message)"
        case .accountNotLinked:
            "Your Fitbit data hasn't been linked to Google Health yet. Open the Google Health (Fitbit) app, sign in with Google, then try again."
        case .unauthorized: "Your Fitbit session expired. Please reconnect."
        }
    }
}

/// OAuth 2.0 (authorization code + PKCE) against Google, for the Google Health API.
/// Uses an *iOS* OAuth client, which has no client secret and redirects to the reversed client ID scheme.
@MainActor
@Observable
final class GoogleAuth {
    struct Tokens: Codable, Sendable {
        var accessToken: String
        var refreshToken: String?
        var expiresAt: Date
    }

    struct PendingRequest {
        let url: URL
        let verifier: String
        let state: String
    }

    static let scopes = [
        "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
        "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
        "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
    ]

    private static let keychainKey = "google.tokens"
    private static let authorizeEndpoint = URL(string: "https://accounts.google.com/o/oauth2/v2/auth")!
    private static let tokenEndpoint = URL(string: "https://oauth2.googleapis.com/token")!
    private static let revokeEndpoint = URL(string: "https://oauth2.googleapis.com/revoke")!

    private(set) var tokens: Tokens?
    @ObservationIgnored private var refreshTask: Task<Tokens, Error>?

    var isConnected: Bool { tokens != nil }

    init() {
        tokens = Keychain.codable(Tokens.self, for: Self.keychainKey)
    }

    // MARK: Configuration

    static var clientID: String {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "GoogleClientID") as? String) ?? ""
        return raw.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static var isConfigured: Bool {
        clientID.hasSuffix(".apps.googleusercontent.com") && !clientID.hasPrefix("YOUR_")
    }

    /// `123-abc.apps.googleusercontent.com` → `com.googleusercontent.apps.123-abc`
    static var callbackScheme: String {
        let prefix = clientID.replacingOccurrences(of: ".apps.googleusercontent.com", with: "")
        return "com.googleusercontent.apps.\(prefix)"
    }

    static var redirectURI: String { "\(callbackScheme):/oauth2redirect" }

    // MARK: Sign-in

    func makeAuthorizationRequest() throws -> PendingRequest {
        guard Self.isConfigured else { throw HealthAuthError.missingClientID }
        let verifier = Self.randomURLSafeString(byteCount: 48)
        let challenge = Data(SHA256.hash(data: Data(verifier.utf8))).base64URLEncoded
        let state = Self.randomURLSafeString(byteCount: 16)

        var components = URLComponents(url: Self.authorizeEndpoint, resolvingAgainstBaseURL: false)!
        components.queryItems = [
            .init(name: "client_id", value: Self.clientID),
            .init(name: "redirect_uri", value: Self.redirectURI),
            .init(name: "response_type", value: "code"),
            .init(name: "scope", value: Self.scopes.joined(separator: " ")),
            .init(name: "code_challenge", value: challenge),
            .init(name: "code_challenge_method", value: "S256"),
            .init(name: "state", value: state),
            .init(name: "access_type", value: "offline"),
            .init(name: "prompt", value: "consent"),
        ]
        return PendingRequest(url: components.url!, verifier: verifier, state: state)
    }

    func completeSignIn(callbackURL: URL, request: PendingRequest) async throws {
        let items = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?.queryItems ?? []
        if let error = items.first(where: { $0.name == "error" })?.value {
            throw HealthAuthError.tokenExchange(error)
        }
        guard items.first(where: { $0.name == "state" })?.value == request.state else {
            throw HealthAuthError.stateMismatch
        }
        guard let code = items.first(where: { $0.name == "code" })?.value else {
            throw HealthAuthError.missingCode
        }
        let tokens = try await Self.tokenRequest([
            "grant_type": "authorization_code",
            "code": code,
            "client_id": Self.clientID,
            "redirect_uri": Self.redirectURI,
            "code_verifier": request.verifier,
        ], existingRefreshToken: nil)
        store(tokens)
    }

    func signOut() {
        if let token = tokens?.refreshToken ?? tokens?.accessToken {
            var req = URLRequest(url: Self.revokeEndpoint)
            req.httpMethod = "POST"
            req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
            req.httpBody = "token=\(token.formEncoded)".data(using: .utf8)
            let revoke = req
            Task.detached { _ = try? await URLSession.shared.data(for: revoke) }
        }
        refreshTask?.cancel()
        refreshTask = nil
        store(nil)
    }

    // MARK: Tokens

    func validAccessToken() async throws -> String {
        guard let tokens else { throw HealthAuthError.notSignedIn }
        if tokens.expiresAt.timeIntervalSinceNow > 60 { return tokens.accessToken }
        return try await refresh().accessToken
    }

    /// Coalesces concurrent refreshes into one network call.
    func refresh() async throws -> Tokens {
        if let refreshTask { return try await refreshTask.value }
        guard let refreshToken = tokens?.refreshToken else {
            store(nil)
            throw HealthAuthError.unauthorized
        }
        let task = Task { () throws -> Tokens in
            try await Self.tokenRequest([
                "grant_type": "refresh_token",
                "refresh_token": refreshToken,
                "client_id": Self.clientID,
            ], existingRefreshToken: refreshToken)
        }
        refreshTask = task
        defer { refreshTask = nil }
        do {
            let fresh = try await task.value
            store(fresh)
            return fresh
        } catch HealthAuthError.tokenExchange {
            // Refresh token revoked or expired (test-mode Google apps expire them after 7 days).
            store(nil)
            throw HealthAuthError.unauthorized
        }
    }

    private func store(_ tokens: Tokens?) {
        self.tokens = tokens
        Keychain.setCodable(tokens, for: Self.keychainKey)
    }

    private static func tokenRequest(_ params: [String: String], existingRefreshToken: String?) async throws -> Tokens {
        struct Response: Decodable {
            let access_token: String
            let expires_in: Double
            let refresh_token: String?
        }
        struct ErrorResponse: Decodable {
            let error: String
            let error_description: String?
        }

        var req = URLRequest(url: tokenEndpoint)
        req.httpMethod = "POST"
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        req.httpBody = params.map { "\($0.key)=\($0.value.formEncoded)" }.joined(separator: "&").data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: req)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            let message = (try? JSONDecoder().decode(ErrorResponse.self, from: data))
                .map { $0.error_description ?? $0.error } ?? "HTTP \((response as? HTTPURLResponse)?.statusCode ?? 0)"
            throw HealthAuthError.tokenExchange(message)
        }
        let decoded = try JSONDecoder().decode(Response.self, from: data)
        return Tokens(
            accessToken: decoded.access_token,
            refreshToken: decoded.refresh_token ?? existingRefreshToken,
            expiresAt: Date().addingTimeInterval(decoded.expires_in)
        )
    }

    private static func randomURLSafeString(byteCount: Int) -> String {
        var bytes = [UInt8](repeating: 0, count: byteCount)
        _ = SecRandomCopyBytes(kSecRandomDefault, byteCount, &bytes)
        return Data(bytes).base64URLEncoded
    }
}

extension Data {
    var base64URLEncoded: String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

extension String {
    var formEncoded: String {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        return addingPercentEncoding(withAllowedCharacters: allowed) ?? self
    }
}
