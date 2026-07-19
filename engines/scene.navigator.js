(function(){
'use strict';

function navDiagEnabled(){try{return new URLSearchParams(location.search).get('prismDebug')==='1';}catch(e){return false;}}
function navDiag(message,data){
 if(!navDiagEnabled())return;
 console.log(`[PrismNavDiag] ${message}`,data??'');
 const panel=document.getElementById('prism-diagnostic-panel');
 if(panel){const stamp=new Date().toLocaleTimeString();panel.textContent+=`${stamp}  NAV: ${message}${data===undefined?'':` ${typeof data==='string'?data:JSON.stringify(data)}`}\n`;panel.scrollTop=panel.scrollHeight;}
}
function mergeScene(plugin, sceneId){
  const scene=(plugin.scenes||{})[sceneId];
  if(!scene) throw new Error(`Unknown scene: ${sceneId}`);
  return Object.assign({},plugin,scene,{id:plugin.id,folder:plugin.folder,title:scene.title||plugin.title,scenes:undefined,initialScene:undefined,__sceneId:sceneId,__sceneRoot:plugin});
}
class PrismSceneNavigator{
 constructor(ctx){this.ctx=ctx;this.plugin=ctx.plugin;this.host=ctx.host;this.history=[];this.current=null;this.instance=null;this.destroyed=false;}
 async mount(){const first=this.plugin.initialScene||Object.keys(this.plugin.scenes||{})[0];navDiag('Navigator mount',{plugin:this.plugin.id,first});if(!first)throw new Error('No initial scene');await this.go(first,{replace:true});return this;}
 async go(sceneId,opts){navDiag('go requested',{sceneId,replace:!!opts?.replace,current:this.current,history:[...this.history]});if(this.destroyed){navDiag('go blocked: navigator destroyed');return;}const cfg=mergeScene(this.plugin,sceneId);const engine=cfg.engine||'selectableScene';const adapter=window.PrismEngines&&window.PrismEngines[engine];if(!adapter||typeof adapter.mount!=='function')throw new Error(`Scene engine unavailable: ${engine}`);
  if(this.current&&!opts?.replace)this.history.push(this.current);await this.disposeCurrent();this.current=sceneId;this.host.innerHTML='';
  const childCtx=Object.assign({},this.ctx,{plugin:cfg,host:this.host,navigator:this,isActive:()=>!this.destroyed&&this.ctx.isActive?.()!==false});
  this.instance=await adapter.mount(childCtx);navDiag('scene mounted',{sceneId,engine,backgroundImage:cfg.backgroundImage||cfg.image||null,instance:!!this.instance});return this.instance;
 }
 async back(){if(!this.history.length)return false;const previous=this.history.pop();await this.go(previous,{replace:true});return true;}
 async home(){const first=this.plugin.initialScene||Object.keys(this.plugin.scenes||{})[0];this.history=[];await this.go(first,{replace:true});}
 async disposeCurrent(){if(this.instance&&typeof this.instance.destroy==='function'){try{this.instance.destroy();}catch(e){}}this.instance=null;}
 playMode(){return this.instance?.playMode?.();}onModeChange(){return this.instance?.onModeChange?.();}onLoopChange(){return this.instance?.onLoopChange?.();}stop(){return this.instance?.stop?.();}
 async destroy(){this.destroyed=true;await this.disposeCurrent();this.history=[];}
}
window.PrismSceneNavigator=PrismSceneNavigator;
window.PrismMountNavigablePlugin=async function(ctx){return new PrismSceneNavigator(ctx).mount();};
})();
