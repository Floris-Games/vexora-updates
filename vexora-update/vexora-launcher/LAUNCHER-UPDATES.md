# Vexora launcher updates — free signing-key setup (1.2.1)

This replaces the certificate-based instructions from 1.2.0. No paid Windows
certificate is required for this setup. Windows may display an unknown-publisher
warning during first installation; update signatures do not establish Windows
publisher reputation.

## Your next step

A persistent Ed25519 key pair has been generated on this computer:
- PRIVATE: ../../.vexora-keys/update-private-key.pem (relative to this source).
- PUBLIC: update-public-key.pem (safe to commit and distribute).

Back up the private file securely. Do not paste it into chat, upload it as a
repository file, attach it to a release, or regenerate it for each version.
The source ZIP contains the public key ONLY. The private file is intentionally
outside the source directory and excluded by .gitignore.

On GitHub, open Floris-Games/vexora-updates -> Settings -> Secrets and variables
-> Actions -> New repository secret. Name it VEXORA_UPDATE_PRIVATE_KEY. Open
the private PEM file locally, copy the entire contents including BEGIN/END
lines, paste into the Secret field, and save. Do not share a screenshot of the
secret value. This is the ONLY required user-created secret for this workflow.
The workflow uses GitHub's temporary built-in token to create draft releases.

Under Settings -> Environments, create launcher-release if needed. Repository
secrets are available to its job. Optional environment approvals can protect
release builds. Run only trusted source: any release workflow that can access
the secret can sign updates. Keep the GitHub account protected.

## First release

Commit the updated source, public key and .github/workflows/vexora-release.yml.
Do not use the old certificate workflow. Actions -> Build Vexora release with
update key -> Run workflow. It builds 1.2.1 and uploads FOUR assets to a DRAFT:
VexoraSetup-1.2.1.exe, its .blockmap, latest.yml and vexora-update.json.
Inspect/test the installer before publishing the draft as a stable release.
The workflow refuses to replace artifacts in an already published version.
No certificate secrets or personal GitHub release token are required when
building in Floris-Games/vexora-updates itself. Do not fork this release workflow
and expect it to publish to the original repository.

Existing 1.1.2 users must manually install the new key-enabled launcher once.
The old certificate-based 1.2.0 build also needs this manual transition because
it will reject unsigned Windows installers. Install over the existing Vexora,
using the same Windows account and installer scope. Later versions use the same
private key. Never publish an update signed by a different key without an
explicit key-transition design for already-installed launchers.

## What is authenticated

sign-release.cjs hashes the FULL installer and signs a descriptor containing app
identity, exact version, filename, byte size and SHA-512 with Ed25519. The packaged
public key verifies that signed descriptor. Before offering an update Vexora
requires electron-updater's GitHub release information to match it exactly.
After download, Vexora independently hashes the actual installer, including
files reused from updater cache, before allowing quitAndInstall. It checks the
cached installer again on a deferred install attempt. A downloaded event alone
never authorizes installation. Prereleases, downgrades, web installers and
installation on ordinary quit are disabled.

This uses a Vexora-specific detached signature with stable electron-updater
6.8.9; it does NOT rely on the unreleased v27 signed-manifest feature. Windows
Authenticode verification is replaced by this explicit pinned-key gate, not
simply turned off without replacement. Authenticode identity and update
signature authentication are different guarantees.

The descriptor is fetched from the fixed public GitHub latest-release URL over
HTTPS with timeouts and a size bound. An absent/bad signature, feed mismatch,
metadata mismatch, network failure or corrupt installer leaves the old launcher
usable. Publishing the descriptor and all other files together in a draft avoids
partially visible releases. A server attacker without the private key cannot
forge installers. They may deny service or replay an older signed release;
version checks prevent downgrading an installed version. Protect the local
machine too: local malware able to modify Vexora or its running process is outside
this update mechanism's security boundary.

## Data and games

Package name vexora-launcher, appId com.vexora.launcher, productName Vexora and
NSIS scope remain stable. Login code, Silver Road online play and the existing
game updater are unchanged. User data, encrypted auth-session.bin, installed
metadata and downloaded games remain in the existing userData directory
(%APPDATA%/vexora-launcher by default). There is no migration or deletion.
The updater blocks restart while an in-app game window or game installation is
active. Close externally launched native games manually.

## Local commands (Node 22 LTS, Windows x64)

npm ci
node node_modules/electron/install.js
npm test
npm start
npm run dist -- --publish never

The dist command builds a local installer but does not sign a release descriptor.
For a release, supply VEXORA_UPDATE_PRIVATE_KEY securely in the environment and
run npm run release. It validates the private/public key pair, builds without
publishing, then signs the installer descriptor. Never put a private key on the
command line. CI is preferred so it is supplied through a masked secret.

npm run setup-update-key creates keys only when neither key exists; otherwise
it retains the existing key or fails rather than replacing an installed trust
key. The currently supplied public key already belongs to this project's local
private key: restore that private key from backup on other computers.

## Acceptance before players use Update & Restart

1. In a disposable Windows VM/account, install key-enabled 1.2.1. Log in, install
   a game, create a save marker and record installed-game file hashes.
2. Build/publish 1.2.2 using the SAME key and all four assets.
3. Update & Restart; verify the new version, login, game hashes, metadata, saves
   and Silver Road online play.
4. Check offline behavior, interrupted downloads, wrong-key signatures,
   modified metadata and installer corruption. No rejected installer may run.
5. Open Silver Road or start a game install during download; installation must
   wait until those operations finish and the player clicks again.

See TEST-RESULTS.md for actual test coverage and remaining acceptance work.
