// Authenticity is checked by update-security.js against the pinned Ed25519 key.
// This does not give the installer a Windows Authenticode publisher identity.
module.exports={...require('./package.json').build,forceCodeSigning:false};
