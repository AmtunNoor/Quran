(function(){
'use strict';
function mergeConfig(plugin,item){
  const base=(plugin&&plugin.practiceCue)||{},local=(item&&item.practiceCue)||{};
  return Object.assign({enabled:false,default:false,trigger:['afterAudio'],label:'⭐ Now You Try! ⭐',durationMs:4200,dimBackground:true,maxTileOverlapRatio:.34},base,local);
}
class PrismPracticeCue{
  constructor(opts){
    opts=opts||{};this.host=opts.host||null;this.plugin=opts.plugin||{};this.onEnabledChange=typeof opts.onEnabledChange==='function'?opts.onEnabledChange:null;
    this.timer=null;this.config=mergeConfig(this.plugin,null);this.enabled=!!(this.config.enabled&&this.config.default);this.shell=null;this.visual=null;this.toggle=null;this.dim=null;this.anchor=null;
    this.resize=()=>this.layout();this.render();window.addEventListener('resize',this.resize);window.addEventListener('orientationchange',this.resize);
  }
  render(){
    if(!this.host||!this.config.enabled)return;
    const dim=document.createElement('div');dim.className='prism-practice-cue-dim';dim.hidden=true;
    const shell=document.createElement('div');shell.className='prism-practice-cue-shell';
    shell.innerHTML='<div class="prism-practice-cue-visual" hidden><span class="prism-cue-sparkle s1">✦</span><span class="prism-cue-sparkle s2">✦</span><span class="prism-voice-waves prism-voice-waves-left"><i></i><i></i><i></i></span><span class="prism-practice-mic" aria-hidden="true"><span class="prism-mic-grille"><i></i><i></i><i></i><i></i><i></i></span><span class="prism-mic-highlight"></span><span class="prism-mic-yoke"></span><span class="prism-mic-stem"></span><span class="prism-mic-base"></span></span><span class="prism-voice-waves prism-voice-waves-right"><i></i><i></i><i></i></span></div><button type="button" class="prism-practice-cue-toggle"></button>';
    this.host.appendChild(dim);this.host.appendChild(shell);this.dim=dim;this.shell=shell;this.visual=shell.querySelector('.prism-practice-cue-visual');this.toggle=shell.querySelector('.prism-practice-cue-toggle');
    this.toggle.addEventListener('click',()=>this.setEnabled(!this.enabled,true));this.refresh();requestAnimationFrame(()=>this.layout());
  }
  ensureRendered(){if(!this.shell&&this.config.enabled)this.render();}
  anchorTo(el){this.anchor=el||null;requestAnimationFrame(()=>this.layout());return this;}
  refresh(){
    if(!this.shell)return;this.shell.hidden=!this.config.enabled;this.shell.classList.toggle('is-enabled',!!this.enabled);
    if(this.toggle){this.toggle.textContent=this.config.label||'⭐ Now You Try! ⭐';this.toggle.setAttribute('aria-pressed',this.enabled?'true':'false');}
    if(!this.enabled)this.hide();this.layout();
  }
  update(item){
    this.config=mergeConfig(this.plugin,item||null);this.enabled=!!(this.config.enabled&&(this.config.default===true||this.enabled));this.ensureRendered();this.refresh();
    if(this.onEnabledChange)this.onEnabledChange(this.enabled,this.config);return this;
  }
  setEnabled(value){if(!this.config.enabled)return;this.enabled=!!value;this.refresh();if(this.onEnabledChange)this.onEnabledChange(this.enabled,this.config);}
  layout(){
    if(!this.host||!this.shell||this.shell.hidden)return;
    const hr=this.host.getBoundingClientRect(),ar=this.anchor?.getBoundingClientRect?.();
    const visualH=this.visual&&!this.visual.hidden?this.visual.getBoundingClientRect().height:0;
    const toggleH=this.toggle?.getBoundingClientRect().height||48;
    const shellH=Math.max(52,visualH+toggleH+8),safe=12;
    let top=hr.height-shellH-safe;
    if(ar&&ar.height){
      const itemBottom=ar.bottom-hr.top,itemTop=ar.top-hr.top,maxOverlap=ar.height*Number(this.config.maxTileOverlapRatio||.34);
      const preferred=itemBottom+10;
      const latest=itemBottom-maxOverlap;
      top=Math.max(latest,Math.min(preferred,hr.height-shellH-safe));
      top=Math.max(itemTop+ar.height*.52,top);
    }
    top=Math.max(safe,Math.min(top,hr.height-shellH-safe));
    this.shell.style.top=`${Math.round(top)}px`;this.shell.style.bottom='auto';
  }
  show(durationMs){
    if(!this.config.enabled||!this.enabled||!this.shell)return;clearTimeout(this.timer);this.layout();this.shell.classList.add('is-cue-active');this.host?.classList.add('is-practice-cue-active');
    if(this.visual)this.visual.hidden=false;if(this.dim)this.dim.hidden=this.config.dimBackground===false;requestAnimationFrame(()=>this.layout());
    const ms=Number(durationMs||this.config.durationMs||0);if(ms>0)this.timer=setTimeout(()=>this.hide(),ms);
  }
  hide(){clearTimeout(this.timer);this.timer=null;if(this.shell)this.shell.classList.remove('is-cue-active');this.host?.classList.remove('is-practice-cue-active');if(this.visual)this.visual.hidden=true;if(this.dim)this.dim.hidden=true;this.layout();}
  destroy(){this.hide();window.removeEventListener('resize',this.resize);window.removeEventListener('orientationchange',this.resize);this.shell?.remove();this.dim?.remove();this.shell=null;this.visual=null;this.toggle=null;this.dim=null;this.anchor=null;}
}
window.PrismPracticeCue=PrismPracticeCue;
})();
