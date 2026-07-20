(function(){
'use strict';
function mergeConfig(plugin,item){
  const base=(plugin&&plugin.practiceCue)||{};
  const local=(item&&item.practiceCue)||{};
  return Object.assign({enabled:false,default:false,trigger:'afterAudio',label:'⭐ Now You Try!',durationMs:3600},base,local);
}
class PrismPracticeCue{
  constructor(opts){
    opts=opts||{};
    this.host=opts.host||null;
    this.plugin=opts.plugin||{};
    this.onEnabledChange=typeof opts.onEnabledChange==='function'?opts.onEnabledChange:null;
    this.timer=null;
    this.config=mergeConfig(this.plugin,null);
    this.enabled=!!(this.config.enabled&&this.config.default);
    this.shell=null;
    this.visual=null;
    this.toggle=null;
    this.render();
  }
  render(){
    if(!this.host||!this.config.enabled)return;
    const shell=document.createElement('div');
    shell.className='prism-practice-cue-shell';
    shell.innerHTML='<div class="prism-practice-cue-visual" hidden><span class="prism-voice-waves prism-voice-waves-left"><i></i><i></i><i></i></span><span class="prism-practice-mic" aria-hidden="true"></span><span class="prism-voice-waves prism-voice-waves-right"><i></i><i></i><i></i></span></div><button type="button" class="prism-practice-cue-toggle"></button>';
    this.host.appendChild(shell);
    this.shell=shell;this.visual=shell.querySelector('.prism-practice-cue-visual');this.toggle=shell.querySelector('.prism-practice-cue-toggle');
    this.toggle.addEventListener('click',()=>this.setEnabled(!this.enabled,true));
    this.refresh();
  }
  ensureRendered(){if(!this.shell&&this.config.enabled)this.render();}
  refresh(){
    if(!this.shell)return;
    this.shell.hidden=!this.config.enabled;
    this.shell.classList.toggle('is-enabled',!!this.enabled);
    if(this.toggle){this.toggle.textContent=this.config.label||'⭐ Now You Try!';this.toggle.setAttribute('aria-pressed',this.enabled?'true':'false');}
    if(!this.enabled)this.hide();
  }
  update(item){
    this.config=mergeConfig(this.plugin,item||null);
    this.enabled=!!(this.config.enabled&&(this.config.default===true||this.enabled));
    this.ensureRendered();this.refresh();
    if(this.onEnabledChange)this.onEnabledChange(this.enabled,this.config);
    return this;
  }
  setEnabled(value,user){
    if(!this.config.enabled)return;
    this.enabled=!!value;this.refresh();
    if(this.onEnabledChange)this.onEnabledChange(this.enabled,this.config);
    if(user&&this.enabled)this.show();
  }
  show(durationMs){
    if(!this.config.enabled||!this.enabled||!this.shell)return;
    clearTimeout(this.timer);this.shell.classList.add('is-cue-active');if(this.visual)this.visual.hidden=false;
    const ms=Number(durationMs||this.config.durationMs||0);if(ms>0)this.timer=setTimeout(()=>this.hide(),ms);
  }
  hide(){clearTimeout(this.timer);this.timer=null;if(this.shell)this.shell.classList.remove('is-cue-active');if(this.visual)this.visual.hidden=true;}
  destroy(){this.hide();this.shell?.remove();this.shell=null;this.visual=null;this.toggle=null;}
}
window.PrismPracticeCue=PrismPracticeCue;
})();
