
window.PrismEngines = window.PrismEngines || {};
window.PrismEngines.quran = {
render(Prism, plugin, entry){
  Prism.clearQ = true;
  clearAll(); setHeader("🌙 Mariam & Hamza’s 🌙","✨Quran Adventures with Mom!✨"); showTop(true,true);
  document.body.classList.add("quran-page");
  Prism.els.app.className="grid";

  const modes=[
    {value:"listen",label:"🎧 Listen"},
    {value:"learnListen",label:"🎓 Learn · Listen"},
    {value:"repeat5",label:"🎓 Learn · 5x"},
    {value:"hifz",label:"🎓 Learn · Hifz"}
  ];
  setModes(modes,"listen",()=>renderQuranList(Prism, entry, Prism.els.mode.value));
  renderQuranList(Prism, entry, "listen");
}
};

const CORE_SURAHS=[
{id:"A5",name:"الفاتحة",eng:"Al Fatiha",emoji:"🌈",file:"A5.mp3",surahNo:"1"},
{id:"A6",name:"الإخلاص",eng:"Al Ikhlas",emoji:"💖",file:"A6.mp3",surahNo:"112"},
{id:"A7",name:"الفلق",eng:"Al Falaq",emoji:"🌙",file:"A7.mp3",surahNo:"113"},
{id:"A8",name:"الناس",eng:"An Naas",emoji:"⭐",file:"A8.mp3",surahNo:"114"},
{id:"A9",name:"الفيل",eng:"Al Feel",emoji:"🐘",file:"A9.mp3",surahNo:"105"},
{id:"A10",name:"قريش",eng:"Quraish",emoji:"🕋",file:"A10.mp3",surahNo:"106"},
{id:"A11",name:"الماعون",eng:"Al Ma'un",emoji:"🤲",file:"A11.mp3",surahNo:"107"},
{id:"A12",name:"الكوثر",eng:"Al Kawther",emoji:"💧",file:"A12.mp3",surahNo:"108"},
{id:"A13",name:"الكافرون",eng:"Al Kafiroon",emoji:"☀️",file:"A13.mp3",surahNo:"109"},
{id:"A14",name:"النصر",eng:"An Nasr",emoji:"🏆",file:"A14.mp3",surahNo:"110"},
{id:"A15",name:"المسد",eng:"Al Masad",emoji:"🔥",file:"A15.mp3",surahNo:"111"},
{id:"A16",name:"تكبير",eng:"Takbir",emoji:"☝️",file:"A16.mp3"},
{id:"A17",name:"أذان",eng:"Azan",emoji:"📣",file:"A17.mp3"},
{id:"A18",name:"الكلمة",eng:"Second Kalima",emoji:"✨",file:"A18.mp3"},
{id:"A19",name:"الضحى",eng:"Ad Duha",emoji:"☀️",file:"A19.mp3",surahNo:"93"},
{id:"A20",name:"إِنَّ الْمُسْلِمِينَ",eng:"Innal Muslimeena",emoji:"🌸",file:"A20.mp3"}
];

const SURAH_META={
"2":{name:"البقرة",eng:"Al Baqarah",emoji:"🐄"},
"55":{name:"الرحمن",eng:"Ar Rahman",emoji:"🌿"},"94":{name:"الشرح",eng:"Ash Sharh",emoji:"🌸"},"95":{name:"التين",eng:"At Teen",emoji:"🫒"},"96":{name:"العلق",eng:"Al Alaq",emoji:"📜"},"97":{name:"القدر",eng:"Al Qadr",emoji:"🌌"},"98":{name:"البينة",eng:"Al Bayyinah",emoji:"📖"},"99":{name:"الزلزلة",eng:"Az Zalzalah",emoji:"🌍"},"100":{name:"العاديات",eng:"Al Adiyat",emoji:"🐎"},"101":{name:"القارعة",eng:"Al Qariah",emoji:"⚡"},"102":{name:"التكاثر",eng:"At Takathur",emoji:"🏆"},"103":{name:"العصر",eng:"Al Asr",emoji:"⏳"},"104":{name:"الهمزة",eng:"Al Humazah",emoji:"🛡️"}
};
const FILE_META={
"02":{name:"البقرة",eng:"Al Baqarah",emoji:"👑"},
"02_1":{name:"البقرة",eng:"Al Baqarah",emoji:"🐄"}
};

function normFile(path){return String(path||"").split("/").pop().replace(/\.(mp3|m4a|wav|ogg)$/i,"")}
function surahNo(path){const m=normFile(path).split(/[_-]/)[0].match(/\d+/);return m?String(Number(m[0])):""}
function metaFor(path){const f=normFile(path);return FILE_META[f] || SURAH_META[surahNo(path)] || {name:`سورة ${surahNo(path)||f}`,eng:`Surah ${surahNo(path)||f}`,emoji:"📖"}}

function quranFiles(entry, prefix){
  return (entry.syncFiles||[]).map(f=>f.path).filter(p=>p && p.startsWith(prefix+"/") && /\.(mp3|m4a|wav|ogg)$/i.test(p));
}
function learnMatchFor(no, learnFiles){return learnFiles.find(p=>surahNo(p)===String(no))}

function renderQuranList(Prism, entry, mode){
  Prism.els.app.innerHTML=""; Prism.items=[]; Prism.focus=0; stopAudio();
  const listenFiles=quranFiles(entry,"listen");
  const learnFiles=quranFiles(entry,"learn");
  const isListen=mode==="listen";
  const source=[];

  if(isListen){
    CORE_SURAHS.forEach(s=>{
      const learn= s.surahNo ? learnMatchFor(s.surahNo,learnFiles) : null;
      source.push({...s,badge:learn?"🎓":"",listenFile:s.file,learnFile:learn});
    });
    const used=new Set(CORE_SURAHS.map(s=>s.surahNo).filter(Boolean));
    listenFiles.filter(p=>!used.has(surahNo(p))).forEach((p,i)=>{
      const m=metaFor(p), no=surahNo(p), learn=learnMatchFor(no,learnFiles);
      source.push({id:"listen-"+normFile(p),...m,file:p,listenFile:p,learnFile:learn,badge:learn?"🎓":""});
    });
  }else{
    learnFiles.forEach(p=>{
      const m=metaFor(p); source.push({id:"learn-"+normFile(p),...m,file:p,learnFile:p});
    });
  }

  source.forEach((s,idx)=>{
    card({name:s.name,eng:s.eng,emoji:s.emoji,badge:s.badge,color:theme("quran"),button:"▶ Play"},()=>{
      if(mode==="repeat5") playRepeat(s.file,5);
      else if(mode==="hifz") playRepeat(s.file,3);
      else playAudio(s.file);
    });
  });
  updateFocus();
}

function playRepeat(src,count){
  let n=0; const playOne=()=>{n++; const a=playAudio(src,{onended:()=>{if(n<count) playOne();}})}; playOne();
}
