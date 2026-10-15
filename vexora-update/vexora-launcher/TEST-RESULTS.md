# Verification results — free-key release 1.2.1

- Eleven automated tests passed using real Ed25519 signatures and real temporary
  installer bytes. Covered missing/wrong/tampered signatures, metadata mismatch,
  web-package rejection, corrupt installer, cached-file tampering, busy games,
  concurrent clicks, offline check, untrusted IPC frames, and release signer
  key matching.
- Electron 44.7.2 smoke passed: renderer/preload, launcher status/control,
  existing game catalog, auth status IPC and isolated userData marker.
- Windows x64 NSIS 1.2.1 build succeeded.
- The actual 116 MB installer was signed locally using the project's private
  update key. The resulting descriptor signature, actual installer hash and
  latest.yml fields were verified together.
- Packaged app.asar contains the expected public key and no private PEM key.
- Workflow YAML parsed successfully. No dependency versions changed from the
  previous audit (runtime: zero findings; build/dev: eight moderate findings).
- No release was published and no installer was run on the user's installation.

Remaining: add VEXORA_UPDATE_PRIVATE_KEY to GitHub repository Actions secrets,
merge the source changes, run the GitHub workflow, and perform a real two-version
1.2.1 -> 1.2.2 install/relaunch acceptance test in a disposable Windows account
including login, game files and save data. Network-level interrupted-download
integration, real multiplayer and real account persistence were not retested.

Reproduce: npm ci; node node_modules/electron/install.js; npm test;
node node_modules/electron/cli.js smoke-launcher-update.cjs;
npm run dist -- --publish never.

For local release signing use npm run release with VEXORA_UPDATE_PRIVATE_KEY
supplied securely in the environment. Never print or commit its value.
