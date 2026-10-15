# Vexora 1.2.0 launcher updates

Source: vexora-update/vexora-launcher. No files under sources/ were changed.

## Build and run

Use Node 22 LTS and Windows x64. Run `npm ci`, then `npm start` for development,
`npm test` for the update controller tests, or `npm run dist` for an unsigned local
NSIS installer. If npm blocks Electron's install script, allow the trusted Electron
package's install script and run `node node_modules/electron/install.js`.
Unsigned development builds deliberately cannot self-update. Never distribute
those as the official release. `npm run portable` produces an unpacked testing
folder, not a supported self-update installation.

## Secure official release

The public release feed is Floris-Games/vexora-updates on GitHub, the existing
updates repository. Confirm you control it before the first release. Keep that
feed, package name vexora-launcher, productName Vexora, appId com.vexora.launcher,
and installer scope stable for every release.

Obtain a trusted Windows Authenticode signing certificate. Configure:
- VEXORA_PUBLISHER: exact signing certificate subject / publisher common name.
- CSC_LINK: secure PFX location or base64 PFX (CI secret).
- CSC_KEY_PASSWORD: certificate password (CI secret).
- GH_TOKEN: a token with release-writing permission on Floris-Games/vexora-updates.

Run `npm run release`. The separate release config requires code signing and
embeds the expected publisher into app-update.yml. It creates a DRAFT release;
inspect its installer, latest.yml and .exe.blockmap before publishing the draft.
Do not upload only the installer. Do not edit checksums manually. Build all
artifacts together from the committed lockfile. Use a higher package version
for each release. Never replace an already published version's binaries.

The workspace-level .github/workflows/vexora-release.yml provides a manual
Windows build. It expects this workspace's directory layout. If moving just the
launcher to the repository root, update working-directory, cache and artifact
paths. Set environment launcher-release with protected approvals, the
VEXORA_PUBLISHER variable, CSC_LINK/CSC_KEY_PASSWORD secrets, and a
VEXORA_RELEASE_TOKEN secret scoped to the release repository. GITHUB_TOKEN
cannot publish to a different repository. Signing secrets belong only in CI,
never in the app, config.json, or source archives. No token is needed by players
because release downloads are public.

## Player experience and verification

An installed signed launcher checks 10 seconds after opening; the visible
Check launcher updates button also retries at any time. A newer stable version
shows Update & Restart. Clicking downloads via electron-updater, verifies its
SHA-512 checksum against GitHub's HTTPS metadata, and checks its Authenticode
signature against the embedded publisher. Only then does NSIS install and
relaunch. Downgrades, prereleases and automatic installation on ordinary quit
are disabled. Offline failures leave the current launcher usable. A successful
cached download can be reused on retry. Close game windows and let game installs
finish before updating. If a game starts during download, the verified update
waits for another click. Externally launched native games must be closed manually.

The update IPC is accepted only from the launcher's main frame. Renderer input
cannot choose a feed, URL, publisher or installer file. An unsigned/missing-feed
build fails closed. GitHub metadata checksums detect corruption; the pinned
publisher signature supplies installer authenticity. Protect repository access
and signing keys. No custom installer downloads or shell execution were added.

## Preserved data and first upgrade

Login code and game-manifest update behavior remain intact. auth-session.bin,
installed.json, downloaded Silver Road and Chromium local storage continue to
use the SAME Electron userData path (%APPDATA%/vexora-launcher by default).
There is no data migration or cleanup during launcher updates. NSIS
explicitly preserves app data on uninstall. Keep the same Windows user,
application identity and installer scope. Back up userData before acceptance
checks. Online Silver Road continues to load its existing hosted game.

Existing 1.1.2 launchers have no self-updater. Players must manually install the
first signed 1.2.0 installer over their existing installation once. Subsequent
signed releases support Update & Restart.

## Acceptance before public distribution

1. Install signed 1.2.0 on a disposable Windows account/VM, log in, install a
   game, and record hashes of installed game files and a local save marker.
2. Publish signed 1.2.1 to the same public release repository with all artifacts.
3. Check, Update & Restart, confirm the process version is 1.2.1, login remains,
   game hashes/installed metadata/save marker remain and Silver Road launches.
4. Repeat offline, interrupted download, wrong publisher and corrupted download;
   the old launcher must remain runnable and unverified installers must not run.
5. Test with Silver Road open and a game installation in progress; restart must
   be blocked. Test ordinary quit after download does not silently install.

Automated controller tests use injected updater events; they do not prove
real Windows signature verification or installation. Real two-version acceptance
requires your certificate and published releases. These have not been provided.
See TEST-RESULTS.md for what was actually run.

Tooling reference: https://www.electron.build/auto-update
