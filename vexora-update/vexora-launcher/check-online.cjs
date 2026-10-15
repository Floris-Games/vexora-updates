const assert=require('node:assert/strict');
const origin='https://silver-road-floris.lushflea128.chatgpt.site';
async function api(action,extra={}){
 const r=await fetch(origin+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...extra}),signal:AbortSignal.timeout(20000)});
 const data=await r.json();assert(r.ok,`${action}: ${r.status} ${data.error||''}`);return data;
}
(async()=>{
 const r=await fetch(origin,{signal:AbortSignal.timeout(20000)});let html=await r.text();assert(r.ok);if(html.includes('src="/game.html"')){const game=await fetch(origin+'/game.html');assert(game.ok);html=await game.text()}assert(html.includes('/api/room'));console.log('PASS hosted game loads with room API');
 let host,guest;
 try{
  host=await api('host',{name:'Vexora launch test',car:0,map:'city',weather:'day',time:'noon'});assert(host.code&&host.token);console.log('PASS room host');
  guest=await api('join',{code:host.code,name:'Vexora join test',car:1});assert(guest.token);console.log('PASS second player joins');
  const h=await api('sync',{code:host.code,token:host.token});
  await api('ready',{code:host.code,token:host.token,revision:h.revision,ready:true});
  const g=await api('sync',{code:host.code,token:guest.token});
  await api('ready',{code:host.code,token:guest.token,revision:g.revision,ready:true});
  const ready=await api('sync',{code:host.code,token:host.token});
  const match=await api('start',{code:host.code,token:host.token,revision:ready.revision});assert.equal(match.phase,'driving');console.log('PASS both players ready and host starts match');
 }finally{
  if(guest)await api('leave',{code:host.code,token:guest.token});
  if(host)await api('leave',{code:host.code,token:host.token});
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
