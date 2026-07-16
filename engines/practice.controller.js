(function(){
'use strict';
class PrismPracticeController {
  constructor(options){
    this.options=options||{}; this.audio=options.audio; this.segments=[]; this.phrases=[];
    this.index=0; this.token=0; this.waiting=false; this.yourTurn=false;
  }
  async load(url){
    if(!url) return;
    const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error('segments unavailable');
    const d=await r.json(); this.segments=Array.isArray(d.learningSegments)?d.learningSegments:[];
    this.phrases=Array.isArray(d.phrases)?d.phrases:[]; this.meta=d;
  }
  cancel(){ this.token++; this.waiting=false; if(this.audio){this.audio.pause();} }
  stop(){ this.cancel(); if(this.audio){try{this.audio.currentTime=0;}catch(e){}} }
  setIndex(i){ this.index=Math.max(0,Math.min(i,this.segments.length-1)); this.options.onIndexChange?.(this.index,this.segments.length); }
  async playRange(start,end,token){
    const a=this.audio; if(!a) return;
    a.pause(); a.currentTime=Math.max(0,Number(start)||0);
    await a.play();
    await new Promise(resolve=>{
      const tick=()=>{ if(token!==this.token || a.paused || a.currentTime>=end){a.removeEventListener('timeupdate',tick); if(token===this.token){a.pause(); try{a.currentTime=end;}catch(e){}} resolve();} };
      a.addEventListener('timeupdate',tick); setTimeout(tick,30);
    });
  }
  async playFull(loop){
    this.cancel(); const token=this.token; this.audio.loop=!!loop; this.audio.currentTime=0;
    try{await this.audio.play(); this.options.onPlaying?.();}catch(e){this.options.onBlocked?.();}
    return token;
  }
  async playCurrentOnce(){
    if(!this.segments.length) return this.playFull(false);
    this.cancel(); const token=this.token; const s=this.segments[this.index]; this.options.onPlaying?.();
    await this.playRange(s.start,s.end,token); if(token!==this.token)return;
    await this.runYourTurn(s,token); if(token!==this.token)return;
    this.waiting=true; this.options.onDecision?.(this.index);
  }
  async repeatCurrent(count){
    if(!this.segments.length) return this.playFull(false);
    this.cancel(); const token=this.token; const s=this.segments[this.index]; const n=Math.max(1,Number(count)||5);
    this.options.onPlaying?.();
    for(let i=0;i<n;i++){
      await this.playRange(s.start,s.end,token); if(token!==this.token)return;
      if(this.yourTurn) await this.runYourTurn(s,token);
      else if(i<n-1) await this.sleep(Number(this.meta?.repeat?.pauseBetweenRepeatsMs)||450,token);
      if(token!==this.token)return;
    }
    this.waiting=true; this.options.onDecision?.(this.index);
  }
  async runHifz(){
    if(!this.segments.length) return this.playFull(false);
    this.cancel(); const token=this.token; const upto=this.index; this.options.onPlaying?.();
    const first=this.segments[0], last=this.segments[upto];
    await this.playRange(first.start,last.end,token); if(token!==this.token)return;
    await this.runYourTurn({start:first.start,end:last.end},token); if(token!==this.token)return;
    this.waiting=true; this.options.onDecision?.(this.index);
  }
  async runYourTurn(s,token){
    if(!this.yourTurn)return;
    const dur=Math.max(0,(Number(s.end)-Number(s.start))*1000);
    const cfg=this.meta?.yourTurn||{};
    const ms=Math.min(Number(cfg.maximumPauseMs)||5000,Math.max(Number(cfg.minimumPauseMs)||1800,dur*(Number(cfg.pauseRatio)||.85)));
    this.options.onYourTurn?.(true,ms); await this.sleep(ms,token); this.options.onYourTurn?.(false,0);
  }
  sleep(ms,token){return new Promise(r=>setTimeout(()=>r(token===this.token),ms));}
  repeatAgain(mode){ this.waiting=false; this.options.onDecisionEnd?.(); return mode==='hifz'?this.runHifz():mode==='repeat5'?this.repeatCurrent(5):this.playCurrentOnce(); }
  next(mode){ this.waiting=false; this.options.onDecisionEnd?.(); if(this.index<this.segments.length-1){this.setIndex(this.index+1);return mode==='hifz'?this.runHifz():mode==='repeat5'?this.repeatCurrent(5):this.playCurrentOnce();} this.options.onComplete?.(); return this.playFull(false); }
  previous(mode){ this.waiting=false; this.options.onDecisionEnd?.(); this.setIndex(this.index-1); return mode==='hifz'?this.runHifz():mode==='repeat5'?this.repeatCurrent(5):this.playCurrentOnce(); }
}
window.PrismPracticeController=PrismPracticeController;
})();
