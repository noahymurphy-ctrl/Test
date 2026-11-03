# Cadence for iPhone

A native SwiftUI app that pulls your Fitbit data and uses Claude to analyze it.

- **Today:** an on-device recovery score (HRV, resting HR and sleep compared with your 28-day baseline), a structured **Daily Brief** written by Claude, metric tiles with sparklines, last night's sleep and recent workouts.
- **Trends:** 7/14/30-day charts for every metric. Tap one to scrub through the days and see averages, highs, lows and trend.
- **Sleep:** a stage-by-stage hypnogram, a stage breakdown, two weeks of stacked sleep history, and how consistent your bedtime is.
- **Coach:** a streaming chat with Claude that sees your last 30 days of data. It shows a short hint of Claude's reasoning while it works.
- **Sample data mode:** lets you explore every screen before you connect anything.

Requires iOS 17+ and Xcode 16+.

## Important: Fitbit → Google Health API

Google retired the legacy Fitbit Web API on **October 30, 2026**. Cadence uses its replacement, the
**[Google Health API](https://developers.google.com/health)** (`health.googleapis.com/v4`), with Google OAuth.
Before signing in, your Fitbit account has to be linked to Google: open the Fitbit / Google Health app, sign in with Google, and migrate your account.

## Setup (about 10 minutes)

### 1. Google Cloud: enable the API and create an iOS OAuth client

1. In the [Google Cloud console](https://console.cloud.google.com/), create or pick a project.
2. Enable the **Google Health API** (`APIs & Services → Library`, search "Google Health API").
3. Under **Google Auth Platform → Audience**, set User type **External** and leave it in **Testing**. Add your own Google account under **Test users**.
4. Under **Data Access → Add or remove scopes**, add these read-only scopes:
   - `.../auth/googlehealth.activity_and_fitness.readonly`
   - `.../auth/googlehealth.sleep.readonly`
   - `.../auth/googlehealth.health_metrics_and_measurements.readonly`
5. Under **Clients → Create client**, choose application type **iOS** and enter the bundle ID you'll use (for example `com.yourname.cadence`).
   Copy the **Client ID**. It looks like `1234567890-abc.apps.googleusercontent.com`.

> While the app is in Testing mode, Google expires refresh tokens after 7 days, so you'll need to reconnect weekly.
> Publishing the OAuth app (under Audience) removes that limit.

### 2. Configure the project

Edit `Config/Config.xcconfig`:

```
DEVELOPMENT_TEAM = ABCDE12345            // your Apple team ID
PRODUCT_BUNDLE_IDENTIFIER = com.yourname.cadence   // must match the Google iOS client
GOOGLE_CLIENT_ID = 1234567890-abc.apps.googleusercontent.com
```

The app builds its redirect URI from the client ID (`com.googleusercontent.apps.1234567890-abc:/oauth2redirect`), so you don't need to configure a URL scheme.

### 3. Build and run

Open `Cadence.xcodeproj` in Xcode, select your iPhone, and press Run.
If Xcode ever has trouble with the project file, regenerate it with `brew install xcodegen && xcodegen`.

### 4. Claude API key

Create a key at [platform.claude.com](https://platform.claude.com/settings/keys) and paste it into the app,
either during onboarding or later in Settings. The key is stored in the iOS Keychain.

## How it works

| Layer | Files |
| --- | --- |
| Google OAuth (PKCE, iOS client, token refresh, Keychain) | `Health/GoogleAuth.swift` |
| Google Health API client (dailyRollUp chunking, pagination, retry/backoff) | `Health/GoogleHealthClient.swift`, `Health/GoogleHealthAPIModels.swift` |
| Merge into per-day metrics, sleep stages, workouts | `Health/SnapshotBuilder.swift`, `Health/HealthStore.swift` |
| Recovery score | `Health/Readiness.swift` |
| Claude Messages API over raw HTTP/SSE | `Claude/ClaudeClient.swift` |
| Prompt and health-data context | `Claude/CoachContext.swift` |
| Daily Brief (structured JSON output) | `Claude/DailyBrief.swift`, `Claude/BriefModel.swift` |
| Streaming chat | `Claude/CoachModel.swift`, `Features/Coach/CoachView.swift` |

Claude details:
- Model `claude-opus-5-5` with adaptive thinking. It uses `medium` effort for both the brief and chat.
- The Daily Brief uses `output_config.format` (a JSON schema), so Claude's answer decodes directly into native cards. It's cached per day and only regenerated when new sleep, recovery or workout data arrives.
- The persona and the 30-day data block are sent as system blocks, and the data block is marked `cache_control`. This makes follow-up questions in a conversation cheaper and faster.
- Server-side refusal fallback is on (`fallbacks: "default"` with the `server-side-fallback-2026-07-01` beta).

## Privacy

- Fitbit access is read-only. Tokens and the Claude key live in the Keychain, and cached health data is written with complete file protection.
- Your health data leaves the device only when it's sent to Anthropic's API to generate a brief or answer a question.
- The API key is stored on the device, which is fine for personal use. Before distributing this app to other people, move Claude calls behind your own backend so no key ships in the app.
- Cadence gives wellness insights, not medical advice.
