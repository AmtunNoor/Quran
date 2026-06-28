
window.PrismEngines = window.PrismEngines || {};
window.PrismEngines.grid = {
render(Prism, plugin, entry){
  clearAll(); setHeader(`✨ ${plugin.title||"Prism"} ✨`,""); showTop(true,true); setModes([]);
  Prism.els.app.className="grid";
  const audios = plugin.audios || (entry.syncFiles||[]).map(f=>f.path).filter(p=>p.startsWith((plugin.folder||plugin.id)+"/") && /\.(mp3|m4a|wav|ogg)$/i.test(p));
  if(!audios.length){
    card({name:plugin.title||"Coming Soon",eng:"Coming Soon",emoji:icon(plugin.id),image:plugin.tileImage,color:theme(plugin.id),button:"✨ Coming Soon"},()=>{});
    updateFocus(); return;
  }
  audios.forEach((src,i)=>{
    const label=src.split("/").pop().replace(/\.(mp3|m4a|wav|ogg)$/i,"").replace("_","–");
    const colors=plugin.tilePalette || [];
    card({name:plugin.id==="names"?"ﷲ":(plugin.title||"Lesson"),eng:label,emoji:plugin.id==="names"?"✨":icon(plugin.id),color:colors[i%colors.length]||theme(plugin.id),button:"▶ Play"},()=>playAudio(src));
  });
  updateFocus();
}
};
