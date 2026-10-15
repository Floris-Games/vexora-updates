const {app,BrowserWindow}=require('electron');
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const output=path.join(__dirname,'verification');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',path.join(output,'test-user-data'));
app.on('browser-window-created',(_event,window)=>{
 window.webContents.on('did-finish-load',()=>fs.appendFileSync(path.join(output,'events.txt'),'loaded '+window.webContents.getURL()+'\n'));
 window.webContents.on('did-fail-load',(_e,code,description,url)=>fs.appendFileSync(path.join(output,'events.txt'),JSON.stringify({code,description,url})+'\n'));
 window.webContents.on('render-process-gone',(_e,details)=>fs.appendFileSync(path.join(output,'events.txt'),'renderer gone '+JSON.stringify(details)+'\n'));
});
const timeout=setTimeout(()=>{console.error('Smoke test timed out');app.exit(1)},60000);
require('./main');
app.whenReady().then(async()=>{
 try{
  const launcher=BrowserWindow.getAllWindows()[0];
  if(launcher.webContents.isLoading())await new Promise(resolve=>launcher.webContents.once('did-finish-load',resolve));
  await new Promise(resolve=>setTimeout(resolve,1000));
  const assets=await launcher.webContents.executeJavaScript(`Promise.all([...document.images].map(i=>i.decode().then(()=>({src:i.getAttribute('src'),width:i.naturalWidth}))))`);
  assert(assets.some(i=>i.src.includes('banner')&&i.width>0));assert(assets.some(i=>i.src.includes('library')&&i.width>0));
  fs.writeFileSync(path.join(output,'launcher.png'),(await launcher.webContents.capturePage()).toPNG());
  launcher.webContents.on('console-message',(_e,_level,message)=>fs.appendFileSync(path.join(output,'console.txt'),message+'\n'));
  const click=await launcher.webContents.executeJavaScript(`(()=>{const r=document.querySelector('#heroOpen').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);
  launcher.webContents.sendInputEvent({type:'mouseDown',...click,button:'left',clickCount:1});
  launcher.webContents.sendInputEvent({type:'mouseUp',...click,button:'left',clickCount:1});
  await new Promise(resolve=>setTimeout(resolve,700));
  const bannerResult=await launcher.webContents.executeJavaScript(`({libraryVisible:!document.getElementById('library').hidden,detailVisible:!document.getElementById('detail').hidden,name:document.getElementById('gameName').textContent})`);
  console.log('Banner click: '+JSON.stringify(bannerResult));
  assert(bannerResult.libraryVisible&&bannerResult.detailVisible&&bannerResult.name==='Silver Road');
  await launcher.webContents.executeJavaScript(`Promise.all([window.vexora.play('silver-road'),window.vexora.play('silver-road')])`);
  assert.equal(BrowserWindow.getAllWindows().length,2);
  const game=BrowserWindow.getAllWindows().find(w=>w!==launcher);assert(game.webContents.getURL().startsWith('https://silver-road-floris.lushflea128.chatgpt.site/'));
  fs.writeFileSync(path.join(output,'game-before.png'),(await game.webContents.capturePage()).toPNG());
  let frame;
  for(let attempt=0;attempt<40;attempt++){
   frame=game.webContents.mainFrame;
   try{if(frame&&await frame.executeJavaScript(`!!document.getElementById('multiPlayer')`))break}catch{}
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert(frame,'Hosted game iframe did not load');
  const gameState=await frame.executeJavaScript(`({online:location.protocol==='https:',api:document.documentElement.innerHTML.includes('/api/room'),entry:!!document.getElementById('multiPlayer'),fallback:[...document.querySelectorAll('a')].some(a=>a.textContent.includes('OPEN ONLINE GAME'))})`);
  assert(gameState.online&&gameState.api&&gameState.entry&&!gameState.fallback,JSON.stringify(gameState));
  await frame.executeJavaScript(`document.getElementById('multiPlayer').click()`);
  await new Promise(resolve=>setTimeout(resolve,500));
  fs.writeFileSync(path.join(output,'multiplayer.png'),(await game.webContents.capturePage()).toPNG());
  await launcher.webContents.executeJavaScript(`window.vexora.play('silver-road')`);assert.equal(BrowserWindow.getAllWindows().length,2);
  fs.writeFileSync(path.join(output,'electron-results.json'),JSON.stringify({artwork:assets,gameState,windows:2,duplicatePlay:'reused existing window'},null,2));
  console.log('PASS real Electron: artwork decoded, Play loads hosted game, multiplayer entry enabled, no fallback link, repeated Play creates no extra window.');
  clearTimeout(timeout);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timeout);app.exit(1)}
});
