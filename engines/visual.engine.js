
window.PrismEngines = window.PrismEngines || {};
window.PrismEngines.visual = {
render(Prism, plugin, entry){
  clearAll(); document.body.classList.add("stage-page"); setHeader("",""); showTop(true,true); setModes([]);
  Prism.els.app.className="stage-shell";

  const img = plugin.backgroundImage || plugin.tileImage || (plugin.images||[])[0] || "";
  const audios = plugin.audios || (entry.syncFiles||[]).map(f=>f.path).filter(p=>p.startsWith((plugin.folder||plugin.id)+"/") && /\.(mp3|m4a|wav|ogg)$/i.test(p));
  const audio = plugin.primaryAudio || audios[0] || "";

  Prism.els.app.innerHTML = `
    <div class="visual-bg" style="background-image:url('${img}')"></div>
    <img class="visual-img" id="visualImg" src="${img}" alt="">
    ${plugin.effect?.waterRays?`<div class="water-rays"></div>`:""}
    ${plugin.coordinates?`<div class="focus-dot" id="focusDot"></div>`:""}
  `;
  if(plugin.effect?.bubbles) addBubbles(Prism.els.app, plugin.effect.bubbleCount || 14);

  const imageEl=document.getElementById("visualImg");
  const dot=document.getElementById("focusDot");
  let keys=Object.keys(plugin.coordinates||{}).sort((a,b)=>Number(a)-Number(b));
  let current=0;

  function position(i){
    if(!dot || !keys.length || !imageEl) return;
    const key=keys[((i%keys.length)+keys.length)%keys.length];
    const p=plugin.coordinates[key];
    const stageRect=Prism.els.app.getBoundingClientRect();
    const imgRect=imageEl.getBoundingClientRect();
    dot.style.left=(imgRect.left-stageRect.left + (Number(p.x)/100)*imgRect.width)+"px";
    dot.style.top=(imgRect.top-stageRect.top + (Number(p.y)/100)*imgRect.height)+"px";
    dot.dataset.i=i;
  }
  function recalc(){[60,240,700].forEach(ms=>setTimeout(()=>position(current),ms))}
  imageEl.onload=recalc; addEventListener("resize",recalc,{passive:true}); addEventListener("orientationchange",recalc,{passive:true});
  recalc();

  function start(){
    if(!audio) return;
    const a=playAudio(audio,{
      onplay:()=>{current=0;position(0)},
      ontimeupdate:(au)=>{
        if(keys.length && au.duration && isFinite(au.duration)){
          current=Math.min(keys.length-1, Math.floor((au.currentTime/au.duration)*keys.length));
          position(current);
        }
      }
    });
  }
  Prism.els.app.onclick=start;
  if(plugin.autoStart || new URLSearchParams(location.search).get("autoplay")==="1") setTimeout(start,350);
}
};
function addBubbles(container,count){
  for(let i=0;i<count;i++){
    const b=document.createElement("div"); b.className="bubble";
    const s=6+Math.random()*16; b.style.width=s+"px"; b.style.height=s+"px";
    b.style.left=(Math.random()*100)+"%"; b.style.animationDelay=(Math.random()*6)+"s"; b.style.animationDuration=(5+Math.random()*6)+"s";
    container.appendChild(b);
  }
}
