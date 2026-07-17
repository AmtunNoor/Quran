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
class SelectableScene{
 constructor(ctx){this.ctx=ctx;this.plugin=ctx.plugin;this.root=null;this.items=[];this.selected=-1;this.practice=null;this.keyHandler=e=>this.onKey(e);this.resizeHandler=()=>this.layout();}
 async mount(){
  if(this.plugin.scenes&&!this.plugin.__sceneId)return window.PrismMountNavigablePlugin(this.ctx);
  const p=this.plugin,bg=resolvePath(p,p.backgroundImage||p.image),cards=supportsCards(p);
  const fill=p.display?.backgroundFill||p.scene?.backgroundFill||{};
  const blur=!cards&&(fill.enabled===true||p.display?.blurBackground===true||p.scene?.blurBackground===true);
  this.root=document.createElement('div');
  this.root.className=`prism-interaction-host prism-selectable-scene ${cards?'prism-card-scene':'prism-hotspot-scene'}`;
  this.root.dataset.pluginId=p.id||'';
  this.root.innerHTML=`<div class="prism-scene-frame ${blur?'has-blurred-background':''}">${blur&&bg?`<div class="prism-scene-blur" style="background-image:url('${bg.replace(/'/g,"\\'")}')"></div>`:''}${bg?`<img class="prism-scene-image" src="${bg}" alt="${p.title||''}">`:''}<div class="prism-scene-layer"></div></div><div class="prism-practice-panel" hidden><button data-act="previous">‹ Previous</button><button data-act="repeat">↻ Again</button><button data-act="next">Next ›</button></div><button class="prism-your-turn-toggle" type="button" hidden>🎤 Your Turn: OFF</button><div class="prism-practice-cue" hidden aria-hidden="true"><div class="prism-practice-cue-visual"><span class="prism-practice-mic" role="img" aria-label="Microphone"></span><i></i><i></i><i></i></div><b>Your Turn</b></div>`;
  this.ctx.host.appendChild(this.root);
  this.frame=this.root.querySelector('.prism-scene-frame');this.img=this.root.querySelector('.prism-scene-image');this.layer=this.root.querySelector('.prism-scene-layer');this.panel=this.root.querySelector('.prism-practice-panel');this.cue=this.root.querySelector('.prism-practice-cue');this.toggle=this.root.querySelector('.prism-your-turn-toggle');
  if(blur){
    this.root.style.setProperty('--prism-bg-blur',q(fill.blurPx,22)+'px');
    this.root.style.setProperty('--prism-bg-scale',q(fill.scale,1.08));
    this.root.style.setProperty('--prism-bg-brightness',q(fill.brightness,0.72));
    this.root.style.setProperty('--prism-bg-saturation',q(fill.saturation,1.05));
    this.root.style.setProperty('--prism-bg-overlay',q(fill.overlayOpacity,0.10));
  }
  const cueConfig=p.practice?.yourTurn?.cueConfig||p.practiceCue||{};
  this.root.dataset.practiceCuePlacement=String(cueConfig.placement||'sceneCenter');
  this.root.dataset.practiceCueColor=String(cueConfig.color||cueConfig.waveColor||'warmGold');
  this.audio=new Audio();this.audio.preload='auto';this.audio.playsInline=true;this.buildItems(cards);
  this.panel.addEventListener('click',e=>{const a=e.target?.dataset?.act;if(a)this.action(a);});
  this.toggle.addEventListener('click',()=>{if(!this.practice)return;this.practice.yourTurn=!this.practice.yourTurn;this.toggle.textContent=`🎤 Your Turn: ${this.practice.yourTurn?'ON':'OFF'}`;});
  this.img?.addEventListener('load',this.resizeHandler);window.addEventListener('resize',this.resizeHandler);window.addEventListener('orientationchange',this.resizeHandler);document.addEventListener('keydown',this.keyHandler,true);
  if(!this.img||this.img.complete)this.layout();this.ctx.setFocusable?.(this.root);
  const initial=Number.isInteger(p.defaultSelectedIndex)?p.defaultSelectedIndex:-1;if(initial>=0&&initial<this.items.length)await this.select(initial,false);
  return this;
 }
 buildItems(cards){
  (this.plugin.items||[]).forEach((it,i)=>{const el=document.createElement('button');el.type='button';el.className='prism-scene-item';el.dataset.index=i;el.setAttribute('aria-label',it.name||it.id||`Item ${i+1}`);
   const [light,strong]=effectColor(it.effectColor||it.color||this.plugin.effect?.color);el.style.setProperty('--prism-effect-light',light);el.style.setProperty('--prism-effect-strong',strong);
   if(cards){const image=resolvePath(this.plugin,it.image||it.tileImage);el.innerHTML=`<span class="prism-card-face">${image?`<img src="${image}" alt="">`:''}${it.label!==false?`<span class="prism-card-label">${it.name||''}</span>`:''}</span><span class="prism-item-halo"></span>`;}else el.innerHTML='<span class="prism-item-halo"></span><span class="prism-item-mask"></span>';
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
  if(i<0||i>=this.items.length)return;this.selected=i;this.items.forEach((o,n)=>{o.el.classList.toggle('is-active',n===i);o.el.classList.toggle('is-dimmed',n!==i);});this.layout();
  const it=this.items[i].config;this.ctx.onSelection?.(it,i);this.panel.hidden=true;if(it.targetScene&&this.ctx.navigator){await this.ctx.navigator.go(it.targetScene);return;}
  const audio=resolvePath(this.plugin,it.audio||this.plugin.primaryAudio);if(audio)this.audio.src=audio;this.practice?.stop();this.practice=null;
  if(it.segmentsFile||this.plugin.segmentsFile){this.practice=new window.PrismPracticeController({audio:this.audio,onPlaying:()=>this.setPlaying(true),onDecision:()=>this.showDecision(),onDecisionEnd:()=>this.hideDecision(),onYourTurn:v=>this.showCue(v),onIndexChange:(n,total)=>this.saveProgress(n,total),onComplete:()=>this.complete()});try{await this.practice.load(resolvePath(this.plugin,it.segmentsFile||this.plugin.segmentsFile));this.practice.setIndex(this.loadProgress());}catch(e){}if(it.practice?.yourTurn?.enabled!==false&&this.plugin.practice?.yourTurn?.enabled!==false)this.toggle.hidden=false;}else this.toggle.hidden=true;
  if(user&&this.ctx.getMode?.()==='listen'&&audio)this.playMode();
 }
 playMode(){if(this.selected<0)return;const mode=this.ctx.getMode?.()||'listen';this.hideDecision();if(!this.practice){this.audio.loop=this.ctx.isLoop?.()||false;this.audio.currentTime=0;this.audio.play().catch(()=>{});return;}const item=this.items[this.selected]?.config||{};if(mode==='repeat5')return this.practice.repeatCurrent(item.practice?.repeatCount||this.plugin.practice?.repeatCount||5);if(mode==='hifz')return this.practice.runHifz();if(mode==='learnListen')return this.practice.playCurrentOnce();return this.practice.playFull(this.ctx.isLoop?.()||false);}
 action(a){if(!this.practice)return;const mode=this.ctx.getMode?.()||'repeat5';if(a==='repeat')this.practice.repeatAgain(mode);if(a==='next')this.practice.next(mode);if(a==='previous')this.practice.previous(mode);}
 showDecision(){this.panel.hidden=false;this.setPlaying(false);this.panel.querySelector('[data-act="repeat"]')?.focus();}hideDecision(){this.panel.hidden=true;}showCue(v){this.cue.hidden=!v;this.root.classList.toggle('is-your-turn',!!v);}setPlaying(v){this.root.classList.toggle('is-playing',!!v);}
 saveProgress(n,total){try{localStorage.setItem(`prism:${this.plugin.id}:${this.items[this.selected].config.id}:segment`,String(n));}catch(e){}this.items[this.selected]?.el.style.setProperty('--progress',`${total?((n+1)/total)*100:0}%`);}loadProgress(){try{return Number(localStorage.getItem(`prism:${this.plugin.id}:${this.items[this.selected].config.id}:segment`))||0;}catch(e){return 0;}}complete(){this.root.classList.add('is-complete');setTimeout(()=>this.root?.classList.remove('is-complete'),1200);}onModeChange(){if(this.selected>=0)this.playMode();}onLoopChange(){if(this.audio)this.audio.loop=this.ctx.isLoop?.()||false;}
 onKey(e){if(!this.ctx.isActive?.())return;if((e.key==='Escape'||e.key==='Backspace'||e.key==='BrowserBack')&&this.ctx.navigator){e.preventDefault();this.ctx.navigator.back();return;}if(this.practice?.waiting){if(e.key==='Enter'||e.key==='OK'){e.preventDefault();this.action('repeat');return;}if(e.key==='ArrowRight'){e.preventDefault();this.action('next');return;}if(e.key==='ArrowLeft'){e.preventDefault();this.action('previous');return;}}if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();let n=this.selected<0?0:this.selected+(e.key==='ArrowRight'?1:-1);n=(n+this.items.length)%this.items.length;this.select(n,false);this.items[n].el.focus();}if((e.key==='Enter'||e.key==='OK')&&this.selected>=0){e.preventDefault();const item=this.items[this.selected]?.config;if(item?.targetScene)this.select(this.selected,true);else this.playMode();}}
 stop(){this.practice?.stop();this.audio?.pause();this.hideDecision();this.showCue(false);}destroy(){this.stop();document.removeEventListener('keydown',this.keyHandler,true);window.removeEventListener('resize',this.resizeHandler);window.removeEventListener('orientationchange',this.resizeHandler);this.root?.remove();}
}
window.PrismEngines=window.PrismEngines||{};window.PrismEngines.selectableScene={mount:ctx=>new SelectableScene(ctx).mount()};
})();
