import AuthenticationServices
import SwiftUI

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Environment(\.webAuthenticationSession) private var webAuthenticationSession

    @State private var keyDraft = ""
    @State private var editingKey = false
    @State private var connecting = false
    @State private var connectError: String?
    @State private var confirmReset = false

    var body: some View {
        @Bindable var model = model
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 14) {
                        IconBadge(symbol: "applewatch", tint: model.auth.isConnected ? Theme.ink : Theme.textSecondary, size: 40)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Fitbit").font(.headline)
                            Text(model.auth.isConnected ? "Connected via Google Health" : "Not connected")
                                .font(.footnote).foregroundStyle(Theme.textSecondary)
                        }
                    }
                    if model.auth.isConnected {
                        Toggle("Use sample data", isOn: $model.useDemoData)
                            .onChange(of: model.useDemoData) { Task { await model.refresh(forceBrief: true) } }
                        Button("Disconnect", role: .destructive) { model.disconnectFitbit() }
                    } else {
                        Button {
                            Task { await connect() }
                        } label: {
                            HStack {
                                Text(connecting ? "Connecting…" : "Connect with Google")
                                if connecting { Spacer(); ProgressView() }
                            }
                        }
                        .disabled(connecting)
                    }
                    if let connectError {
                        Text(connectError).font(.footnote).foregroundStyle(Theme.ink)
                    }
                } header: {
                    Text("Data Source")
                } footer: {
                    Text("Read-only access to activity, sleep and health metrics. Fitbit data must be linked to Google Health in the Fitbit app.")
                }

                Section {
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Theme.ink.opacity(0.16))
                            ClaudeSpark(size: 18)
                        }
                        .frame(width: 40, height: 40)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Claude").font(.headline)
                            Text(model.hasClaudeKey ? "Key ••••\(String(model.claudeAPIKey.suffix(4)))" : "No API key")
                                .font(.footnote).foregroundStyle(Theme.textSecondary)
                        }
                    }
                    if editingKey {
                        SecureField("sk-ant-…", text: $keyDraft)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .font(.system(.body, design: .monospaced))
                        Button("Save Key") {
                            model.setClaudeAPIKey(keyDraft)
                            keyDraft = ""
                            editingKey = false
                            Task { await model.generateBriefIfNeeded(force: true) }
                        }
                        .disabled(keyDraft.trimmingCharacters(in: .whitespaces).isEmpty)
                    } else {
                        Button(model.hasClaudeKey ? "Replace API Key" : "Add API Key") { editingKey = true }
                    }
                    if model.hasClaudeKey {
                        Button("Remove Key", role: .destructive) { model.setClaudeAPIKey("") }
                    }
                    Link("Get an API key", destination: URL(string: "https://platform.claude.com/settings/keys")!)
                    LabeledContent("Model", value: "Claude Opus 5.5")
                } header: {
                    Text("AI Analysis")
                } footer: {
                    Text("Your key is stored in the iOS Keychain on this device. When you open a brief or ask a question, your recent health summary is sent to Anthropic's API to generate the response.")
                }

                Section {
                    Button("Reset Cadence", role: .destructive) { confirmReset = true }
                } footer: {
                    Text("Cadence provides wellness insights, not medical advice.")
                }
            }
            .scrollContentBackground(.hidden)
            .background(AppBackground())
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
            .confirmationDialog("Disconnect, delete your key and cached data?", isPresented: $confirmReset, titleVisibility: .visible) {
                Button("Reset", role: .destructive) {
                    model.resetEverything()
                    dismiss()
                }
            }
        }
        .presentationBackground(Theme.canvas)
    }

    private func connect() async {
        connectError = nil
        connecting = true
        defer { connecting = false }
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
            await model.refresh(forceBrief: true)
        } catch let error as ASWebAuthenticationSessionError where error.code == .canceledLogin {
        } catch {
            connectError = error.localizedDescription
        }
    }
}
