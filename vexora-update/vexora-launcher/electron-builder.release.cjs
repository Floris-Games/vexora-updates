const base=require('./package.json').build;
if(!process.env.VEXORA_PUBLISHER)throw Error('Set VEXORA_PUBLISHER to the exact certificate subject.');
module.exports={...base,forceCodeSigning:true,win:{...base.win,publisherName:process.env.VEXORA_PUBLISHER}};
