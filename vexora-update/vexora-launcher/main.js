const auth=require('./auth');
const {playSilverRoad}=require('./online-game');
const {app,BrowserWindow,ipcMain,shell}=require('electron');
const path=require('path'),fs=require('fs'),fsp=fs.promises,https=require('https'),crypto=require('crypto');
const {spawn}=require('child_process'),AdmZip=require('adm-zip');
const {games}=require('./config.json');
const bundledSilverRoad=path.join(__dirname,'games','silver-road.html');
let win;const busy=new Set();
if(!app.requestSingleInstanceLock()){app.exit(0);}else{
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.show();win.focus();}});
}
const launcherUpdates=require('./launcher-updater')({app,ipcMain,getWindow:()=>win,isBusy:()=>busy.size>0||BrowserWindow.getAllWindows().some(w=>w!==win)});
function game(id){if(typeof id!=='string')throw Error('Invalid game');const g=games.find(g=>g.id===id);if(!g||!/^[a-z0-9-]+$/.test(g.id))throw Error('Unknown game');return g;}
const base=id=>path.join(app.getPath('userData'),'games',game(id).id);
const root=id=>path.join(base(id),'current');
const metadata=id=>path.join(base(id),'installed.json');
const notify=(id,p)=>win?.webContents.send('progress',{id,...p});
function request(url,dest,progress,hops=0){return new Promise((resolve,reject)=>{
 if(hops>5)return reject(Error('Too many redirects'));
 let u;try{u=new URL(url)}catch{return reject(Error('Invalid URL'))};if(u.protocol!=='https:')return reject(Error('HTTPS required'));
 const req=https.get(u,{headers:{'User-Agent':'VexoraLauncher/1.0'}},res=>{
 if([301,302,303,307,308].includes(res.statusCode)){res.resume();if(!res.headers.location)return reject(Error('Missing redirect'));return resolve(request(new URL(res.headers.location,u).href,dest,progress,hops+1));}
 if(res.statusCode!==200){res.resume();return reject(Error('HTTP '+res.statusCode));}
 if(!dest){let chunks=[],size=0;res.on('data',c=>{size+=c.length;if(size>1024*1024){req.destroy(Error('Manifest too large'));return}chunks.push(c)});res.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));res.on('error',reject);return;}
 const file=fs.createWriteStream(dest);let total=Number(res.headers['content-length'])||0,done=0;
 res.on('data',c=>{done+=c.length;if(total)progress?.(Math.min(100,Math.round(done/total*100)))});
 res.on('error',reject);file.on('error',reject);file.on('finish',()=>file.close(()=>resolve(dest)));res.pipe(file);
 });req.on('error',reject);
 });}
function valid(m){if(!m||typeof m.version!=='string'||!/^\d+\.\d+\.\d+$/.test(m.version))throw Error('Invalid version');if(typeof m.downloadUrl!=='string'||!m.downloadUrl.startsWith('https://'))throw Error('Invalid download URL');if(typeof m.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(m.sha256))throw Error('Invalid SHA-256');if(typeof m.executable!=='string'||!/^[\w .()\-]+\.(exe|html)$/i.test(m.executable))throw Error('Invalid game entrypoint');return m;}
async function installed(id){try{return JSON.parse(await fsp.readFile(metadata(id),'utf8'))}catch{return null}}
function compare(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;}
ipcMain.handle('catalog',async()=>Promise.all(games.map(async g=>({id:g.id,name:g.name,tagline:g.tagline,description:g.description,configured:!g.manifestUrl.includes('YOUR-USERNAME'),installed:await installed(g.id)||(g.id==='silver-road'?{version:'1.0.0',bundled:true}:null)}))));
ipcMain.handle('check',async(_e,id)=>{const g=game(id);const old=await installed(id)||(id==='silver-road'?{version:'1.0.0',bundled:true}:null);if(g.manifestUrl.includes('YOUR-USERNAME'))throw Error('Set the manifest URL in config.json');const m=valid(JSON.parse(await request(g.manifestUrl)));return {manifest:m,installed:old,updateAvailable:!old||compare(m.version,old.version)>0};});
ipcMain.handle('install',async(_e,id)=>{const g=game(id);if(busy.has(id))throw Error('Game update already running');busy.add(id);const dir=base(id),archive=path.join(dir,'download.zip'),staging=path.join(dir,'staging'),backup=path.join(dir,'backup');try{
 const m=valid(JSON.parse(await request(g.manifestUrl)));
 await fsp.mkdir(dir,{recursive:true});await fsp.rm(staging,{recursive:true,force:true});await fsp.mkdir(staging,{recursive:true});
 notify(id,{percent:0,message:'Downloading...'});await request(m.downloadUrl,archive,p=>notify(id,{percent:p,message:'Downloading...'}));
 const digest=crypto.createHash('sha256');await new Promise((resolve,reject)=>{const stream=fs.createReadStream(archive);stream.on('data',c=>digest.update(c));stream.on('end',resolve);stream.on('error',reject)});
 if(digest.digest('hex').toLowerCase()!==m.sha256.toLowerCase())throw Error('Checksum mismatch');
 notify(id,{percent:100,message:'Installing...'});
 const zip=new AdmZip(archive);for(const e of zip.getEntries()){const name=e.entryName.replace(/\\/g,'/'),normalized=path.posix.normalize(name);if(name.startsWith('/')||normalized==='..'||normalized.startsWith('../')||/^[a-z]:/i.test(name)||name.includes(':'))throw Error('Unsafe ZIP path');const dest=path.resolve(staging,...normalized.split('/'));if(dest!==path.resolve(staging)&&!dest.startsWith(path.resolve(staging)+path.sep))throw Error('Unsafe ZIP entry');}
 zip.extractAllTo(staging,true);await fsp.access(path.join(staging,m.executable));
 await fsp.rm(backup,{recursive:true,force:true});let had=false;try{await fsp.rename(root(id),backup);had=true}catch(e){if(e.code!=='ENOENT')throw e}
 try{await fsp.rename(staging,root(id))}catch(e){if(had)await fsp.rename(backup,root(id));throw e}
 await fsp.writeFile(metadata(id),JSON.stringify({version:m.version,executable:m.executable},null,2));await fsp.rm(backup,{recursive:true,force:true});notify(id,{percent:100,message:'Ready to play'});return {version:m.version,executable:m.executable};
 }finally{busy.delete(id);await fsp.rm(archive,{force:true}).catch(()=>{});await fsp.rm(staging,{recursive:true,force:true}).catch(()=>{})}});
ipcMain.handle('play',async(_e,id)=>{game(id);if(id==='silver-road')return playSilverRoad();const meta=await installed(id);if(!meta||!/^[\w .()\-]+\.(exe|html)$/i.test(meta.executable))throw Error('Not installed');const entry=path.join(root(id),meta.executable);await fsp.access(entry);if(meta.executable.toLowerCase().endsWith('.html')){const gameWindow=new BrowserWindow({width:1440,height:900,minWidth:900,minHeight:600,autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});await gameWindow.loadFile(entry);return true;}const child=spawn(entry,[],{cwd:root(id),detached:true,stdio:'ignore'});child.on('error',e=>notify(id,{error:e.message}));child.unref();return true;});
ipcMain.handle('open-folder',async(_e,id)=>{const meta=await installed(id);if(id==='silver-road'&&!meta)return shell.showItemInFolder(bundledSilverRoad);await fsp.mkdir(base(id),{recursive:true});return shell.openPath(base(id))});
app.whenReady().then(()=>{win=new BrowserWindow({width:1200,height:760,minWidth:850,minHeight:600,backgroundColor:'#0c1019',webPreferences:{preload:path.join(__dirname,'preload.js'),nodeIntegration:false,contextIsolation:true,sandbox:true}});win.setMenuBarVisibility(false);win.loadFile(path.join(__dirname,'index.html'));launcherUpdates.start()});app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});

for(const method of ['signUp','verifySignup','login','requestReset','verifyReset','setPassword','logout'])ipcMain.handle('auth:'+method,(_event,args)=>auth[method](args||{}));
ipcMain.handle('auth:status',async()=>({configured:auth.configured(),user:auth.publicUser()||await auth.refresh()}));
app.whenReady().then(()=>auth.load());
