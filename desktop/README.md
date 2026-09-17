# Bit Wars desktop shell

Electron wrapper that turns the same web build used by the PWA and the iOS app into a desktop game for macOS,
Windows and Linux, with a dormant Steamworks bridge for a later Steam release.

## Run in development

    cd desktop
    npm install
    npm start                # syncs ../www into ./app and launches Electron
    BITWARS_DEV=1 npm start  # adds Reload and DevTools to the View menu

## Build installers

    npm run dist:mac      # universal .dmg and .zip in desktop/dist (run on a Mac)
    npm run dist:win      # NSIS installer and .zip (run on Windows, or on a Mac with Wine)
    npm run dist:linux    # AppImage and tar.gz

### macOS signing and notarisation

A dmg or zip handed out directly, and a build uploaded to Steam, must be signed with a **Developer ID
Application** certificate. An "Apple Distribution" certificate is for Mac App Store submissions only and will not
pass Gatekeeper or notarisation for direct distribution. Create the Developer ID certificate in the Apple Developer
portal (account holder role) and add it to the login keychain; electron-builder then selects it automatically.

    security find-identity -v -p codesigning      # list the identities codesign can see

- "ambiguous (matches ... login.keychain-db and ... System.keychain)": the same certificate is installed twice.
  Delete one copy in Keychain Access, or pick one by hash: `CSC_NAME=<sha1-hash> npm run dist:mac`.
- Notarisation: set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID`; electron-builder uploads and
  staples the ticket after signing.
- Unsigned build for local testing only: `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac`.
- CI without a keychain: `CSC_LINK` (base64 .p12) and `CSC_KEY_PASSWORD`.

## Saves

The game keeps its state in `localStorage` keys prefixed `bw_`. The preload script restores them at launch from
`<userData>/saves/bitwars.json` and writes that file every few seconds and on exit. `userData` is
`~/Library/Application Support/Bit Wars` on macOS, `%APPDATA%\Bit Wars` on Windows and `~/.config/Bit Wars` on Linux.
For Steam Cloud, add that `saves` folder as an auto-cloud path per platform in the Steamworks app settings.

## Steam

1. `npm install steamworks.js` inside `desktop/` (it is a native module and is unpacked from the asar automatically).
2. For local testing put the app id in `desktop/steam_appid.txt` (git-ignored) or set `STEAM_APP_ID`. Do not ship
   that file in the depot: Steam supplies the id when it launches the game.
3. Achievements: the game calls `window.desktop.achievement('chapter_<key>')` when a campaign chapter is won, so
   define achievements with API names such as `chapter_blue-1` in Steamworks, or map them in `steam.cjs`.
4. Upload the unpacked build from `dist/<platform>-unpacked` with the SteamPipe ContentBuilder.

Without steamworks.js or an app id every Steam call is a no-op, so the direct-download build is the same code.
