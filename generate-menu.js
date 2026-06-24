const fs = require("fs");
const path = require("path");

const REPO_RAW = "https://raw.githubusercontent.com/AmtunNoor/Quran/main";
const LOCAL_BASE = "file:///data/user/0/com.noor.prism/files";

const ROOT = __dirname;
const PLUGINS_DIR = path.join(ROOT, "plugins");
const MENU_FILE = path.join(ROOT, "menu.json");
const SLICES_FILE = path.join(ROOT, "slices.json");

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

function exists(p) {
  return fs.existsSync(p);
}

function readJson(file, fallback) {
  try {
    if (!exists(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function walkFiles(dir, baseDir = dir) {
  if (!exists(dir)) return [];

  let results = [];

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(walkFiles(full, baseDir));
    } else {
      results.push(path.relative(baseDir, full).replace(/\\/g, "/"));
    }
  }

  return results;
}

function repoUrl(filePath) {
  return `${REPO_RAW}/${filePath}`;
}

function makeSyncFiles(files, prefix = "") {
  return files.map((f) => {
    const clean = prefix ? `${prefix}/${f}` : f;
    return {
      url: repoUrl(clean),
      path: clean
    };
  });
}

function assetExists(assetPath) {
  if (!assetPath || typeof assetPath !== "string") return false;
  return exists(path.join(ROOT, assetPath));
}

function resolveImage(assetPath, fallback) {
  if (assetExists(assetPath)) {
    return assetPath;
  }

  return fallback;
}

function loadPlugins() {
  if (!exists(PLUGINS_DIR)) return [];

  return fs
    .readdirSync(PLUGINS_DIR)
    .filter((f) => f.endsWith(".plugin.json"))
    .map((file) => readJson(path.join(PLUGINS_DIR, file), null))
    .filter(Boolean)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

function buildCoreQuran(plugin) {
  const syncFiles = [];

  if (exists(path.join(ROOT, "index.html"))) {
    syncFiles.push({
      url: repoUrl("index.html"),
      path: "quran/index.html"
    });
  }

  const rootMp3s = fs
    .readdirSync(ROOT)
    .filter((f) => /^A\d+\.mp3$/i.test(f));

  rootMp3s.forEach((mp3) => {
    syncFiles.push({
      url: repoUrl(mp3),
      path: `quran/${mp3}`
    });
  });

  if (exists(path.join(ROOT, "learn"))) {
    walkFiles(path.join(ROOT, "learn")).forEach((f) => {
      syncFiles.push({
        url: repoUrl(`learn/${f}`),
        path: `learn/${f}`
      });
    });
  }

  if (exists(SLICES_FILE)) {
    syncFiles.push({
      url: repoUrl("slices.json"),
      path: "slices.json"
    });
  }

  return {
    title: plugin.title || "Quran",
    mainUrl:
      plugin.mainUrl ||
      `${LOCAL_BASE}/quran/index.html?id=A1`,
    syncFiles
  };
}

function buildCoreSalah(plugin) {
  const folder = plugin.folder || "salah";
  const files = walkFiles(path.join(ROOT, folder));

  return {
    title: plugin.title || "Salah",
    mainUrl:
      plugin.mainUrl ||
      `${LOCAL_BASE}/${folder}/index.html`,
    syncFiles: makeSyncFiles(files, folder)
  };
}

function buildGenericPlugin(plugin, slices) {
  const folder = plugin.folder || plugin.id;
  const files = walkFiles(path.join(ROOT, folder));

  const tileImage = resolveImage(plugin.tileImage, {
    ...FALLBACK_TILE,
    label: plugin.title || plugin.id
  });

  const backgroundImage = resolveImage(
    plugin.backgroundImage,
    FALLBACK_BACKGROUND
  );

  const pluginConfig = {
    id: plugin.id,
    title: plugin.title,
    type: plugin.type || "plugin",
    folder,
    supports: plugin.supports || ["listen"],
    theme: plugin.theme || plugin.id,

    tileImage,
    backgroundImage,

    cardAnimation: plugin.cardAnimation || "float",
    backgroundEffect: plugin.backgroundEffect || "soft",

    chunkMode: plugin.chunkMode || null,

    slices: Object.keys(slices || {}).filter((key) =>
      key.startsWith(`${folder}/`)
    )
  };

  const syncFiles = makeSyncFiles(files, folder);

  syncFiles.push({
    url: repoUrl(`plugins/${plugin.id}.plugin.json`),
    path: `plugins/${plugin.id}.plugin.json`
  });

  if (exists(SLICES_FILE)) {
    syncFiles.push({
      url: repoUrl("slices.json"),
      path: "slices.json"
    });
  }

  return {
    title: plugin.title,
    mainUrl: `${LOCAL_BASE}/index.html?plugin=${plugin.id}`,
    plugin: pluginConfig,
    syncFiles
  };
}

function buildMenu() {
  const plugins = loadPlugins();
  const slices = readJson(SLICES_FILE, {});
  const menu = [];

  for (const plugin of plugins) {
    if (plugin.id === "quran" || plugin.type === "core-quran") {
      menu.push(buildCoreQuran(plugin));
    } else if (plugin.id === "salah" || plugin.type === "core-salah") {
      menu.push(buildCoreSalah(plugin));
    } else {
      menu.push(buildGenericPlugin(plugin, slices));
    }
  }

  fs.writeFileSync(MENU_FILE, JSON.stringify(menu, null, 2));
  console.log(`✅ menu.json generated with ${menu.length} items`);
}

buildMenu();
