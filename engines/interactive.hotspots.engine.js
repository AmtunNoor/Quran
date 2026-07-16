(function(){
'use strict';
window.PrismEngines=window.PrismEngines||{};
window.PrismEngines.interactiveHotspots={
 async mount(ctx){
  const plugin=ctx.plugin; const root=document.createElement('div');root.className='prism-interaction-host prism-interactive-hotspots';root.dataset.pluginId=plugin.id||'';
  const image=plugin.backgroundImage||plugin.image||'';root.innerHTML=`<div class="prism-scene-frame"><img class="prism-scene-image" src="${image}" alt="${plugin.title||''}"><div class="prism-scene-layer"></div></div>`;ctx.host.appendChild(root);
  const img=root.querySelector('img'),layer=root.querySelector('.prism-scene-layer');const aud=new Audio();let active=null;
  const layout=()=>{const r=img.getBoundingClientRect(),f=root.querySelector('.prism-scene-frame').getBoundingClientRect();layer.style.cssText+=`;left:${r.left-f.left}px;top:${r.top-f.top}px;width:${r.width}px;height:${r.height}px`;};
  (plugin.entities||[]).forEach((it,i)=>{const b=it.bounds||{};const el=document.createElement('button');el.className=`prism-hotspot prism-entity-${it.effect||'scaleGlow'}`;el.style.cssText=`left:${b.x||0}%;top:${b.y||0}%;width:${b.width||10}%;height:${b.height||10}%`;el.setAttribute('aria-label',it.name||it.id||'item');el.onclick=()=>{active?.classList.remove('is-active');active=el;el.classList.add('is-active');if(it.audio){aud.src=it.audio;aud.play().catch(()=>{});}setTimeout(()=>el.classList.remove('is-active'),1800);};layer.appendChild(el);});
  img.addEventListener('load',layout);window.addEventListener('resize',layout);if(img.complete)layout();
  return {root,stop(){aud.pause();},destroy(){aud.pause();window.removeEventListener('resize',layout);root.remove();}};
 }
};
})();
