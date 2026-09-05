# Shipping Bit Wars to the App Store

The game is packaged as a native iOS app with [Capacitor](https://capacitorjs.com): a thin Swift shell (`ios/App`) that hosts the game in a WKWebView with every file bundled inside the app. Nothing is loaded from the network at runtime, which keeps it squarely inside App Store guideline 2.5.2 / 4.7 (all executable code ships in the binary; it is not a thin wrapper around a website).

## 1. Prerequisites (Mac only)

- macOS with **Xcode 16 or newer** (App Store submissions require a current SDK).
- **Node 20+** (`npm install` in the repo root).
- An **Apple Developer Program** membership ($99/yr) with Account Holder or Admin/App Manager role.
- Xcode signed in to that Apple ID: *Xcode → Settings → Accounts*.

CocoaPods is **not** required: the project uses Swift Package Manager (`ios/App/CapApp-SPM`).

## 2. Build and open the project

```
npm install
npm run ios:open        # builds ./www, syncs it into ios/App/App/public, opens Xcode
```

`npm run ios:sync` alone re-syncs after any change to the web code. `npm run ios:run` deploys to a connected device or simulator from the command line.

First time in Xcode:
1. Select the **App** target → *Signing & Capabilities* → tick *Automatically manage signing* and choose your Team.
2. Change the **Bundle Identifier** (`com.bitwars.microrts`) to one you own in your developer account (reverse-DNS of your domain). Keep `appId` in `capacitor.config.json` in sync so future `cap sync` calls don't fight you.
3. Add `App/PrivacyInfo.xcprivacy` to the App target if Xcode does not show it: right-click the *App* group → *Add Files to "App"…* → select `ios/App/App/PrivacyInfo.xcprivacy`, ensure "App" target is ticked. (It declares no tracking, no data collection, and the UserDefaults reason code used by Capacitor.)
4. Run on a real iPhone once (⌘R). Check: landscape only, status bar hidden, no rubber-band scrolling, haptics on long-press, backgrounding pauses the game, force-quit then relaunch offers **Resume battle**.

## 3. Versioning

- `MARKETING_VERSION` (1.0) and `CURRENT_PROJECT_VERSION` (build number) live in *App target → General*. Bump the build number for every upload; bump the marketing version for every store release.
- Keep `version` in `package.json` matching the marketing version; `www/version.json` is generated from it.

## 4. Archive and upload

1. In Xcode select *Any iOS Device (arm64)* as the run destination.
2. *Product → Archive*.
3. In the Organizer: *Distribute App → App Store Connect → Upload*. Accept the defaults (strip symbols, manage version and build number, automatic signing).
4. Wait for the "processing complete" email (5–30 min).

Alternative: export an `.ipa` from the Organizer and upload with the **Transporter** app.

## 5. App Store Connect listing

Create the app at https://appstoreconnect.apple.com → *My Apps → +*.

| Field | Suggested value |
|---|---|
| Name | Bit Wars: Micro RTS |
| Subtitle | Squad tactics, cover and morale |
| Primary category | Games → Strategy (secondary: Action) |
| Price | Paid tier of your choice (no in-app purchases exist) |
| Age rating | Fill the questionnaire: cartoon/fantasy violence "infrequent/mild" → typically 9+ |
| App Privacy | *Data Not Collected*. The app has no accounts, analytics, ads, or network calls. Settings and saves stay on-device in WKWebView local storage. |
| Export compliance | `ITSAppUsesNonExemptEncryption = NO` is already in `Info.plist` (HTTPS is not used), so no yearly export questions. |
| Copyright | Your name/company, year |
| Support URL / Privacy Policy URL | Required. A GitHub Pages page from this repo works; the privacy policy can be one paragraph stating no data is collected. |

**Screenshots** (required sizes, landscape since the app is landscape-only):
- iPhone 6.9" (1320 × 2868 or 2868 × 1320 landscape), at least 3.
- iPhone 6.5" (2688 × 1242 landscape) is auto-scaled from 6.9" if you don't upload it.
- iPad 13" (2752 × 2064 landscape) because `TARGETED_DEVICE_FAMILY` includes iPad. Remove iPad from the target if you don't want to support it.
The Simulator (⌘S) produces correctly-sized captures; `tools/screenshot.mjs` and `tools/gallery.mjs` generate marketing-style captures from the web build.

**Review notes** (paste into *Notes for Review*): "Bit Wars is a fully offline single-player strategy game. All game code is bundled in the app; no login, no network access, no in-app purchases. Play in landscape. Tap a squad icon at the top, then tap the ground to move or long-press to attack-move."

## 6. TestFlight first

Before submitting for review, add the build to TestFlight and install it on a few devices (internal testers need no review). Things to check on hardware: performance late-game on the oldest device you support (iOS 15 / iPhone 8 class is the current deployment target; raise `IPHONEOS_DEPLOYMENT_TARGET` if you only want newer devices), audio after silent-switch, battery.

## 7. Updating the game later

1. Edit the web code, run `npm test`, and check it in the browser (`npm start`).
2. `npm run ios:sync`, bump build number, *Product → Archive*, upload, submit.

Nothing native needs to change for gameplay updates. Native changes are only needed for new Capacitor plugins (`npm install @capacitor/<plugin>` then `npx cap sync ios`).

## 8. Things to decide before launch

- **Bundle ID / name**: reserve the App Store name early; it must be unique.
- **iPad**: supported in landscape today (the layout is responsive). Test it or drop it from the target.
- **Game Center / achievements / iCloud saves**: not included. Capacitor community plugins exist if you want them.
- **Localisation**: all strings are in `src/game/data.js`, `src/ui/menu.js`, `src/ui/hud.js`.
