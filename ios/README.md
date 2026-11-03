# Cadence: a native iOS habit tracker

SwiftUI + SwiftData, iOS 17+. No accounts, no backend. Data stays on the device.

## Run it on your iPhone
1. On your Mac, clone this repo and open `ios/Cadence.xcodeproj` (Xcode 16 or later).
2. Select the **Cadence** target → *Signing & Capabilities* → choose your Team (a free Apple ID works).
   If Xcode reports that the bundle ID is taken, change `com.noahmurphy.cadence` to something unique.
3. Plug in your iPhone, select it as the run destination, and press ⌘R.
   On the first install, trust the developer on the phone: *Settings → General → VPN & Device Management*.
4. Unit and UI tests: ⌘U.

To launch with sample data, open *Product → Scheme → Edit Scheme → Run → Arguments* and enable `-seed`.
Seeded data is held in memory only, so it never touches your real habits.

## Gestures
- **Tap** a capsule to complete or un-complete it.
- **Hold** a capsule, then release, to open its history.
- **Hold and drag** a capsule to reorder.
- In the history view, tap any past day to fix it.

## Layout
| Path | What |
|---|---|
| `Cadence/Feel/Tuning.swift` | **Every** spring, duration, and haptic style or intensity. Tune feel here. |
| `Cadence/Feel/Haptics.swift` | Feedback generators. Each call runs `prepare()` before it fires. |
| `Cadence/Model/DayKey.swift` | A calendar day (yyyymmdd) captured in the local zone when the user taps |
| `Cadence/Model/Streak.swift` | Pure streak math, unit tested |
| `Cadence/Model/Habit.swift` | SwiftData models and the accent palette |
| `Cadence/Views/*` | Today, the capsule, rings and counting numbers, detail, editor, theme |
| `CadenceTests/` | Streak tests: midnight, time zones, DST, leap years |
| `CadenceUITests/` | Drives tap, hold, and hold+drag in the simulator |

CI (`.github/workflows/ios.yml`) builds the app and runs both test suites on a macOS runner. It then saves simulator screenshots to the `ios-ci-output` branch.

## Streak rules
- Completing a day extends the streak, even on a day the habit isn't scheduled.
- Missing a scheduled day breaks the streak.
- Unscheduled days are skipped.
- Today never breaks a streak. It stays pending until midnight.
- Each completion is stored as the calendar day you saw when you tapped. Traveling never moves a completed day onto a different date.
