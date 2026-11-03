import Foundation

enum ClaudeError: LocalizedError {
    case missingAPIKey
    case http(Int, String)
    case refusal
    case emptyResponse
    case stream(String)

    var errorDescription: String? {
        switch self {
        case .missingAPIKey: "Add your Claude API key in Settings to unlock AI insights."
        case .http(401, _): "Your Claude API key was rejected. Check it in Settings."
        case .http(429, _): "Claude is rate-limited right now. Try again in a moment."
        case .http(529, _): "Claude is overloaded right now. Try again in a moment."
        case .http(let code, let message): "Claude error \(code): \(message)"
        case .refusal: "Claude declined to answer that one. Try rephrasing."
        case .emptyResponse: "Claude returned an empty response."
        case .stream(let message): message
        }
    }
}

/// Messages API client. There's no official Swift SDK, so this speaks the documented HTTP/SSE protocol directly.
struct ClaudeClient: Sendable {
    static let model = "claude-opus-5-5"
    private static let endpoint = URL(string: "https://api.anthropic.com/v1/messages")!
    private static let apiVersion = "2026-10-21"
    /// Server-side refusal fallback: if a safety classifier declines, the API re-runs the request on a recommended model.
    private static let fallbackBeta = "server-side-fallback-2026-07-01"

    struct Turn: Sendable, Codable, Hashable {
        enum Role: String, Codable, Sendable { case user, assistant }
        var role: Role
        var text: String
    }

    struct SystemBlock: Sendable {
        var text: String
        var cache: Bool = false
    }

    enum Event: Sendable {
        case thinking(String)
        case text(String)
        case finished(stopReason: String?)
    }

    let apiKey: String

    // MARK: Streaming chat

    func stream(system: [SystemBlock], turns: [Turn], effort: String = "medium") -> AsyncThrowingStream<Event, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    var body = baseBody(system: system, turns: turns, effort: effort, maxTokens: 64_000)
                    body["stream"] = true
                    body["thinking"] = ["type": "adaptive", "display": "summarized"]
                    let request = try makeRequest(body)

                    let (bytes, response) = try await URLSession.shared.bytes(for: request)
                    let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                    guard status == 200 else {
                        var raw = Data()
                        for try await byte in bytes { raw.append(byte) }
                        throw ClaudeError.http(status, Self.errorMessage(from: raw))
                    }

                    var stopReason: String?
                    for try await line in bytes.lines {
                        try Task.checkCancellation()
                        guard line.hasPrefix("data:") else { continue }
                        let payload = line.dropFirst(5).trimmingCharacters(in: .whitespaces)
                        guard let data = payload.data(using: .utf8),
                              let event = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                              let type = event["type"] as? String else { continue }

                        switch type {
                        case "content_block_delta":
                            let delta = event["delta"] as? [String: Any]
                            switch delta?["type"] as? String {
                            case "text_delta":
                                if let text = delta?["text"] as? String { continuation.yield(.text(text)) }
                            case "thinking_delta":
                                if let text = delta?["thinking"] as? String { continuation.yield(.thinking(text)) }
                            default: break
                            }
                        case "message_delta":
                            if let reason = (event["delta"] as? [String: Any])?["stop_reason"] as? String {
                                stopReason = reason
                            }
                        case "error":
                            let message = ((event["error"] as? [String: Any])?["message"] as? String) ?? "Stream interrupted."
                            throw ClaudeError.stream(message)
                        default:
                            break
                        }
                    }
                    continuation.yield(.finished(stopReason: stopReason))
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    // MARK: Structured output

    /// One-shot request constrained to a JSON schema (`output_config.format`), decoded into `T`.
    func structured<T: Decodable>(_ type: T.Type, system: [SystemBlock], prompt: String,
                                  schema: [String: Any], effort: String = "medium") async throws -> T {
        var body = baseBody(system: system, turns: [Turn(role: .user, text: prompt)], effort: effort, maxTokens: 16_000)
        var outputConfig = body["output_config"] as? [String: Any] ?? [:]
        outputConfig["format"] = ["type": "json_schema", "schema": schema]
        body["output_config"] = outputConfig

        var request = try makeRequest(body)
        request.timeoutInterval = 300
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard status == 200 else { throw ClaudeError.http(status, Self.errorMessage(from: data)) }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw ClaudeError.emptyResponse }
        if json["stop_reason"] as? String == "refusal" { throw ClaudeError.refusal }
        let blocks = json["content"] as? [[String: Any]] ?? []
        guard let text = blocks.first(where: { $0["type"] as? String == "text" })?["text"] as? String,
              let payload = text.data(using: .utf8) else { throw ClaudeError.emptyResponse }
        return try JSONDecoder().decode(T.self, from: payload)
    }

    // MARK: Plumbing

    private func baseBody(system: [SystemBlock], turns: [Turn], effort: String, maxTokens: Int) -> [String: Any] {
        [
            "model": Self.model,
            "max_tokens": maxTokens,
            "system": system.map { block -> [String: Any] in
                var b: [String: Any] = ["type": "text", "text": block.text]
                if block.cache { b["cache_control"] = ["type": "ephemeral"] }
                return b
            },
            "messages": turns.map { ["role": $0.role.rawValue, "content": $0.text] },
            "output_config": ["effort": effort],
            "fallbacks": "default",
        ]
    }

    private func makeRequest(_ body: [String: Any]) throws -> URLRequest {
        guard !apiKey.isEmpty else { throw ClaudeError.missingAPIKey }
        var request = URLRequest(url: Self.endpoint)
        request.httpMethod = "POST"
        request.timeoutInterval = 600
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue(Self.apiVersion, forHTTPHeaderField: "anthropic-version")
        request.setValue(Self.fallbackBeta, forHTTPHeaderField: "anthropic-beta")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        return request
    }

    private static func errorMessage(from data: Data) -> String {
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let error = json["error"] as? [String: Any], let message = error["message"] as? String {
            return message
        }
        return String(data: data, encoding: .utf8)?.prefix(200).description ?? "Unknown error"
    }
}
