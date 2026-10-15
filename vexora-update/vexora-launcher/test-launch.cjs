const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {EventEmitter}=require('node:events');
async function run(){
 const windows=[];let fail=false,release;
 class Window extends EventEmitter{
  constructor(options){super();this.options=options;this.dead=false;this.webContents=new EventEmitter();this.webContents.setWindowOpenHandler=h=>this.popup=h;windows.push(this)}
  loadURL(url){this.url=url;return fail?Promise.reject(Error('offline')):new Promise(resolve=>{release=resolve})}
  isDestroyed(){return this.dead}isMinimized(){return !!this.minimized}restore(){this.minimized=false;this.restored=true}show(){this.visible=true}focus(){this.focused=true}
  destroy(){this.dead=true;this.emit('closed')}
 }
 const context={require:id=>{assert.equal(id,'electron');return {BrowserWindow:Window}},module:{exports:{}},URL};
 vm.runInNewContext(fs.readFileSync(__dirname+'/online-game.js','utf8'),context);
 const play=context.module.exports.playSilverRoad;
 const a=play(),b=play();assert.equal(windows.length,1);assert.equal(windows[0].options.show,false);release();await Promise.all([a,b]);
 const w=windows[0];assert.equal(w.url,'https://silver-road-floris.lushflea128.chatgpt.site/game');assert(w.visible);
 w.minimized=true;await play();assert.equal(windows.length,1);assert(w.restored);
 assert.equal(w.popup({url:'https://untrusted.example/'}).action,'deny');
 let prevented=false;w.webContents.emit('will-navigate',{preventDefault(){prevented=true}},'file:///local.html');assert(prevented);
 prevented=false;w.webContents.emit('will-navigate',{preventDefault(){prevented=true}},w.url);assert(!prevented);
 assert.equal(w.options.webPreferences.nodeIntegration,false);assert.equal(w.options.webPreferences.sandbox,true);
 w.destroy();fail=true;await assert.rejects(play(),/could not connect/);assert(windows[1].dead);
 fail=false;const retry=play();release();await retry;assert.equal(windows.length,3);windows[2].destroy();
 const handlers={},config=require('./config.json');let meta=null,onlineCalls=0,localCalls=0,spawnCalls=0;
 const auth=new Proxy({},{get:()=>()=>{}});
 const fakeFS={promises:{readFile:async()=>{if(!meta)throw Error('missing');return JSON.stringify(meta)},access:async()=>{}}};
 const mainContext={require:id=>({
  './auth':auth,'./online-game':{playSilverRoad:async()=>{onlineCalls++;return true}},
  electron:{app:{getPath:()=>'/userdata',whenReady:()=>({then:()=>{}}),on:()=>{}},BrowserWindow:class{constructor(){localCalls++}async loadFile(){}},ipcMain:{handle:(name,fn)=>handlers[name]=fn},shell:{}},
  path:require('path'),fs:fakeFS,https:{},crypto:{},child_process:{spawn:()=>{spawnCalls++;return {on(){},unref(){}}}},'adm-zip':class{},'./config.json':config
 }[id]),__dirname,module:{exports:{}},process};
 vm.runInNewContext(fs.readFileSync(__dirname+'/main.js','utf8'),mainContext);
 await handlers.play(null,'silver-road');meta={version:'9.0.0',executable:'silver-road.html'};await handlers.play(null,'silver-road');meta.executable='silver-road.exe';await handlers.play(null,'silver-road');
 assert.equal(onlineCalls,3);assert.equal(localCalls,0);assert.equal(spawnCalls,0);
 await assert.rejects(handlers.play(null,'unknown'),/Unknown game/);
 config.games.push({id:'other',name:'Other'});meta.executable='other.html';await handlers.play(null,'other');meta.executable='other.exe';await handlers.play(null,'other');assert.equal(localCalls,1);assert.equal(spawnCalls,1);config.games.pop();
 for(const name of ['install','check','catalog','auth:login','auth:verifySignup','auth:requestReset','auth:status'])assert.equal(typeof handlers[name],'function');
 for(const file of ['silver-road-banner.png','silver-road-library.png'])assert(fs.existsSync(__dirname+'/assets/'+file));
 const pkg=require('./package.json');assert(pkg.build.files.includes('assets/**/*'));assert(pkg.build.files.includes('online-game.js'));
 console.log('PASS: concurrent Play, reuse/restore, close/reopen, failed load/retry, navigation and popup limits, bundled/installed Silver Road, other HTML/EXE games, auth/update handlers, packaged artwork.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
