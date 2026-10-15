'use strict';
// The feed and publisher come only from packaged app-update.yml, never renderer input.
module.exports=function({app,ipcMain,getWindow,isBusy,updater}) {
 let state={phase:'idle',currentVersion:app.getVersion(),message:'Ready to check for launcher updates.'};
 let active=false,timer;
 const send=patch=>{state={...state,...patch};const w=getWindow();if(w&&!w.isDestroyed())w.webContents.send('launcher:state',state);return {...state}};
 const fail=()=>send({phase:'error',message:'Launcher update failed verification or could not complete. Check your connection and try again.'});
 const supported=app.isPackaged&&process.platform==='win32';
 if(supported){
  updater=updater||require('electron-updater').autoUpdater;
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowPrerelease=false;updater.allowDowngrade=false;
  // Fail closed: unsigned development builds must never accept launcher installers.
  updater.on('error',fail);
  updater.on('update-available',i=>send({phase:'available',version:i.version,message:'Launcher '+i.version+' is available. Update & Restart will download, verify and install it.'}));
  updater.on('update-not-available',()=>send({phase:'idle',message:'Your launcher is up to date.'}));
  updater.on('download-progress',p=>send({phase:'downloading',message:'Downloading launcher update: '+Math.floor(p.percent)+'%'}));
  updater.on('update-downloaded',()=>send({phase:'downloaded',message:'Update verified. Close games and click Update & Restart to finish.'}));
 }
 async function trusted(){
  if(!supported)throw Error('Launcher updates require an installed Windows release.');
  const cfg=await updater.configOnDisk.value;
  if(cfg.provider!=='github'||cfg.owner!=='Floris-Games'||cfg.repo!=='vexora-updates'||!(Array.isArray(cfg.publisherName)?cfg.publisherName.length:cfg.publisherName))throw Error('Secure updates are not configured. Install an official signed Vexora release.');
 }
 async function check(){if(active||['downloaded','installing'].includes(state.phase))return {...state};active=true;try{await trusted();send({phase:'checking',message:'Checking launcher releases...'});await updater.checkForUpdates();return {...state}}catch(e){fail();throw e}finally{active=false}}
 async function update(){if(active)return {...state};if(!['available','downloaded'].includes(state.phase))throw Error('Check for a launcher update first.');if(isBusy())throw Error('Close your games and let game downloads finish before updating Vexora.');active=true;try{await trusted();if(state.phase!=='downloaded'){send({phase:'downloading',message:'Downloading and verifying launcher update...'});await updater.downloadUpdate();if(state.phase!=='downloaded')throw Error('Update verification did not complete.');}if(isBusy())return send({phase:'downloaded',message:'Update verified. Close games and click Update & Restart.'});send({phase:'installing',message:'Installing launcher update and restarting...'});setImmediate(()=>{try{updater.quitAndInstall(false,true)}catch{fail()}});return {...state}}catch(e){fail();throw e}finally{active=false}}
 function guard(e){const w=getWindow();if(!w||e.sender!==w.webContents||e.senderFrame!==w.webContents.mainFrame)throw Error('Untrusted update request');}
 for(const [channel,fn] of [['status',()=>({...state})],['check',check],['update',update]])ipcMain.handle('launcher:'+channel,(e)=>{guard(e);return fn()});
 return {start(){if(!supported){send({phase:'disabled',message:'Launcher updates are available in installed Windows releases.'});return;}timer=setTimeout(()=>check().catch(()=>{}),10000);timer.unref?.();app.on('before-quit',()=>clearTimeout(timer));},check,update,status:()=>({...state})};
};
