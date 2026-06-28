
window.PrismEngines = window.PrismEngines || {};
window.PrismEngines.story = {
render(Prism, plugin, entry){
  clearAll(); document.body.classList.add("stage-page"); setHeader("",""); showTop(true,true); setModes([]);
  Prism.els.app.className="stage-shell stage-fill";
  const img=plugin.backgroundImage || plugin.tileImage || (plugin.images||[])[0] || "";
  const audio=plugin.primaryAudio || (plugin.audios||[])[0] || "";
  const seq=plugin.sequence || [];
  Prism.els.app.innerHTML=`
    <img class="visual-img" src="${img}" alt="">
    <div class="story-tint dawn" id="storyTint"></div>
    <div class="story-panel">
      <div class="story-arabic" id="storyArabic">${seq[0]?.arabic||""}</div>
      <div class="story-name" id="storyName">${seq[0]?.name||plugin.title||""}</div>
      <div class="story-badges" id="storyBadges"></div>
    </div>`;
  function show(i){
    if(!seq.length) return;
    const s=seq[Math.max(0,Math.min(seq.length-1,i))];
    document.getElementById("storyArabic").textContent=s.arabic||"";
    document.getElementById("storyName").textContent=s.name||"";
    const tint=document.getElementById("storyTint"); tint.className="story-tint "+(s.effect||"dawn");
    document.getElementById("storyBadges").innerHTML=(s.rakah||[]).map(x=>`<span class="story-badge">${x}</span>`).join("");
  }
  show(0);
  function start(){
    if(!audio) return;
    playAudio(audio,{onplay:()=>show(0), ontimeupdate:(a)=>{
      if(a.duration && isFinite(a.duration) && seq.length){
        show(Math.min(seq.length-1,Math.floor((a.currentTime/a.duration)*seq.length)));
      }
    }});
  }
  Prism.els.app.onclick=start;
  if(plugin.autoStart || new URLSearchParams(location.search).get("autoplay")==="1") setTimeout(start,350);
}
};
