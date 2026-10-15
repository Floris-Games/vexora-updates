const $=id=>document.getElementById(id);let games=[],selected=null,latest=null,working=false,update=false;
function msg(t){$('message').textContent=t}
function current(){return games.find(g=>g.id===selected)}
function view(name){document.querySelectorAll('.view').forEach(e=>e.hidden=e.id!==name);document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('pageTitle').textContent={discover:'Discover',library:'My Library',settings:'Settings',store:'Store',wishlist:'Wishlist',account:'My Profile'}[name]}
function card(g){const b=document.createElement('button');b.className='gamecard';const art=document.createElement('div');art.className='art';if(g.id==='silver-road'){const image=document.createElement('img');image.src='assets/silver-road-library.png';image.alt='Silver Road';art.append(image)}else art.textContent=g.name.split(' ').map(s=>s[0]).join('').slice(0,3);const title=document.createElement('h3');title.textContent=g.name;const tag=document.createElement('p');tag.textContent=g.tagline||'Vexora Games';const status=document.createElement('small');status.textContent=g.installed?'Installed · v'+g.installed.version:'Not installed';b.append(art,title,tag,status);b.onclick=()=>select(g.id);return b}
function grids(){$('discoverGrid').replaceChildren(...games.map(card));$('libraryGrid').replaceChildren(...games.map(card))}
function render(){const g=current();if(!g)return;$('detail').hidden=false;$('gameName').textContent=g.name;$('gameDescription').textContent=g.description||g.tagline||'';$('version').textContent=g.installed?'Installed v'+g.installed.version:'Not installed';const b=$('action');b.disabled=working;b.textContent=working?'INSTALLING...':update?(g.installed?'UPDATE GAME':'INSTALL GAME'):(g.installed?'▶ PLAY GAME':'CHECK FOR UPDATES');grids()}
async function select(id){selected=id;latest=null;update=false;view('library');render();$('detail').scrollIntoView({block:'start',behavior:'instant'});await check()}
async function check(){if(!selected||working)return;const id=selected;msg('Checking for updates...');try{const r=await window.vexora.check(id);if(selected!==id)return;latest=r.manifest;current().installed=r.installed;update=r.updateAvailable;$('newsTitle').textContent=latest.title||'Latest update';$('newsNotes').textContent=latest.notes||'No patch notes provided.';msg(update?'Version '+latest.version+' available.':'Game is up to date.');$('connection').textContent=update?'Update available':'Up to date'}catch(e){if(selected!==id)return;latest=null;update=false;$('connection').textContent='Offline / unavailable';msg('Update check unavailable: '+e.message+'. You can still play installed games.')}render()}
async function action(){if(!selected||working)return;const id=selected,g=current();if(update&&latest){working=true;$('progresswrap').hidden=false;$('bar').style.width='0%';render();try{g.installed=await window.vexora.install(id);update=false;msg('Installed '+g.name+' successfully!')}catch(e){msg('Installation failed: '+e.message)}finally{working=false;render()}}else if(g.installed){try{await window.vexora.play(id);msg('Starting '+g.name+'...')}catch(e){msg('Launch failed: '+e.message)}}else await check()}
window.vexora.onProgress(p=>{if(p.error){msg('Launch failed: '+p.error);return}if(p.id!==selected)return;$('bar').style.width=p.percent+'%';$('progresslabel').textContent=p.message+' '+p.percent+'%'});
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>view(b.dataset.view));$('heroOpen').onclick=async()=>{try{if(!games.length)games=await window.vexora.catalog();const featured=games.find(g=>g.id==='silver-road')||games[0];if(!featured)throw Error('Game catalog is unavailable');await select(featured.id)}catch(e){msg('Could not open game: '+e.message)}};$('action').onclick=action;$('check').onclick=check;$('folder').onclick=()=>selected&&window.vexora.openFolder(selected);
(async()=>{try{games=await window.vexora.catalog();if(games.length){$('heroName').textContent=games[0].name.toUpperCase();$('heroDescription').textContent=games[0].description||games[0].tagline;grids()}}catch(e){msg(e.message)}})();// Real email/password authentication, with email codes for sign-up and recovery only.
$('profileButton').onclick=()=>view('account');
$('storeLibrary').onclick=()=>view('library');
$('search').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.gamecard').forEach(c=>c.hidden=!c.textContent.toLowerCase().includes(q))});
let authMode='login',resetVerified=false;
function authUI(mode){authMode=mode;resetVerified=false;$('signedIn').hidden=true;$('authForm').hidden=false;$('usernameField').hidden=mode!=='register';$('passwordField').hidden=mode==='verifySignup'||mode==='verifyReset';$('codeField').hidden=!['verifySignup','verifyReset'].includes(mode);$('forgotButton').hidden=mode!=='login';$('backButton').hidden=mode==='login'||mode==='register';$('loginTab').classList.toggle('active',mode==='login');$('registerTab').classList.toggle('active',mode==='register');$('authSubmit').textContent=({login:'Log in',register:'Create account',verifySignup:'Verify email',reset:'Send reset code',verifyReset:'Verify reset code',newPassword:'Change password'})[mode];$('passwordField').hidden=['verifySignup','verifyReset','reset'].includes(mode);$('password').autocomplete=mode==='newPassword'?'new-password':'current-password';$('codeField').hidden=!['verifySignup','verifyReset'].includes(mode);$('authMessage').textContent='';}
function signedIn(user){if(!user)return authUI('login');$('authForm').hidden=true;$('signedIn').hidden=false;$('accountName').textContent=user.username||'Vexora Player';$('accountEmail').textContent=user.email;$('profileButton').textContent=(user.username||user.email||'V').slice(0,1).toUpperCase()}
$('loginTab').onclick=()=>authUI('login');$('registerTab').onclick=()=>authUI('register');$('forgotButton').onclick=()=>authUI('reset');$('backButton').onclick=()=>authUI('login');
$('logoutButton').onclick=async()=>{await window.vexora.auth.logout();$('profileButton').textContent='V';authUI('login')};
$('authSubmit').onclick=async()=>{const button=$('authSubmit');button.disabled=true;const args={email:$('email').value.trim(),password:$('password').value,username:$('username').value.trim(),code:$('authCode').value.trim()};try{let message='';switch(authMode){case 'register':message=await window.vexora.auth.signUp(args);authUI('verifySignup');break;case 'verifySignup':{const r=await window.vexora.auth.verifySignup(args);message=r.message;if(r.user)signedIn(r.user);else authUI('login');break}case 'login':signedIn(await window.vexora.auth.login(args));message='Logged in.';break;case 'reset':message=await window.vexora.auth.requestReset(args);authUI('verifyReset');break;case 'verifyReset':message=await window.vexora.auth.verifyReset(args);authUI('newPassword');break;case 'newPassword':message=await window.vexora.auth.setPassword(args);authUI('login');break;}$('authMessage').textContent=message}catch(e){$('authMessage').textContent=e.message||'Request failed'}finally{button.disabled=false}};
window.vexora.auth.status().then(s=>{if(s.user)signedIn(s.user);else $('authMessage').textContent=s.configured?'Sign in or create your Vexora account.':'Account service not connected. See SETUP-ACCOUNTS.txt.'}).catch(()=>{});



function launcherState(s){
 const button=$('launcherCheck'),status=$('launcherStatus');
 $('launcherVersion').textContent='Launcher v'+s.currentVersion;
 status.textContent=s.message;
 const busy=['checking','downloading','installing'].includes(s.phase);
 const upToDate=s.phase==='idle'&&s.message==='Your launcher is up to date.';
 button.classList.toggle('upToDate',upToDate);
 button.classList.toggle('spinning',s.phase==='checking');
 button.classList.toggle('hasUpdate',['available','downloaded'].includes(s.phase));
 button.classList.toggle('updateError',s.phase==='error');
 const label=upToDate?'Launcher is up to date. Check again':s.message+' Click to check launcher updates.';
 button.title=label;button.setAttribute('aria-label',label);button.disabled=busy||s.phase==='disabled';
 status.classList.toggle('visuallyHidden',!['error','downloading','installing','downloaded'].includes(s.phase));
 $('launcherUpdate').hidden=!['available','downloaded'].includes(s.phase);$('launcherUpdate').disabled=false;
}
window.vexora.onLauncherUpdate(launcherState);
window.vexora.launcherStatus().then(launcherState).catch(()=>{});
$('launcherCheck').onclick=()=>window.vexora.launcherCheck().then(launcherState).catch(()=>{});
$('launcherUpdate').onclick=async()=>{ $('launcherUpdate').disabled=true;try{launcherState(await window.vexora.launcherUpdate())}catch(e){$('launcherStatus').textContent=e.message;$('launcherStatus').classList.remove('visuallyHidden');$('launcherUpdate').disabled=false;}};
