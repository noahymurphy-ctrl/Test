import AuthenticationServices
import SwiftUI

struct OnboardingView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.webAuthenticationSession) private var webAuthenticationSession

    private enum Step: Int { case welcome, connect, claude }

    @State private var step: Step = .welcome
    @State private var isConnecting = false
    @State private var errorMessage: String?
    @State private var apiKey = ""

    var body: some View {
        ZStack {
            AppBackground(accent: step == .claude ? Theme.ink : Theme.ink)
                .animation(.easeInOut(duration: 0.6), value: step)

            VStack(spacing: 0) {
                Group {
                    switch step {
                    case .welcome: welcome
                    case .connect: connect
                    case .claude: claude
                    }
                }
                .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity),
                                        removal: .move(edge: .leading).combined(with: .opacity)))

                pageDots.padding(.bottom, 12)
            }
            .padding(.horizontal, 24)
        }
        .animation(.spring(response: 0.55, dampingFraction: 0.86), value: step)
        .sensoryFeedback(.selection, trigger: step)
    }

    // MARK: Pages

    private var welcome: some View {
        VStack(spacing: 28) {
            Spacer()
            HeroOrb()
                .frame(width: 220, height: 220)
            VStack(spacing: 12) {
                Text("Cadence")
                    .font(.display(44, .bold))
                    .foregroundStyle(Theme.textPrimary)
                Text("Your Fitbit data, finally understood.\nDeep analysis by Claude, every morning.")
                    .font(.system(size: 17))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.textSecondary)
                    .lineSpacing(3)
            }
            Spacer()
            Button("Get Started") { step = .connect }
                .buttonStyle(PrimaryButtonStyle())
        }
    }

    private var connect: some View {
        VStack(alignment: .leading, spacing: 22) {
            Spacer()
            IconBadge(symbol: "applewatch.radiowaves.left.and.right", tint: Theme.ink, size: 64)
            VStack(alignment: .leading, spacing: 10) {
                Text("Connect your Fitbit")
                    .font(.display(32, .bold))
                    .foregroundStyle(Theme.textPrimary)
                Text("Fitbit data now lives in Google Health. Sign in with the Google account linked to your Fitbit. Access is read-only.")
                    .foregroundStyle(Theme.textSecondary)
                    .lineSpacing(3)
            }
            VStack(alignment: .leading, spacing: 12) {
                permissionRow("figure.run", "Activity & workouts", "Steps, zone minutes, energy, exercise")
                permissionRow("moon.stars.fill", "Sleep", "Duration, stages and timing")
                permissionRow("heart.text.square.fill", "Health metrics", "Resting HR, HRV, SpO₂, breathing rate")
            }
            .padding(.top, 6)

            if let errorMessage {
                Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                    .font(.footnote)
                    .foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer()
            VStack(spacing: 12) {
                Button {
                    Task { await signIn() }
                } label: {
                    HStack(spacing: 10) {
                        if isConnecting { ProgressView().tint(.black) }
                        Text(isConnecting ? "Connecting…" : "Continue with Google")
                    }
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(isConnecting)

                Button("Explore with sample data") {
                    model.useDemoData = true
                    step = .claude
                }
                .buttonStyle(SecondaryButtonStyle())
            }
        }
    }

    private var claude: some View {
        VStack(alignment: .leading, spacing: 22) {
            Spacer()
            ZStack {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Theme.chrome)
                    .opacity(0.18)
                ClaudeSpark(size: 30, animating: true)
            }
            .frame(width: 64, height: 64)

            VStack(alignment: .leading, spacing: 10) {
                Text("Add Claude")
                    .font(.display(32, .bold))
                    .foregroundStyle(Theme.textPrimary)
                Text("Cadence uses Claude to write your daily brief and answer questions about your data. Paste an API key from the Claude Console.")
                    .foregroundStyle(Theme.textSecondary)
                    .lineSpacing(3)
            }

            SecureField("", text: $apiKey, prompt: Text("sk-ant-…").foregroundStyle(Theme.textTertiary))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(.system(.body, design: .monospaced))
                .padding(16)
                .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Theme.hairline))

            Link(destination: URL(string: "https://platform.claude.com/settings/keys")!) {
                Label("Get an API key", systemImage: "arrow.up.right.square")
                    .font(.subheadline.weight(.medium))
            }

            Label("Your key stays in the iOS Keychain. Health data is sent only to Anthropic's API when you request analysis.",
                  systemImage: "lock.shield.fill")
                .font(.footnote)
                .foregroundStyle(Theme.textTertiary)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()
            VStack(spacing: 12) {
                Button("Finish") {
                    model.setClaudeAPIKey(apiKey)
                    model.hasOnboarded = true
                }
                .buttonStyle(PrimaryButtonStyle(gradient: Theme.chrome))
                .disabled(apiKey.trimmingCharacters(in: .whitespaces).isEmpty)
                .opacity(apiKey.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)

                Button("Skip for now") { model.hasOnboarded = true }
                    .buttonStyle(SecondaryButtonStyle())
            }
        }
    }

    // MARK: Pieces

    private func permissionRow(_ symbol: String, _ title: String, _ subtitle: String) -> some View {
        HStack(spacing: 14) {
            IconBadge(symbol: symbol, tint: Theme.ink, size: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.textPrimary)
                Text(subtitle).font(.footnote).foregroundStyle(Theme.textSecondary)
            }
        }
    }

    private var pageDots: some View {
        HStack(spacing: 6) {
            ForEach(0..<3) { i in
                Capsule()
                    .fill(i == step.rawValue ? Theme.textPrimary : Theme.textTertiary.opacity(0.5))
                    .frame(width: i == step.rawValue ? 18 : 6, height: 6)
            }
        }
        .padding(.top, 20)
    }

    private func signIn() async {
        errorMessage = nil
        isConnecting = true
        defer { isConnecting = false }
        do {
            let request = try model.auth.makeAuthorizationRequest()
            let callback = try await webAuthenticationSession.authenticate(
                using: request.url,
                callbackURLScheme: GoogleAuth.callbackScheme,
                preferredBrowserSession: .ephemeral
            )
            try await model.auth.completeSignIn(callbackURL: callback, request: request)
            try await model.health.verifyConnection()
            model.useDemoData = false
            step = .claude
        } catch let error as ASWebAuthenticationSessionError where error.code == .canceledLogin {
            // User closed the sheet.
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Animated brand mark: concentric rings breathing around a glowing core.
struct HeroOrb: View {
    @State private var breathe = false

    var body: some View {
        ZStack {
            ForEach(0..<3) { i in
                Circle()
                    .strokeBorder(
                        AngularGradient(colors: [Theme.ink, Theme.ink, Theme.ink], center: .center),
                        lineWidth: 1.5
                    )
                    .opacity(0.65 - Double(i) * 0.18)
                    .scaleEffect(breathe ? 1 - CGFloat(i) * 0.18 : 0.92 - CGFloat(i) * 0.2)
                    .rotationEffect(.degrees(breathe ? Double(i) * 40 + 60 : Double(i) * 40))
            }
            Circle()
                .fill(RadialGradient(colors: [Theme.ink.opacity(0.9), Theme.ink.opacity(0.4), .clear],
                                     center: .center, startRadius: 2, endRadius: 70))
                .frame(width: 120, height: 120)
                .blur(radius: 8)
                .scaleEffect(breathe ? 1.08 : 0.9)
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 40, weight: .semibold))
                .foregroundStyle(.white)
                .shadow(color: Theme.ink, radius: 12)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 3.2).repeatForever(autoreverses: true)) { breathe = true }
        }
    }
}
