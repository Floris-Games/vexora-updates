const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
if(!process.env.VEXORA_UPDATE_PRIVATE_KEY)throw Error('Add VEXORA_UPDATE_PRIVATE_KEY in GitHub Actions secrets.');
const privateKey=crypto.createPrivateKey(process.env.VEXORA_UPDATE_PRIVATE_KEY),publicKey=crypto.createPublicKey(fs.readFileSync(path.join(__dirname,'update-public-key.pem')));
if(privateKey.asymmetricKeyType!=='ed25519'||crypto.createPublicKey(privateKey).export({type:'spki',format:'pem'})!==publicKey.export({type:'spki',format:'pem'}))throw Error('Update signing key does not match the pinned public key');
