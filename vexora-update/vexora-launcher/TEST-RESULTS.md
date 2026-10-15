# Verification results — 2026-10-15

- Six update-controller tests passed on Windows: explicit download/restart,
  unsigned-feed rejection, verification failure/retry, game-busy guard,
  IPC sender/frame restriction and repeated-click protection.
- Electron 44.7.2 smoke test passed: renderer/preload loaded without errors,
  launcher status/control present, game catalog and auth status IPC available,
  isolated userData marker preserved. This did not log in to a real account.
- Windows x64 unpacked build and NSIS 1.2.0 installer build succeeded.
- Runtime npm audit: zero findings. Full audit: eight moderate findings in
  development/build dependencies; zero high or critical findings.
- Syntax checks passed for main.js and renderer.js.
- The generated local installer is UNSIGNED and for testing only; secure
  launcher downloads remain disabled without a configured publisher.
- Not performed: actual signed upgrade between two published versions,
  installer-level userData/login persistence verification, corrupt network
  artifact/signature integration tests, or live multiplayer regression.
  Follow LAUNCHER-UPDATES.md before public distribution.

Reproduce: npm ci; npm test; node node_modules/electron/cli.js smoke-launcher-update.cjs;
npm run dist -- --publish never. Smoke test uses verification/launcher-update-smoke
rather than the player's real userData.
