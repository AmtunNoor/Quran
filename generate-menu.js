const fs = require("fs");

const REPO = "https://raw.githubusercontent.com/AmtunNoor/Quran/main";

// ================= LOAD MASTER LEARN FILE =================
function loadMasterSlices() {
  try {
    if (fs.existsSync("learn.master.slices.json")) {
      return JSON.parse(fs.readFileSync("learn.master.slices.json", "utf8"));
    }
  } catch (e) {
    console.log("⚠️ master slices not found, skipping...");
  }
  return null;
}

// ================= CORE QURAN IDS (DO NOT CHANGE QR SYSTEM) =================
const QURAN_IDS = [
  "A1","A2","A3","A4","A5","A6","A7","A8",
  "A9","A10","A11","A12","A13","A14","A15","A16"
];

// ================= BUILD MENU =================
function buildMenu() {

  const masterSlices = loadMasterSlices();

  let menu = [];

  // ================= QURAN MODULE =================
  let quran = {
    title: "Quran",
    mainUrl: "file:///data/user/0/com.noor.prism/files/quran/index.html?id=A1",
    syncFiles: []
  };

  // attach learn system ONLY if available
  if (masterSlices?.QURAN) {
    quran.learn = masterSlices.QURAN;
  }

  for (let id of QURAN_IDS) {

    quran.syncFiles.push({
      url: `${REPO}/${id}.mp3`,
      path: `${id}.mp3`
    });

  }

  menu.push(quran);

  // ================= SALAH MODULE (UNCHANGED) =================
  menu.push({
    title: "Salah",
    mainUrl: "file:///data/user/0/com.noor.prism/files/salah/SalahStepsIndex.html",
    syncFiles: [
      {
        url: `${REPO}/SalahStepsIndex.html`,
        path: "salah/SalahStepsIndex.html"
      },
      {
        url: `${REPO}/SalahStepsTinyQR.html`,
        path: "salah/SalahStepsTinyQR.html"
      },
      {
        url: `${REPO}/01_takbeer.mp3`,
        path: "salah/01_takbeer.mp3"
      },
      {
        url: `${REPO}/02_ruku.mp3`,
        path: "salah/02_ruku.mp3"
      },
      {
        url: `${REPO}/03_sajda.mp3`,
        path: "salah/03_sajda.mp3"
      },
      {
        url: `${REPO}/04_tashahhud.mp3`,
        path: "salah/04_tashahhud.mp3"
      },
      {
        url: `${REPO}/05_salam.mp3`,
        path: "salah/05_salam.mp3"
      },
      {
        url: `${REPO}/06_dua.mp3`,
        path: "salah/06_dua.mp3"
      }
    ]
  });

  // ================= OPTIONAL EXTENSIONS (FUTURE SAFE) =================

  // Example: Months auto-detect
  if (fs.existsSync("months")) {
    const files = fs.readdirSync("months");

    menu.push({
      title: "Islamic Months",
      syncFiles: files.map(f => ({
        url: `${REPO}/months/${f}`,
        path: `months/${f}`
      }))
    });
  }

  // Example: Names auto-detect
  if (fs.existsSync("names")) {
    const files = fs.readdirSync("names");

    menu.push({
      title: "Allah Names",
      learnMode: {
        groupSize: 4,
        repeat: 5
      },
      syncFiles: files.map(f => ({
        url: `${REPO}/names/${f}`,
        path: `names/${f}`
      }))
    });
  }

  // ================= WRITE OUTPUT =================
  fs.writeFileSync("menu.json", JSON.stringify(menu, null, 2));

  console.log("✅ Prism V3.3 menu.json generated with master learning engine");
}

buildMenu();
