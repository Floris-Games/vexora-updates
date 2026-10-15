# Vexora 1.2.1

Vexora includes Silver Road, the existing game manifest updater and Supabase
login. Launcher updates use GitHub Releases plus a free, private Ed25519 signing
key and the pinned public key in this source. No paid certificate is required;
Windows may show an unknown-publisher warning on first installation.

Read LAUNCHER-UPDATES.md for the single required GitHub secret, release workflow,
key backup, first manual installation and upgrade acceptance checklist.

Node 22 LTS / Windows x64:

    npm ci
    node node_modules/electron/install.js
    npm test
    npm start

`npm run dist -- --publish never` builds a local test installer.
`npm run release` requires VEXORA_UPDATE_PRIVATE_KEY and builds the installer plus
signed release descriptor without publishing. The GitHub workflow creates a
DRAFT with all required assets; review before publishing.

Never commit private keys. Only update-public-key.pem belongs in source.
Keep the app identity and userData path stable to retain login and installed
games. See TEST-RESULTS.md for completed checks and limitations.
