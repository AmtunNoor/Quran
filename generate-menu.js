const fs = require("fs");

const REPO = "https://raw.githubusercontent.com/AmtunNoor/Quran/main";

function loadMasterSlices() {
  try {
    return JSON.parse(fs.readFileSync("learn.master.slices.json", "utf8"));
  } catch {
    return null;
  }
}

const QURAN_IDS = [
"A1","A2","A3","A4","A5","A6","A7","A8",
"A9","A10","A11","A12","A13","A14","A15","A16"
];

function buildMenu() {

  const master = loadMasterSlices();

  const menu = [];

  // ================= QURAN =================
  const quran = {
    title: "Quran",
    mainUrl: "file:///data/user/0/com.noor.prism/files/quran/index.html?id=A1",
    syncFiles: []
  };

  for (const id of QURAN_IDS) {
    quran.syncFiles.push({
      url: `${REPO}/${id}.mp3`,
      path: `${id}.mp3`
    });
  }

  // inject learn engine (optional safe)
  if (master?.QURAN) {
    quran.learn = master.QURAN;
  }

  menu.push(quran);

  // ================= SALAH =================
  menu.push({
    title: "Salah",
    mainUrl: "file:///data/user/0/com.noor.prism/files/salah/SalahStepsIndex.html",
    syncFiles: [
      "SalahStepsIndex.html",
      "SalahStepsTinyQR.html",
      "01_takbeer.mp3",
      "02_ruku.mp3",
      "03_sajda.mp3",
      "04_tashahhud.mp3",
      "05_salam.mp3",
      "06_dua.mp3"
    ].map(f => ({
      url: `${REPO}/${f}`,
      path: `salah/${f}`
    }))
  });

  // ================= DUAS (AUTO CARD SYSTEM) =================
  menu.push({
    title: "Dua",
    mainUrl: "file:///data/user/0/com.noor.prism/files/duas/index.html",
    syncFiles: []
  });

  // ================= MONTHS =================
  menu.push({
    title: "Islamic Months",
    mainUrl: "file:///data/user/0/com.noor.prism/files/months/index.html",
    syncFiles: [
      {
        url: `${REPO}/months/months.mp3`,
        path: "months/months.mp3"
      },
      {
        url: `${REPO}/months/months.jpeg`,
        path: "months/months.jpeg"
      }
    ]
  });

  // ================= NAMES =================
  menu.push({
    title: "Allah Names",
    mainUrl: "file:///data/user/0/com.noor.prism/files/names/index.html",
    learnMode: {
      type: "grouped",
      groupSize: 4,
      repeat: 5
    },
    syncFiles: [
      "1_27.mp3",
      "28_36.mp3",
      "37_45.mp3",
      "46_60.mp3",
      "61_76.mp3",
      "77_99.mp3",
      "names.jpeg"
    ].map(f => ({
      url: `${REPO}/names/${f}`,
      path: `names/${f}`
    }))
  });

  fs.writeFileSync("menu.json", JSON.stringify(menu, null, 2));

  console.log("✅ PRISM FULL AUTO SYNC V3.3.1 COMPLETE");
}

buildMenu();
