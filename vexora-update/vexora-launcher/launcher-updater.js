'use strict';
const fs=require('node:fs'),path=require('node:path');const security=require('./update-security');
module.exports=function({app,ipcMain,getWindow,isBusy,updater,fetchDescriptor=security.fetchDescriptor,keyPath=path.join(__dirname,'update-public-key.pem'),verifyFile=security.verifyFile}){
 let state={phase:'idle',currentVersion:app.getVersion(),message:'Ready to check for launcher updates.'};let active=false,timer,descriptor,installer;
 const send=patch=>{state={...state,...patch};const w=getWindow();if(w&&!w.isDestroyed())w.webContents.send('launcher:state',state);return {...state}};
 const fail=()=>send({phase:'error',message:'Launcher update could not complete or failed verification. Your current launcher is unchanged; try checking again.'});
 const supported=app.isPackaged&&process.platform==='win32';
 if(supported){updater=updater||require('electron-updater').autoUpdater;updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowPrerelease=false;updater.allowDowngrade=false;updater.disableWebInstaller=true;
  updater.on('error',fail);
  updater.on('download-progress',p=>send({phase:'downloading',message:'Downloading launcher update: '+Math.floor(p.percent)+'%'}));
  // Never expose the updater's downloaded event as approval: cached files also
  // must pass our pinned-key signature and actual-file hash verification below.
  updater.on('update-downloaded',()=>send({phase:'downloading',message:'Verifying launcher update...'}));
 }
 async function trusted(){if(!supported)throw Error('Launcher updates require an installed Windows release.');const cfg=await updater.configOnDisk.value;if(cfg.provider!=='github'||cfg.owner!=='Floris-Games'||cfg.repo!=='vexora-updates')throw Error('Secure updates are not configured.');const pem=fs.readFileSync(keyPath,'utf8');security.publicKey(pem);return pem}
 async function check(){if(active||['downloaded','installing'].includes(state.phase))return {...state};active=true;try{const pem=await trusted();descriptor=null;installer=null;send({phase:'checking',message:'Checking signed launcher releases...'});const d=security.verifyDescriptor(await fetchDescriptor(),pem);const result=await updater.checkForUpdates();if(!result)throw Error('Release check unavailable');security.verifyInfo(result.updateInfo,d);descriptor=d;const newer=d.version.split('.').map(Number),current=app.getVersion().split('.').map(Number);let available=false;for(let i=0;i<3;i++){if(newer[i]!==current[i]){available=newer[i]>current[i];break}}return send({phase:available?'available':'idle',message:available?'Launcher '+d.version+' is available. Update & Restart will download, verify and install it.':'Your launcher is up to date.'})}catch(e){descriptor=null;fail();throw e}finally{active=false}}
 async function update(){if(active)return {...state};if(!['available','downloaded'].includes(state.phase)||!descriptor)throw Error('Check for a launcher update first.');if(isBusy())throw Error('Close your games and let game downloads finish before updating Vexora.');active=true;try{await trusted();if(state.phase!=='downloaded'){send({phase:'downloading',message:'Downloading and verifying launcher update...'});const paths=await updater.downloadUpdate();if(!Array.isArray(paths)||paths.length!==1)throw Error('Expected one full installer');installer=paths[0];}await verifyFile(installer,descriptor);if(isBusy())return send({phase:'downloaded',message:'Update verified. Close games and click Update & Restart.'});
  // Verify again on every install attempt, including cached downloads. No quit
  // handler may install automatically, and unverified events never set ready.
  send({phase:'installing',message:'Installing launcher update and restarting...'});updater.quitAndInstall(false,true);return {...state};
 }catch(e){installer=null;fail();throw e}finally{active=false}}
 function guard(e){const w=getWindow();if(!w||e.sender!==w.webContents||e.senderFrame!==w.webContents.mainFrame)throw Error('Untrusted update request')}
 for(const [channel,fn] of [['status',()=>({...state})],['check',check],['update',update]])ipcMain.handle('launcher:'+channel,e=>{guard(e);return fn()});
 return {start(){if(!supported){send({phase:'disabled',message:'Launcher updates are available in installed Windows releases.'});return}timer=setTimeout(()=>check().catch(()=>{}),10000);timer.unref?.();app.on('before-quit',()=>clearTimeout(timer))},check,update,status:()=>({...state})};
};
