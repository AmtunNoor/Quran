(function(){
'use strict';
function n(v,d){v=Number(v);return Number.isFinite(v)?v:d;}
function clearRecord(r){['left','top','width','height','opacity','transform','zIndex'].forEach(k=>r.el.style[k]='');}
function clearLayout(root,records){root.classList.remove('prism-layout-carousel3d','prism-layout-orbit');records.forEach(clearRecord);}
function mobileViewport(){return window.matchMedia?.('(max-width: 700px)').matches===true;}
function applyCarousel3D(root,records,selected,cfg){
  clearLayout(root,records);root.classList.add('prism-layout-carousel3d');
  const mobile=mobileViewport(),count=records.length,active=selected<0?0:selected;
  const spacing=n(mobile?(cfg.mobileSpacingPercent??58):cfg.spacingPercent,mobile?58:25);
  const sideOpacity=n(mobile?(cfg.mobileSideOpacity??.58):cfg.sideOpacity,mobile?.58:.58);
  const sideScale=n(mobile?(cfg.mobileSideScale??.78):cfg.sideScale,mobile?.78:.86);
  const centerScale=n(mobile?(cfg.mobileCenterScale??1):cfg.centerScale,mobile?1:1.08);
  const angle=n(mobile?(cfg.mobileSideAngleDeg??12):cfg.sideAngleDeg,mobile?12:18);
  const itemWidth=mobile?(cfg.mobileItemWidth||'min(66vw,340px)'):(cfg.itemWidth||'min(30vw,320px)');
  const itemHeight=mobile?(cfg.mobileItemHeight||'min(62vh,560px)'):(cfg.itemHeight||'min(58vh,560px)');
  records.forEach((r,i)=>{
    let delta=i-active;if(cfg.loop){if(delta>count/2)delta-=count;if(delta<-count/2)delta+=count;}
    const distance=Math.abs(delta);
    const scale=distance===0?centerScale:Math.max(sideScale-.06*Math.max(0,distance-1),mobile?.58:.68);
    const opacity=distance===0?1:Math.max(sideOpacity-(mobile?.28:.12)*Math.max(0,distance-1),mobile?.06:.20);
    r.el.style.left='50%';r.el.style.top='50%';r.el.style.width=itemWidth;r.el.style.height=itemHeight;r.el.style.opacity=String(opacity);
    const transform=`translate(calc(-50% + ${delta*spacing}vw),-50%) perspective(900px) rotateY(${delta*-angle}deg) scale(${scale})`;
    r.el.style.setProperty('--prism-layout-transform',transform);r.el.style.transform=transform;r.el.style.zIndex=String(100-distance);
    r.el.style.pointerEvents=(mobile&&distance>1)?'none':'auto';
  });
}
function applyOrbit(root,records,selected,cfg){clearLayout(root,records);root.classList.add('prism-layout-orbit');const total=Math.max(1,records.length),offset=selected<0?0:selected,rx=n(cfg.radiusX,34),ry=n(cfg.radiusY,27);records.forEach((r,i)=>{const angle=((i-offset)/total)*Math.PI*2-Math.PI/2,x=50+Math.cos(angle)*rx,y=50+Math.sin(angle)*ry,depth=(Math.sin(angle)+1)/2;r.el.style.left=`${x}%`;r.el.style.top=`${y}%`;r.el.style.width=cfg.itemWidth||'min(20vw,220px)';r.el.style.height=cfg.itemHeight||'min(30vh,260px)';const transform=`translate(-50%,-50%) scale(${.78+depth*.25})`;r.el.style.setProperty('--prism-layout-transform',transform);r.el.style.transform=transform;r.el.style.opacity=String(.55+depth*.45);r.el.style.zIndex=String(Math.round(5+depth*10));});}
window.PrismSelectableLayouts={apply(root,records,selected,cfg){const type=cfg?.type||'static';if(type==='carousel3D')return applyCarousel3D(root,records,selected,cfg);if(type==='orbit')return applyOrbit(root,records,selected,cfg);clearLayout(root,records);}};
})();
