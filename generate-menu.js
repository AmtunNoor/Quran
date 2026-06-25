const fs = require("fs");
const path = require("path");

const REPO_RAW = "https://raw.githubusercontent.com/AmtunNoor/Quran/main";
const LOCAL_BASE = "file:///data/user/0/com.noor.prism/files";

const ROOT = __dirname;
const PLUGINS_DIR = path.join(ROOT, "plugins");
const MENU_FILE = path.join(ROOT, "menu.json");
const SLICES_FILE = path.join(ROOT, "slices.json");

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
const AUDIO_EXTS = [".mp3", ".m4a", ".wav", ".ogg"];

const FALLBACK_TILE = {
  type: "gradient",
  style: "colorful",
  colors: ["#ff9a9e", "#fad0c4", "#fbc2eb", "#a18cd1"],
  icon: "✨"
};

const FALLBACK_BACKGROUND = {
  type: "gradient",
  style: "soft",
  colors: ["#fff1eb", "#ace0f9", "#fbc2eb"]
};

const DEFAULT_TILE_PALETTE = [
  "linear-gradient(135deg,#f97316,#facc15)",
  "linear-gradient(135deg,#22c55e,#14b8a6)",
  "linear-gradient(135deg,#38bdf8,#6366f1)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#ef4444,#fb7185)",
  "linear-gradient(135deg,#84cc16,#06b6d4)",
  "linear-gradient(135deg,#a855f7,#f472b6)",
  "linear-gradient(135deg,#0ea5e9,#22c55e)"
];

function exists(p){ return fs.existsSync(p); }

function readJson(file, fallback){
  try { return exists(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback; }
  catch(e){ console.warn("⚠️ JSON read failed:", file); return fallback; }
}

function writeJson(file, data){ fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function walkFiles(dir, baseDir = dir){
  if(!exists(dir)) return [];
  let out = [];
  for(const item of fs.readdirSync(dir)){
    if(item === ".DS_Store") continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if(stat.isDirectory()) out = out.concat(walkFiles(full, baseDir));
    else out.push(path.relative(baseDir, full).replace(/\\/g, "/"));
  }
  return out.sort((a,b)=>a.localeCompare(b, undefined, {numeric:true}));
}

function repoUrl(p){ return `${REPO_RAW}/${p}`; }

function addUnique(syncFiles, item){
  if(!item || !item.url || !item.path) return;
  const key = `${item.url}|${item.path}`;
  if(!syncFiles.some(x => `${x.url}|${x.path}` === key)) syncFiles.push(item);
}

function addRepoFile(syncFiles, repoPath, localPath = repoPath){
  if(!exists(path.join(ROOT, repoPath))) return;
  addUnique(syncFiles, { url: repoUrl(repoPath), path: localPath });
}

function addFolder(syncFiles, folder){
  if(!exists(path.join(ROOT, folder))) return;
  walkFiles(path.join(ROOT, folder)).forEach(f => addRepoFile(syncFiles, `${folder}/${f}`, `${folder}/${f}`));
}

function ext(f){ return path.extname(f).toLowerCase(); }
function isImage(f){ return IMAGE_EXTS.includes(ext(f)); }
function isAudio(f){ return AUDIO_EXTS.includes(ext(f)); }
function rootExists(p){ return p && typeof p === "string" && exists(path.join(ROOT, p)); }

function folderFiles(folder, filter){
  if(!exists(path.join(ROOT, folder))) return [];
  return walkFiles(path.join(ROOT, folder)).filter(filter).map(f => `${folder}/${f}`).filter(rootExists);
}

function images(folder){ return folderFiles(folder, isImage); }
function audios(folder){ return folderFiles(folder, isAudio); }

function pickImage(plugin, folder, kind){
  const explicit = kind === "tile" ? plugin.tileImage : plugin.backgroundImage;
  if(rootExists(explicit)) return explicit;

  const imgs = images(folder);
  if(!imgs.length) return kind === "tile" ? {...FALLBACK_TILE, label: plugin.title || plugin.id} : FALLBACK_BACKGROUND;

  const lower = s => s.toLowerCase();
  if(kind === "tile"){
    return imgs.find(x => /tile|cover|icon|card|logo|months|names|dua|allah|image/.test(lower(x))) || imgs[0];
  }
  return imgs.find(x => /background|bg|hero|wallpaper|scene|stage|mosque|image/.test(lower(x))) || imgs[1] || imgs[0];
}

function pickAudio(plugin, folder){
  if(rootExists(plugin.audio)) return plugin.audio;
  if(rootExists(plugin.audioFile)) return plugin.audioFile;
  const list = audios(folder);
  if(!list.length) return null;
  const lower = s => s.toLowerCase();
  return list.find(x => lower(x).includes(folder.toLowerCase())) ||
         list.find(x => /main|audio|listen|months|names|numbers|salah/.test(lower(x))) ||
         list[0];
}

function normalizeEngine(plugin){
  const raw = plugin.engine || plugin.action || "";
  if(plugin.id === "quran" || plugin.type === "core-quran") return "learning";
  if(plugin.id === "months" || plugin.directAudio === true || plugin.playFromLanding === true || raw === "direct-audio") return "directAudio";
  if(raw === "spotlight" || plugin.id === "numbers" || plugin.id === "names") return "spotlight";
  if(raw === "story" || plugin.id === "salah-names") return "story";
  if(raw === "gallery") return "gallery";
  return "gallery";
}

function loadPlugins(){
  if(!exists(PLUGINS_DIR)) return [];
  return fs.readdirSync(PLUGINS_DIR)
    .filter(f => f.endsWith(".plugin.json"))
    .map(f => readJson(path.join(PLUGINS_DIR, f), null))
    .filter(Boolean)
    .sort((a,b)=>(a.priority || 999) - (b.priority || 999));
}

function fallbackPlugins(){
  return [
    { id:"quran", title:"Quran", type:"core-quran", priority:1, engine:"learning" },
    { id:"salah", title:"Salah", type:"core-salah", priority:2, mainUrl:"https://busymommh.github.io/SalahSteps/SalahStepsIndex.html" }
  ];
}

function buildQuran(plugin){
  const syncFiles = [];
  addRepoFile(syncFiles, "index.html", "quran/index.html");

  fs.readdirSync(ROOT)
    .filter(f => /^A\d+\.mp3$/i.test(f))
    .sort((a,b)=>a.localeCompare(b, undefined, {numeric:true}))
    .forEach(mp3 => addRepoFile(syncFiles, mp3, `quran/${mp3}`));

  addFolder(syncFiles, "learn");
  addFolder(syncFiles, "listen");
  addRepoFile(syncFiles, "slices.json", "slices.json");

  return {
    title: plugin.title || "Quran",
    mainUrl: plugin.mainUrl || `${LOCAL_BASE}/quran/index.html?id=A1`,
    plugin: {
      id: "quran",
      title: plugin.title || "Quran",
      type: "core",
      engine: "learning",
      supports: plugin.supports || ["listen", "5x", "hifz"],
      locked: true
    },
    syncFiles
  };
}

function buildSalah(plugin){
  return {
    title: plugin.title || "Salah",
    mainUrl: plugin.mainUrl || "https://busymommh.github.io/SalahSteps/SalahStepsIndex.html",
    plugin: {
      id: "salah",
      title: plugin.title || "Salah",
      type: "core",
      engine: "external",
      locked: true
    },
    syncFiles: []
  };
}

function buildPlugin(plugin, slices){
  const folder = plugin.folder || plugin.id;
  const syncFiles = [];

  addRepoFile(syncFiles, "index.html", "index.html");
  addFolder(syncFiles, folder);
  addRepoFile(syncFiles, `plugins/${plugin.id}.plugin.json`, `plugins/${plugin.id}.plugin.json`);
  addRepoFile(syncFiles, "slices.json", "slices.json");

  const engine = normalizeEngine(plugin);
  const playFromLanding = engine === "directAudio" || plugin.playFromLanding === true;

  const config = {
    id: plugin.id,
    title: plugin.title,
    type: plugin.type || "plugin",
    folder,
    engine,
    supports: plugin.supports || ["listen"],
    theme: plugin.theme || plugin.id,

    tileImage: pickImage(plugin, folder, "tile"),
    backgroundImage: pickImage(plugin, folder, "background"),
    primaryAudio: pickAudio(plugin, folder),
    audios: audios(folder),
    images: images(folder),

    action: playFromLanding ? "direct-audio" : "open-plugin",
    directAudio: playFromLanding,
    playFromLanding,

    cardAnimation: plugin.cardAnimation || "living-tile",
    backgroundEffect: plugin.backgroundEffect || "soft",
    tilePalette: plugin.tilePalette || DEFAULT_TILE_PALETTE,

    chunkMode: plugin.chunkMode || null,
    sequence: plugin.sequence || [],
    spotlight: plugin.spotlight || null,
    displayMode: plugin.displayMode || null,

    slices: Object.keys(slices || {}).filter(k => k.startsWith(`${folder}/`)),
    lockedDesign: true
  };

  return {
    title: plugin.title,
    mainUrl: playFromLanding ? `${LOCAL_BASE}/index.html?plugin=${plugin.id}&autoplay=1` : `${LOCAL_BASE}/index.html?plugin=${plugin.id}`,
    plugin: config,
    syncFiles
  };
}

function buildMenu(){
  let plugins = loadPlugins();
  if(!plugins.length){
    console.warn("⚠️ No plugins found. Building Quran/Salah only.");
    plugins = fallbackPlugins();
  }

  const slices = readJson(SLICES_FILE, {});
  const menu = plugins.map(p => {
    if(p.id === "quran" || p.type === "core-quran") return buildQuran(p);
    if(p.id === "salah" || p.type === "core-salah") return buildSalah(p);
    return buildPlugin(p, slices);
  });

  writeJson(MENU_FILE, menu);
  console.log(`✅ menu.json generated with ${menu.length} items`);
}

buildMenu();
