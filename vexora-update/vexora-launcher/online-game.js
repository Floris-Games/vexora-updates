const {BrowserWindow}=require('electron');
const SILVER_ROAD_URL='https://silver-road-floris.lushflea128.chatgpt.site/game';
let gameWindow=null,loading=null;
function sameOrigin(url){try{return new URL(url).origin===new URL(SILVER_ROAD_URL).origin}catch{return false}}
async function playSilverRoad(){
 if(gameWindow&&!gameWindow.isDestroyed()){
  if(loading)await loading;
  if(gameWindow.isMinimized())gameWindow.restore();
  gameWindow.show();gameWindow.focus();return true;
 }
 const window=new BrowserWindow({width:1440,height:900,minWidth:900,minHeight:600,
  title:'Silver Road',show:false,autoHideMenuBar:true,backgroundColor:'#142c2a',
  webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
 gameWindow=window;
 window.on('closed',()=>{if(gameWindow===window){gameWindow=null;loading=null}});
 window.webContents.setWindowOpenHandler(({url})=>{
  // Keep game links in this window; never create the old second game window.
  if(sameOrigin(url))window.loadURL(url).catch(()=>{});
  return {action:'deny'};
 });
 window.webContents.on('will-navigate',(event,url)=>{if(!sameOrigin(url))event.preventDefault()});
 loading=window.loadURL(SILVER_ROAD_URL);
 try{await loading;if(window.isDestroyed())throw Error('Game window was closed');window.show();window.focus();return true}
 catch(error){if(!window.isDestroyed())window.destroy();throw Error('Silver Road could not connect. Check your internet connection and try Play again. '+error.message)}
 finally{if(gameWindow===window)loading=null}
}
module.exports={playSilverRoad};
