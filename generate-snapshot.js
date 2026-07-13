#!/usr/bin/env node
"use strict";

/**
 * Generates deterministic offline-sync metadata for Noor's Prism Android runtime.
 * It inventories files only; it never executes or changes the Prism web app.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const OUTPUT = "snapshot.json";
const RAW_BASE = "https://raw.githubusercontent.com/AmtunNoor/Quran/main/";

const ALLOWED_EXTENSIONS = new Set([
  ".html", ".htm", ".css", ".js", ".json", ".webmanifest", ".txt",
  ".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif",
  ".mp3", ".ogg", ".wav", ".m4a", ".aac",
  ".woff", ".woff2", ".ttf", ".otf"
]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".ogg", ".wav", ".m4a", ".aac"]);
const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif"]);
const EXCLUDED_FILES = new Set([
  OUTPUT, "generate-menu.js", "generate-snapshot.js", "NoorsPrism.apk", "QuranQRgenerator.html"
]);
const EXCLUDED_PREFIXES = [".git/", ".github/", "node_modules/", "build/", "dist/"];
const REQUIRED_JSON = new Set(["menu.json", "plugins/plugins.json", "learn.master.slices.json"]);

function slash(value) { return value.split(path.sep).join("/"); }
function sha256(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = slash(path.relative(ROOT, absolute));
    if (entry.isDirectory()) {
      if (!EXCLUDED_PREFIXES.some(prefix => `${relative}/`.startsWith(prefix))) walk(absolute, output);
    } else if (entry.isFile()) {
      output.push(relative);
    }
  }
  return output;
}

function isQuranAudio(relative) {
  const lower = relative.toLowerCase();
  const name = path.posix.basename(lower);
  return lower.startsWith("listen/") || lower.startsWith("learn/") ||
    /^a\d{1,3}\.(mp3|ogg|wav|m4a|aac)$/.test(name) ||
    /^(\d{1,3})([_-]\d+)?\.(mp3|ogg|wav|m4a|aac)$/.test(name);
}

function priorityFor(relative) {
  const lower = relative.toLowerCase();
  const ext = path.posix.extname(lower);
  if ([".html", ".htm", ".css", ".js", ".json", ".webmanifest", ".txt"].includes(ext)) return 0;
  if (IMAGE_EXTENSIONS.has(ext) || [".woff", ".woff2", ".ttf", ".otf"].includes(ext)) return 1;
  if (AUDIO_EXTENSIONS.has(ext)) return 2;
  return 3;
}

function laneFor(relative) {
  const ext = path.posix.extname(relative.toLowerCase());
  if (!AUDIO_EXTENSIONS.has(ext)) return "general";
  return isQuranAudio(relative) ? "quran-audio" : "module-audio";
}

const ignored = [];
const candidates = walk(ROOT)
  .filter(relative => !EXCLUDED_FILES.has(relative))
  .filter(relative => !EXCLUDED_PREFIXES.some(prefix => relative.startsWith(prefix)))
  .filter(relative => ALLOWED_EXTENSIONS.has(path.posix.extname(relative.toLowerCase())))
  .filter(relative => {
    if (path.posix.extname(relative.toLowerCase()) !== ".json") return true;
    try {
      JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
      return true;
    } catch (error) {
      if (REQUIRED_JSON.has(relative)) throw new Error(`Required JSON is invalid: ${relative}`);
      ignored.push({ path: relative, reason: "invalid-json" });
      return false;
    }
  })
  .sort((a, b) => a.localeCompare(b));

for (const required of ["index.html", "menu.json", "styles/prism.css", "engines/prism.legacy.engine.js"]) {
  if (!candidates.includes(required)) throw new Error(`${required} is required`);
}

const files = candidates.map(relative => {
  const bytes = fs.readFileSync(path.join(ROOT, relative));
  if (bytes.length === 0) throw new Error(`Empty deployable file: ${relative}`);
  return {
    path: relative,
    url: RAW_BASE + relative.split("/").map(encodeURIComponent).join("/"),
    size: bytes.length,
    sha256: sha256(bytes),
    priority: priorityFor(relative),
    lane: laneFor(relative)
  };
});

const fingerprint = sha256(Buffer.from(
  files.map(file => `${file.path}\0${file.size}\0${file.sha256}\0${file.priority}\0${file.lane}`).join("\n"),
  "utf8"
));

const snapshot = {
  schema: 1,
  version: fingerprint,
  entryPoint: "index.html",
  aliases: { "quran/index.html": "index.html" },
  ignored,
  files
};

fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(snapshot, null, 2) + "\n", "utf8");
const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
console.log(`snapshot.json: ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB, ${ignored.length} ignored`);
