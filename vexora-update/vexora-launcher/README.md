# Vexora Launcher 1.0

A multi-game Windows launcher built with Electron. Silver Road is the first catalog entry.

## One-click builds
- `OPEN-LAUNCHER.bat` opens development launcher.
- `BUILD-WINDOWS.bat` builds portable `dist\win-unpacked\Vexora.exe`. Keep the entire folder together.
- `BUILD-SETUP.bat` creates `dist\VexoraSetup-1.0.0.exe` with desktop and Start menu shortcuts.
- Requires Node.js and internet on the **developer's** computer only. Players do not need Node.js.

## Publish a game
1. Package the Windows game with its EXE at the ZIP root.
2. Upload ZIP to a GitHub Release or HTTPS hosting.
3. Calculate ZIP SHA-256 using `certutil -hashfile YourGame.zip SHA256` on Windows.
4. Copy `manifest.example.json` and fill in `version`, `downloadUrl`, `sha256`, `executable`, `title`, `notes`. Host manifest at a stable HTTPS URL.
5. Set `manifestUrl` for that game in `config.json`. Rebuild the launcher and distribute it. Future **game** versions only need a new ZIP and updated manifest; players press Update.

## Add another game
In `config.json`, add another object to `games` with a unique lowercase hyphenated `id`, a `name`, `tagline`, `description`, and an HTTPS `manifestUrl`. Rebuild the launcher to publish a new catalog. Each game has separate version metadata, folder, and update button.

## Important limitations
- No game binary or live update server is included. Update/install buttons will not work until you configure a real manifest.
- The launcher does not update itself; adding games to its bundled catalog requires distributing a new launcher version.
- Windows unsigned installer/EXE may show SmartScreen warnings.
- Do not upload secrets to config.json.
- Before public distribution, test installs, updates, rollback on failure, multiplayer and antivirus behavior on Windows.
- Only publish game archives you trust. The SHA-256 hash checks integrity against the manifest but does not authenticate the manifest publisher.

Launcher self-updates (1.2.0): see LAUNCHER-UPDATES.md for signed GitHub releases, build instructions and upgrade acceptance checks.
