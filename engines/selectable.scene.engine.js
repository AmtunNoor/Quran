(function(){
'use strict';
const q=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
function resolvePath(plugin,path){
  if(!path)return '';
  if(/^(https?:|data:|blob:|file:|plugins\/)/i.test(path))return path;
  const folder=String(plugin.folder||plugin.id||'').replace(/^plugins\//,'').replace(/\/$/,'');
  return `plugins/${folder}/${String(path).replace(/^\//,'')}`;
}
function renderedContainRect(img,frame){
  const fr=frame.getBoundingClientRect();
  const nw=img.naturalWidth||1,nh=img.naturalHeight||1;
  const scale=Math.min(fr.width/nw,fr.height/nh);
  const width=nw*scale,height=nh*scale;
  return {left:(fr.width-width)/2,top:(fr.height-height)/2,width,height};
}
function effectColor(value){
  const key=String(value||'').toLowerCase();
  const palette={warmgold:['255,220,132','255,179,71'],softcyan:['186,255,248','73,220,214'],softviolet:['230,202,255','170,112,255'],green:['194,255,210','80,220,150'],blue:['190,230,255','80,165,255'],pink:['255,205,241','255,100,206']};
  return palette[key]||palette.softcyan;
}
function supportsCards(plugin){const type=plugin.layout?.type;return type==='carousel3D'||type==='orbit'||plugin.presentation==='cards';}
function listEffects(plugin,item){
  const raw=item?.effects||plugin.effects?.selection||plugin.effects||[];
  const out=new Set(Array.isArray(raw)?raw:(typeof raw==='string'?[raw]:[]));
  const legacy=plugin.effect||{};
  if(legacy.dimOthers)out.add('spotlight');
  if(legacy.activeScale||legacy.breathing)out.add('grow');
  if(legacy.halo||legacy.glow)out.add('glow');
  if(legacy.breathing)out.add('breathe');
  if(legacy.minimalSparkle||legacy.sparkles)out.add('sparkle');
  return out;
}
function cropStyle(crop){
  if(!crop)return '';
  const x=q(crop.x,0),y=q(crop.y,0),w=Math.max(.01,q(crop.width,100)),h=Math.max(.01,q(crop.height,100));
  const sx=10000/w,sy=10000/h;
  const px=(100-w)>0?(x/(100-w))*100:50,py=(100-h)>0?(y/(100-h))*100:50;
  return `background-size:${sx}% ${sy}%;background-position:${px}% ${py}%;`;
}
class SelectableScene{
 constructor(ctx){this.ctx=ctx;this.plugin=ctx.plugin;this.root=null;this.items=[];this.selected=-1;this.practice=null;this.keyHandler=e=>this.onKey(e);this.resizeHandler=()=>this.layout();}
 async mount(){
  if(this.plugin.scenes&&!this.plugin.__sceneId)return window.PrismMountNavigablePlugin(this.ctx);
  const p=this.plugin,bg=resolvePath(p,p.backgroundImage||p.image),cards=supportsCards(p);
  const fill=p.display?.backgroundFill||p.scene?.backgroundFill||{};
  const blur=fill.enabled===true||p.display?.blurBackground===true||p.scene?.blurBackground===true;
  const blurOnly=cards&&p.display?.backgroundMode==='blurOnly';
  this.root=document.createElement('div');
  this.root.className=`prism-interaction-host prism-selectable-scene ${cards?'prism-card-scene':'prism-hotspot-scene'}`;
  this.root.dataset.pluginId=p.id||'';
  this.root.innerHTML=`<div class="prism-scene-frame ${blur?'has-blurred-background':''}">${blur&&bg?`<div class="prism-scene-blur" style="background-image:url('${bg.replace(/'/g,"\\'")}')"></div>`:''}${bg&&!blurOnly?`<img class="prism-scene-image" src="${bg}" alt="${p.title||''}">`:''}<div class="prism-scene-layer"></div></div><div class="prism-practice-panel" hidden><button data-act="previous">‹ Previous</button><button data-act="repeat">↻ Again</button><button data-act="next">Next ›</button></div>`;
  this.ctx.host.appendChild(this.root);
  this.frame=this.root.querySelector('.prism-scene-frame');this.img=this.root.querySelector('.prism-scene-image');this.layer=this.root.querySelector('.prism-scene-layer');this.panel=this.root.querySelector('.prism-practice-panel');
  if(blur){
    this.root.style.setProperty('--prism-bg-blur',q(fill.blurPx,22)+'px');
    this.root.style.setProperty('--prism-bg-scale',q(fill.scale,1.08));
    this.root.style.setProperty('--prism-bg-brightness',q(fill.brightness,0.72));
    this.root.style.setProperty('--prism-bg-saturation',q(fill.saturation,1.05));
    this.root.style.setProperty('--prism-bg-overlay',q(fill.overlayOpacity,0.10));
  }
  this.audio=new Audio();this.audio.preload='auto';this.audio.playsInline=true;this.buildItems(cards);
  this.practiceCue=new window.PrismPracticeCue({host:this.root,plugin:p,onEnabledChange:(enabled,config)=>{this.cueEnabled=enabled;if(this.practice){this.practice.setCueEnabled(enabled);this.practice.setCueTrigger(config.trigger);}}});
  this.cueEnabled=this.practiceCue.enabled;
  this.audioEndedHandler=()=>{if(!this.audio.loop&&this.practiceCue?.enabled&&this.practiceCue.config.trigger==='afterAudio')this.practiceCue.show();};
  this.audio.addEventListener('ended',this.audioEndedHandler);
  this.panel.addEventListener('click',e=>{const a=e.target?.dataset?.act;if(a)this.action(a);});
  this.img?.addEventListener('load',this.resizeHandler);window.addEventListener('resize',this.resizeHandler);window.addEventListener('orientationchange',this.resizeHandler);document.addEventListener('keydown',this.keyHandler,true);
  if(!this.img||this.img.complete)this.layout();this.ctx.setFocusable?.(this.root);
  const initial=Number.isInteger(p.defaultSelectedIndex)?p.defaultSelectedIndex:-1;if(initial>=0&&initial<this.items.length)await this.select(initial,false);
  return this;
 }
 buildItems(cards){
  (this.plugin.items||[]).forEach((it,i)=>{const el=document.createElement('button');el.type='button';el.className='prism-scene-item';el.dataset.index=i;el.setAttribute('aria-label',it.name||it.id||`Item ${i+1}`);
   const [light,strong]=effectColor(it.effectColor||it.color||this.plugin.effect?.color);el.style.setProperty('--prism-effect-light',light);el.style.setProperty('--prism-effect-strong',strong);
   const fx=listEffects(this.plugin,it);fx.forEach(name=>el.classList.add(`fx-${name}`));
   if(cards){const image=resolvePath(this.plugin,it.sourceImage||it.image||it.tileImage);const crop=it.sourceCrop||it.crop;const art=image?(crop?`<span class="prism-card-art prism-card-art-crop" style="background-image:url('${image.replace(/'/g,"\\'")}');${cropStyle(crop)}"></span>`:`<img src="${image}" alt="">`):'';el.innerHTML=`<span class="prism-card-face">${art}${it.label!==false?`<span class="prism-card-label">${it.name||''}</span>`:''}</span><span class="prism-item-halo"></span><span class="prism-item-mask"></span>`;}else el.innerHTML='<span class="prism-item-halo"></span><span class="prism-item-mask"></span>';
   el.addEventListener('click',()=>this.select(i,true));this.layer.appendChild(el);this.items.push({config:it,el});
  });
 }
 layout(){
  if(supportsCards(this.plugin)){window.PrismSelectableLayouts?.apply(this.root,this.items,this.selected,this.plugin.layout||{});return;}
  if(!this.img?.naturalWidth||!this.frame)return;const r=renderedContainRect(this.img,this.frame);
  this.layer.style.left=r.left+'px';this.layer.style.top=r.top+'px';this.layer.style.width=r.width+'px';this.layer.style.height=r.height+'px';
  this.items.forEach(({config,el})=>{const b=config.bounds||{};let x=b.x,y=b.y,w=b.width,h=b.height;if(x==null&&b.centerX!=null)x=q(b.centerX,0)-q(b.width,0)/2;if(y==null&&b.centerY!=null)y=q(b.centerY,0)-q(b.height,0)/2;el.style.left=q(x,0)+'%';el.style.top=q(y,0)+'%';el.style.width=q(w,10)+'%';el.style.height=q(h,10)+'%';el.style.borderRadius=q(config.borderRadiusPercent,this.plugin.effect?.halo?.borderRadiusPercent||13)+'%';});
 }
 async select(i,user){
  if(i<0||i>=this.items.length)return;this.selected=i;this.items.forEach((o,n)=>{const active=n===i;o.el.classList.toggle('is-active',active);o.el.classList.toggle('is-dimmed',!active&&o.el.classList.contains('fx-spotlight'));});this.layout();
  const it=this.items[i].config;this.ctx.onSelection?.(it,i);this.panel.hidden=true;if(user&&it.targetScene&&this.ctx.navigator){await this.ctx.navigator.go(it.targetScene);return;}
  const audio=resolvePath(this.plugin,it.audio||this.plugin.primaryAudio);if(audio)this.audio.src=audio;this.practice?.stop();this.practice=null;
  this.practiceCue.update(it);this.cueEnabled=this.practiceCue.enabled;
  if(it.segmentsFile||this.plugin.segmentsFile){this.practice=new window.PrismPracticeController({audio:this.audio,cueEnabled:this.cueEnabled,cueTrigger:this.practiceCue.config.trigger,onPlaying:()=>{this.practiceCue.hide();this.setPlaying(true);},onDecision:()=>this.showDecision(),onDecisionEnd:()=>this.hideDecision(),onYourTurn:(v,ms)=>v?this.practiceCue.show(ms):this.practiceCue.hide(),onIndexChange:(n,total)=>this.saveProgress(n,total),onComplete:()=>this.complete()});try{await this.practice.load(resolvePath(this.plugin,it.segmentsFile||this.plugin.segmentsFile));this.practice.setIndex(this.loadProgress());}catch(e){}}
  if(user&&this.ctx.getMode?.()==='listen'&&audio)this.playMode();
 }
 playMode(){if(this.selected<0)return;const mode=this.ctx.getMode?.()||'listen';this.hideDecision();this.practiceCue?.hide();if(!this.practice){this.audio.loop=this.ctx.isLoop?.()||false;this.audio.currentTime=0;this.audio.play().catch(()=>{});return;}const item=this.items[this.selected]?.config||{};if(mode==='repeat5')return this.practice.repeatCurrent(item.practice?.repeatCount||this.plugin.practice?.repeatCount||5);if(mode==='hifz')return this.practice.runHifz();if(mode==='learnListen')return this.practice.playCurrentOnce();return this.practice.playFull(this.ctx.isLoop?.()||false);}
 action(a){if(!this.practice)return;const mode=this.ctx.getMode?.()||'repeat5';if(a==='repeat')this.practice.repeatAgain(mode);if(a==='next')this.practice.next(mode);if(a==='previous')this.practice.previous(mode);}
 showDecision(){this.panel.hidden=false;this.setPlaying(false);this.panel.querySelector('[data-act="repeat"]')?.focus();}hideDecision(){this.panel.hidden=true;}setPlaying(v){this.root.classList.toggle('is-playing',!!v);}
 saveProgress(n,total){try{localStorage.setItem(`prism:${this.plugin.id}:${this.items[this.selected].config.id}:segment`,String(n));}catch(e){}this.items[this.selected]?.el.style.setProperty('--progress',`${total?((n+1)/total)*100:0}%`);}loadProgress(){try{return Number(localStorage.getItem(`prism:${this.plugin.id}:${this.items[this.selected].config.id}:segment`))||0;}catch(e){return 0;}}complete(){this.root.classList.add('is-complete');setTimeout(()=>this.root?.classList.remove('is-complete'),1200);}onModeChange(){if(this.selected>=0)this.playMode();}onLoopChange(){if(this.audio)this.audio.loop=this.ctx.isLoop?.()||false;}
 onKey(e){if(!this.ctx.isActive?.())return;if((e.key==='Escape'||e.key==='Backspace'||e.key==='BrowserBack')&&this.ctx.navigator){e.preventDefault();this.ctx.navigator.back();return;}if(this.practice?.waiting){if(e.key==='Enter'||e.key==='OK'){e.preventDefault();this.action('repeat');return;}if(e.key==='ArrowRight'){e.preventDefault();this.action('next');return;}if(e.key==='ArrowLeft'){e.preventDefault();this.action('previous');return;}}if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();let n=this.selected<0?0:this.selected+(e.key==='ArrowRight'?1:-1);n=(n+this.items.length)%this.items.length;this.select(n,false);this.items[n].el.focus();}if((e.key==='Enter'||e.key==='OK')&&this.selected>=0){e.preventDefault();const item=this.items[this.selected]?.config;if(item?.targetScene)this.select(this.selected,true);else this.playMode();}}
 stop(){this.practice?.stop();this.audio?.pause();this.hideDecision();this.practiceCue?.hide();}destroy(){this.stop();this.audio?.removeEventListener('ended',this.audioEndedHandler);this.practiceCue?.destroy();document.removeEventListener('keydown',this.keyHandler,true);window.removeEventListener('resize',this.resizeHandler);window.removeEventListener('orientationchange',this.resizeHandler);this.root?.remove();}
}
window.PrismEngines=window.PrismEngines||{};window.PrismEngines.selectableScene={mount:ctx=>new SelectableScene(ctx).mount()};
})();
