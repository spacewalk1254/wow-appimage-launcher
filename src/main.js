const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { pathToFileURL } = require("node:url");

const configFileName = "private-collection.json";
const customThemes = ["custom-loatheb", "custom-gluth", "custom-sapphiron"];
const battleNetGameDefinitions = [
  {
    id: "wow-retail",
    title: "World of Warcraft Retail",
    folderNames: ["World of Warcraft"],
    executableNames: ["Wow.exe", "World of Warcraft Launcher.exe"],
    relativeExecutables: [path.join("_retail_", "Wow.exe"), path.join("_retail_", "World of Warcraft Launcher.exe")]
  },
  {
    id: "wow-classic",
    title: "World of Warcraft Classic",
    folderNames: ["World of Warcraft"],
    executableNames: ["WowClassic.exe"],
    relativeExecutables: [path.join("_classic_", "WowClassic.exe"), path.join("_classic_", "Wow.exe")]
  },
  {
    id: "wow-classic-era",
    title: "World of Warcraft Classic Era",
    folderNames: ["World of Warcraft"],
    executableNames: ["WowClassic.exe"],
    relativeExecutables: [path.join("_classic_era_", "WowClassic.exe"), path.join("_classic_era_", "Wow.exe")]
  },
  {
    id: "diablo-iv",
    title: "Diablo IV",
    folderNames: ["Diablo IV"],
    executableNames: ["Diablo IV.exe", "Diablo IV Launcher.exe"]
  },
  {
    id: "diablo-iii",
    title: "Diablo III",
    folderNames: ["Diablo III"],
    executableNames: ["Diablo III.exe", "Diablo III Launcher.exe"]
  },
  {
    id: "diablo-ii-resurrected",
    title: "Diablo II: Resurrected",
    folderNames: ["Diablo II Resurrected"],
    executableNames: ["D2R.exe", "Diablo II Resurrected Launcher.exe"]
  },
  {
    id: "hearthstone",
    title: "Hearthstone",
    folderNames: ["Hearthstone"],
    executableNames: ["Hearthstone.exe"]
  },
  {
    id: "heroes-of-the-storm",
    title: "Heroes of the Storm",
    folderNames: ["Heroes of the Storm"],
    executableNames: ["Heroes of the Storm.exe", "HeroesSwitcher_x64.exe"]
  },
  {
    id: "overwatch",
    title: "Overwatch",
    folderNames: ["Overwatch", "Overwatch 2"],
    executableNames: ["Overwatch.exe", "Overwatch Launcher.exe"]
  },
  {
    id: "starcraft-ii",
    title: "StarCraft II",
    folderNames: ["StarCraft II"],
    executableNames: ["StarCraft II.exe", "SC2Switcher_x64.exe"]
  },
  {
    id: "warcraft-iii",
    title: "Warcraft III",
    folderNames: ["Warcraft III", "Warcraft III Beta"],
    executableNames: ["Warcraft III.exe", "Warcraft III Launcher.exe"]
  }
];

const versionDefaults = [
  {
    id: "vanilla",
    title: "Vanilla",
    version: "1.12.1",
    subtitle: "Azeroth before the Dark Portal",
    folderName: "vanilla",
    executableName: "Wow.exe",
    executablePath: "",
    workingDirectory: "",
    realmListPath: "",
    launchArgs: "",
    protonPath: "",
    compatDataPath: "",
    environment: "WINEDEBUG=-all\nDXVK_LOG_LEVEL=none",
    notes: "Original-world private server client.",
    totalPlayMs: 0,
    activeSession: null,
    lastLaunchedAt: ""
  },
  {
    id: "tbc",
    title: "The Burning Crusade",
    version: "2.4.3",
    subtitle: "Outland, arenas, and the Black Temple",
    folderName: "tbc",
    executableName: "Wow.exe",
    executablePath: "",
    workingDirectory: "",
    realmListPath: "",
    launchArgs: "",
    protonPath: "",
    compatDataPath: "",
    environment: "WINEDEBUG=-all\nDXVK_LOG_LEVEL=none",
    notes: "Burning Crusade private server client.",
    totalPlayMs: 0,
    activeSession: null,
    lastLaunchedAt: ""
  },
  {
    id: "wotlk",
    title: "Wrath of the Lich King",
    version: "3.3.5",
    subtitle: "Northrend client and addon library",
    folderName: "wotlk",
    executableName: "Wow.exe",
    executablePath: "",
    workingDirectory: "",
    realmListPath: "",
    launchArgs: "",
    protonPath: "",
    compatDataPath: "",
    environment: "WINEDEBUG=-all\nDXVK_LOG_LEVEL=none",
    notes: "Wrath client. Addons tab reads Interface/AddOns from this install.",
    addonsPath: "",
    totalPlayMs: 0,
    activeSession: null,
    lastLaunchedAt: ""
  },
  {
    id: "battle-net",
    title: "Battle.net",
    version: "Retail",
    subtitle: "Modern launcher and retail client",
    folderName: "battle-net",
    executableName: "Battle.net.exe",
    executablePath: "",
    workingDirectory: "",
    realmListPath: "",
    launchArgs: "",
    protonPath: "",
    compatDataPath: "",
    environment: "WINEDEBUG=-all\nDXVK_LOG_LEVEL=none",
    notes: "Battle.net launcher for the retail client.",
    addonsPath: "",
    totalPlayMs: 0,
    activeSession: null,
    lastLaunchedAt: ""
  }
];

let mainWindow;

function configPath() {
  return path.join(app.getPath("userData"), configFileName);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 680,
    title: "WoW Launcher - Development",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    backgroundColor: "#101217",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function cloneDefaultConfig() {
  return {
    version: 2,
    activeClientId: "wotlk",
    clients: versionDefaults.map((client) => normalizeClient(client)),
    calendar: []
  };
}

function ensureConfig() {
  const filePath = configPath();
  if (!fs.existsSync(filePath)) {
    const created = cloneDefaultConfig();
    writeConfig(created);
    return created;
  }

  try {
    return normalizeConfig(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch {
    const recovered = cloneDefaultConfig();
    writeConfig(recovered);
    return recovered;
  }
}

function normalizeConfig(config = {}) {
  const byId = new Map((Array.isArray(config.clients) ? config.clients : []).map((client) => [client.id, client]));
  const clients = versionDefaults.map((base) => normalizeClient({ ...base, ...(byId.get(base.id) || {}) }));
  const customClients = Array.isArray(config.clients)
    ? config.clients.filter((client) => client?.id && !versionDefaults.some((base) => base.id === client.id)).map(normalizeClient)
    : [];

  const allClients = [...clients, ...customClients];
  return {
    version: 2,
    activeClientId: allClients.some((client) => client.id === config.activeClientId) ? config.activeClientId : "wotlk",
    clients: allClients,
    calendar: normalizeCalendar(config.calendar)
  };
}

function normalizeId(value) {
  const id = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return id || makeId("client");
}

function normalizeClient(client = {}) {
  const id = normalizeId(client.id || client.title || "custom");
  const workingDirectory = String(client.workingDirectory || (client.executablePath ? path.dirname(client.executablePath) : ""));
  const normalized = {
    id,
    title: String(client.title || "World of Warcraft"),
    version: String(client.version || "Custom"),
    subtitle: String(client.subtitle || "Private server client"),
    folderName: String(client.folderName || id),
    executableName: String(client.executableName || "Wow.exe"),
    executablePath: String(client.executablePath || ""),
    workingDirectory,
    realmListPath: String(client.realmListPath || ""),
    launchArgs: String(client.launchArgs || ""),
    instanceCount: Math.min(8, Math.max(1, Number.parseInt(client.instanceCount, 10) || 1)),
    protonPath: String(client.protonPath || ""),
    compatDataPath: String(client.compatDataPath || ""),
    environment: String(client.environment || "WINEDEBUG=-all\nDXVK_LOG_LEVEL=none"),
    notes: String(client.notes || ""),
    customTheme: String(client.customTheme || ""),
    addonsPath: String(client.addonsPath || ""),
    totalPlayMs: Number.isFinite(Number(client.totalPlayMs)) ? Math.max(0, Number(client.totalPlayMs)) : 0,
    activeSession: normalizeSession(client.activeSession),
    lastLaunchedAt: String(client.lastLaunchedAt || "")
  };

  if (!normalized.addonsPath) {
    normalized.addonsPath = normalized.workingDirectory
      ? defaultAddonsPath(normalized.workingDirectory)
      : path.join(os.homedir(), "Games", "WoW Private Servers", normalized.folderName, "Interface", "Addons");
  }

  if (!normalized.realmListPath && normalized.workingDirectory) {
    normalized.realmListPath = defaultRealmListPath(normalized.workingDirectory);
  }

  return normalized;
}

function normalizeSession(session) {
  if (!session || typeof session !== "object") {
    return null;
  }
  const startedAt = Date.parse(session.startedAt);
  const pid = Number(session.pid);
  if (!Number.isFinite(startedAt) || !Number.isInteger(pid) || pid <= 0) {
    return null;
  }
  return {
    pid,
    startedAt: new Date(startedAt).toISOString()
  };
}

function defaultAddonsPath(clientDirectory) {
  const preferred = path.join(clientDirectory, "Interface", "Addons");
  const classic = path.join(clientDirectory, "Interface", "AddOns");
  return fs.existsSync(classic) && !fs.existsSync(preferred) ? classic : preferred;
}

function defaultRealmListPath(clientDirectory) {
  const candidates = [
    path.join(clientDirectory, "Data", "enUS", "realmlist.wtf"),
    path.join(clientDirectory, "Data", "enGB", "realmlist.wtf"),
    path.join(clientDirectory, "realmlist.wtf")
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function finalizeFinishedSessions(config = ensureConfig()) {
  let changed = false;
  const now = Date.now();
  config.clients = config.clients.map((client) => {
    const normalized = normalizeClient(client);
    if (!normalized.activeSession || processExists(normalized.activeSession.pid)) {
      return normalized;
    }
    const startedAt = Date.parse(normalized.activeSession.startedAt);
    normalized.totalPlayMs += Math.max(0, now - startedAt);
    normalized.activeSession = null;
    changed = true;
    return normalized;
  });
  if (changed) {
    writeConfig(config);
    return ensureConfig();
  }
  return config;
}

function finishSession(clientId, startedAt) {
  const config = ensureConfig();
  const finishedAt = Date.now();
  config.clients = config.clients.map((client) => {
    const normalized = normalizeClient(client);
    if (normalized.id !== clientId || !normalized.activeSession || normalized.activeSession.startedAt !== startedAt) {
      return normalized;
    }
    normalized.totalPlayMs += Math.max(0, finishedAt - Date.parse(startedAt));
    normalized.activeSession = null;
    return normalized;
  });
  writeConfig(config);
}

function normalizeCalendar(events) {
  return Array.isArray(events)
    ? events.map((event) => ({
        id: String(event.id || makeId("event")),
        date: String(event.date || ""),
        time: String(event.time || ""),
        title: String(event.title || "Server event"),
        clientId: String(event.clientId || "wotlk"),
        notes: String(event.notes || "")
      })).filter((event) => event.date && event.title)
    : [];
}

function writeConfig(config) {
  const filePath = configPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(normalizeConfig(config), null, 2)}\n`, "utf8");
}

function makeId(prefix) {
  return `${String(prefix || "item").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now().toString(36)}`;
}

function parseArgumentString(value) {
  const args = [];
  const text = String(value || "");
  let current = "";
  let quote = "";
  let escaping = false;

  for (const char of text) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === "\\") {
      escaping = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = "";
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }

  if (current) {
    args.push(current);
  }
  return args;
}

function parseEnvironment(value) {
  const env = {};
  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .forEach((line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex > 0) {
        env[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
      }
    });
  return env;
}

function protonCandidates() {
  const home = os.homedir();
  const roots = [
    path.join(home, ".steam", "steam", "steamapps", "common"),
    path.join(home, ".local", "share", "Steam", "steamapps", "common"),
    path.join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam", "steamapps", "common"),
    path.join(home, "Steam", "steamapps", "common"),
    "/mnt/games/SteamLibrary/steamapps/common",
    "/mnt/Games/SteamLibrary/steamapps/common"
  ];
  const candidates = [];

  for (const root of roots) {
    if (!fs.existsSync(root)) {
      continue;
    }
    for (const name of fs.readdirSync(root)) {
      if (/^Proton/i.test(name) || /^GE-Proton/i.test(name)) {
        const proton = path.join(root, name, "proton");
        if (fs.existsSync(proton)) {
          candidates.push(proton);
        }
      }
    }
  }

  return candidates.sort((a, b) => b.localeCompare(a));
}

function steamRootFromProton(protonPath) {
  const normalized = path.normalize(protonPath);
  const marker = `${path.sep}steamapps${path.sep}common${path.sep}`;
  const index = normalized.indexOf(marker);
  return index > 0 ? normalized.slice(0, index) : path.join(os.homedir(), ".steam", "steam");
}

function waitForSpawn(child) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      child.off("spawn", handleSpawn);
      child.off("error", handleError);
    };
    const handleSpawn = () => {
      cleanup();
      resolve();
    };
    const handleError = (error) => {
      cleanup();
      reject(error);
    };

    child.once("spawn", handleSpawn);
    child.once("error", handleError);
  });
}

async function launchClient(client) {
  const normalized = normalizeClient(client);
  if (!normalized.executablePath) {
    throw new Error("Choose this WoW version's executable first.");
  }
  if (!fs.existsSync(normalized.executablePath)) {
    throw new Error(`Executable not found: ${normalized.executablePath}`);
  }

  const protonPath = normalized.protonPath || protonCandidates()[0];
  if (!protonPath || !fs.existsSync(protonPath)) {
    throw new Error("Steam Proton was not found. Choose a Proton script from a Steam Proton install.");
  }

  const cwd = normalized.workingDirectory || path.dirname(normalized.executablePath);
  const compatDataPath = normalized.compatDataPath || path.join(app.getPath("userData"), "proton-prefixes", normalized.id);
  fs.mkdirSync(compatDataPath, { recursive: true });

  const env = {
    ...process.env,
    ...parseEnvironment(normalized.environment),
    STEAM_COMPAT_CLIENT_INSTALL_PATH: steamRootFromProton(protonPath),
    STEAM_COMPAT_DATA_PATH: compatDataPath,
    SteamAppId: "0",
    SteamGameId: "0"
  };

  const instanceCount = Math.min(8, Math.max(1, Number.parseInt(normalized.instanceCount, 10) || 1));
  const launchedAt = new Date().toISOString();
  const pids = [];
  for (let index = 0; index < instanceCount; index += 1) {
    const child = spawn(protonPath, ["run", normalized.executablePath, ...parseArgumentString(normalized.launchArgs)], {
      cwd,
      env,
      detached: true,
      stdio: "ignore"
    });
    await waitForSpawn(child);
    pids.push(child.pid);
    child.once("exit", () => finishSession(normalized.id, launchedAt));
    child.unref();
  }
  return { pid: pids[0], pids, instanceCount, launchedAt, protonPath, compatDataPath };
}

function uniqueExistingDirectories(directories) {
  return [...new Set(directories.filter(Boolean).map((directory) => path.normalize(directory)))]
    .filter((directory) => fs.existsSync(directory));
}

function battleNetSearchRoots(client) {
  const normalized = normalizeClient(client);
  const roots = [];
  const executableDirectory = normalized.executablePath ? path.dirname(normalized.executablePath) : "";
  const configuredDirectory = normalized.workingDirectory || executableDirectory;

  if (configuredDirectory) {
    roots.push(configuredDirectory);
    roots.push(path.dirname(configuredDirectory));
    roots.push(path.dirname(path.dirname(configuredDirectory)));
  }

  if (executableDirectory) {
    roots.push(executableDirectory);
    roots.push(path.dirname(executableDirectory));
  }

  const home = os.homedir();
  roots.push(
    path.join(home, "Games"),
    path.join(home, "games"),
    path.join(home, ".local", "share", "Steam", "steamapps", "compatdata"),
    path.join(home, ".steam", "steam", "steamapps", "compatdata"),
    "/mnt/games",
    "/mnt/Games"
  );

  return uniqueExistingDirectories(roots);
}

function findKnownBattleNetGames(client) {
  const roots = battleNetSearchRoots(client);
  const games = new Map();

  for (const root of roots) {
    for (const definition of battleNetGameDefinitions) {
      for (const folderName of definition.folderNames) {
        const folder = path.join(root, folderName);
        if (!fs.existsSync(folder)) {
          continue;
        }

        const candidates = [
          ...(definition.relativeExecutables || []).map((relativePath) => path.join(folder, relativePath)),
          ...definition.executableNames.map((executableName) => path.join(folder, executableName))
        ];
        const executablePath = candidates.find((candidate) => fs.existsSync(candidate));
        if (!executablePath) {
          continue;
        }

        const gameId = `${definition.id}:${path.normalize(executablePath)}`;
        if (!games.has(gameId)) {
          games.set(gameId, {
            id: gameId,
            title: definition.title,
            executablePath,
            workingDirectory: path.dirname(executablePath),
            installDirectory: folder,
            source: "Known Blizzard install"
          });
        }
      }
    }
  }

  return [...games.values()].sort((a, b) => a.title.localeCompare(b.title));
}

async function launchBattleNetGame(client, game) {
  const normalized = normalizeClient(client);
  const executablePath = String(game?.executablePath || "");
  if (!executablePath || !fs.existsSync(executablePath)) {
    throw new Error("Installed game executable was not found.");
  }

  const protonPath = normalized.protonPath || protonCandidates()[0];
  if (!protonPath || !fs.existsSync(protonPath)) {
    throw new Error("Steam Proton was not found. Choose a Proton script from the Battle.net client setup.");
  }

  const compatDataPath = normalized.compatDataPath || path.join(app.getPath("userData"), "proton-prefixes", normalized.id);
  fs.mkdirSync(compatDataPath, { recursive: true });

  const env = {
    ...process.env,
    ...parseEnvironment(normalized.environment),
    STEAM_COMPAT_CLIENT_INSTALL_PATH: steamRootFromProton(protonPath),
    STEAM_COMPAT_DATA_PATH: compatDataPath,
    SteamAppId: "0",
    SteamGameId: "0"
  };

  const child = spawn(protonPath, ["run", executablePath], {
    cwd: String(game?.workingDirectory || path.dirname(executablePath)),
    env,
    detached: true,
    stdio: "ignore"
  });
  await waitForSpawn(child);
  child.unref();

  return {
    pid: child.pid,
    launchedAt: new Date().toISOString(),
    protonPath,
    compatDataPath,
    executablePath
  };
}

function detectClients() {
  const home = os.homedir();
  const roots = [
    path.join(home, "Games", "WoW Private Servers"),
    path.join(home, "Games"),
    path.join(home, "games"),
    "/mnt/games",
    "/mnt/Games"
  ];
  const found = {};

  for (const root of roots) {
    for (const base of versionDefaults) {
      const folder = path.join(root, base.folderName);
      const exe = path.join(folder, base.executableName || "Wow.exe");
      if (fs.existsSync(exe)) {
        found[base.id] = {
          executablePath: exe,
          workingDirectory: folder,
          realmListPath: defaultRealmListPath(folder),
          addonsPath: defaultAddonsPath(folder)
        };
      }
    }
  }

  return found;
}

function addonEntries(addonsPath) {
  const resolvedPath = resolveAddonsPath(addonsPath);

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return [];
  }

  return fs.readdirSync(resolvedPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(resolvedPath, entry.name);
      const stat = fs.statSync(fullPath);
      const toc = fs.readdirSync(fullPath).find((file) => file.toLowerCase().endsWith(".toc"));
      return {
        name: entry.name,
        path: fullPath,
        modifiedAt: stat.mtime.toISOString(),
        toc: toc ? path.join(fullPath, toc) : ""
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readTgaPixels(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 18) {
    throw new Error("Invalid TGA header.");
  }

  const idLength = buffer[0];
  const colorMapType = buffer[1];
  const imageType = buffer[2];
  const width = buffer.readUInt16LE(12);
  const height = buffer.readUInt16LE(14);
  const bitsPerPixel = buffer[16];
  const descriptor = buffer[17];
  const bytesPerPixel = bitsPerPixel / 8;
  const isRle = imageType === 10 || imageType === 11;
  const isTrueColor = imageType === 2 || imageType === 10;
  const isGrayscale = imageType === 3 || imageType === 11;

  if (colorMapType !== 0 || !width || !height || (!isTrueColor && !isGrayscale)) {
    throw new Error("Unsupported TGA format.");
  }
  if ((isTrueColor && bytesPerPixel !== 3 && bytesPerPixel !== 4) || (isGrayscale && bytesPerPixel !== 1)) {
    throw new Error("Unsupported TGA pixel depth.");
  }

  let offset = 18 + idLength;
  const pixelCount = width * height;
  const pixels = Buffer.alloc(pixelCount * 4);
  const topOrigin = Boolean(descriptor & 0x20);

  function writePixel(pixelIndex, pixelOffset) {
    const sourceY = Math.floor(pixelIndex / width);
    const sourceX = pixelIndex % width;
    const targetY = topOrigin ? sourceY : height - 1 - sourceY;
    const target = ((targetY * width) + sourceX) * 4;

    if (isGrayscale) {
      const value = buffer[pixelOffset];
      pixels[target] = value;
      pixels[target + 1] = value;
      pixels[target + 2] = value;
      pixels[target + 3] = 255;
      return;
    }

    pixels[target] = buffer[pixelOffset + 2];
    pixels[target + 1] = buffer[pixelOffset + 1];
    pixels[target + 2] = buffer[pixelOffset];
    pixels[target + 3] = bytesPerPixel === 4 ? buffer[pixelOffset + 3] : 255;
  }

  let pixelIndex = 0;
  while (pixelIndex < pixelCount) {
    if (!isRle) {
      writePixel(pixelIndex, offset);
      offset += bytesPerPixel;
      pixelIndex += 1;
      continue;
    }

    const packet = buffer[offset++];
    const count = (packet & 0x7f) + 1;
    if (packet & 0x80) {
      const pixelOffset = offset;
      offset += bytesPerPixel;
      for (let i = 0; i < count && pixelIndex < pixelCount; i += 1) {
        writePixel(pixelIndex, pixelOffset);
        pixelIndex += 1;
      }
    } else {
      for (let i = 0; i < count && pixelIndex < pixelCount; i += 1) {
        writePixel(pixelIndex, offset);
        offset += bytesPerPixel;
        pixelIndex += 1;
      }
    }
  }

  return { width, height, pixels };
}

function bmpBufferFromTga(filePath) {
  const { width, height, pixels } = readTgaPixels(filePath);
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const bmp = Buffer.alloc(fileSize);

  bmp.write("BM", 0);
  bmp.writeUInt32LE(fileSize, 2);
  bmp.writeUInt32LE(54, 10);
  bmp.writeUInt32LE(40, 14);
  bmp.writeInt32LE(width, 18);
  bmp.writeInt32LE(height, 22);
  bmp.writeUInt16LE(1, 26);
  bmp.writeUInt16LE(24, 28);
  bmp.writeUInt32LE(pixelDataSize, 34);

  for (let y = 0; y < height; y += 1) {
    const bmpRow = 54 + ((height - 1 - y) * rowSize);
    for (let x = 0; x < width; x += 1) {
      const source = ((y * width) + x) * 4;
      const target = bmpRow + (x * 3);
      bmp[target] = pixels[source + 2];
      bmp[target + 1] = pixels[source + 1];
      bmp[target + 2] = pixels[source];
    }
  }

  return bmp;
}

function cachedBmpUrlFromTga(filePath, stat) {
  const cacheKey = crypto
    .createHash("sha1")
    .update(`${filePath}:${stat.mtimeMs}:${stat.size}`)
    .digest("hex");
  const cacheDirectory = path.join(app.getPath("userData"), "screenshot-cache");
  const cachePath = path.join(cacheDirectory, `${cacheKey}.bmp`);

  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cacheDirectory, { recursive: true });
    fs.writeFileSync(cachePath, bmpBufferFromTga(filePath));
  }

  return pathToFileURL(cachePath).href;
}

function screenshotEntries(screenshotsPath) {
  if (!screenshotsPath || !fs.existsSync(screenshotsPath)) {
    return [];
  }
  const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tga"]);
  return fs.readdirSync(screenshotsPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && supported.has(path.extname(entry.name).toLowerCase()))
    .flatMap((entry) => {
      const fullPath = path.join(screenshotsPath, entry.name);
      const stat = fs.statSync(fullPath);
      const extension = path.extname(entry.name).toLowerCase();
      try {
        return [{
          name: entry.name,
          path: fullPath,
          url: extension === ".tga" ? cachedBmpUrlFromTga(fullPath, stat) : pathToFileURL(fullPath).href,
          modifiedAt: stat.mtime.toISOString()
        }];
      } catch (error) {
        console.warn(`Unable to prepare screenshot preview for ${fullPath}:`, error.message);
        return [];
      }
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

function resolveAddonsPath(addonsPath) {
  if (!addonsPath) {
    return "";
  }
  if (fs.existsSync(addonsPath)) {
    return addonsPath;
  }
  if (path.basename(addonsPath).toLowerCase() === "addons") {
    const parent = path.dirname(addonsPath);
    const candidates = [path.join(parent, "AddOns"), path.join(parent, "Addons")];
    return candidates.find((candidate) => fs.existsSync(candidate)) || addonsPath;
  }
  return addonsPath;
}

function resolveRealmlistPath(client) {
  const normalized = normalizeClient(client);
  if (normalized.realmListPath) {
    return normalized.realmListPath;
  }
  const clientDirectory = normalized.workingDirectory || (normalized.executablePath ? path.dirname(normalized.executablePath) : "");
  if (!clientDirectory) {
    throw new Error("Choose a client executable before editing realmlist.wtf.");
  }
  return defaultRealmListPath(clientDirectory);
}

function clearClientCache(client) {
  const normalized = normalizeClient(client);
  const clientDirectory = normalized.workingDirectory || (normalized.executablePath ? path.dirname(normalized.executablePath) : "");
  if (!clientDirectory) {
    throw new Error("Choose a client executable or working folder before clearing cache.");
  }

  const cachePath = path.join(clientDirectory, "WDB");
  if (!fs.existsSync(cachePath)) {
    return { path: cachePath, removed: false };
  }

  try {
    fs.rmSync(cachePath, { recursive: true, force: false });
  } catch (error) {
    if (error.code === "EACCES" || error.code === "EPERM") {
      throw new Error(`Cache folder requires elevated rights to delete: ${cachePath}`);
    }
    throw error;
  }
  return { path: cachePath, removed: true };
}

ipcMain.handle("state:get", () => ({
  platform: process.platform,
  configPath: configPath(),
  config: finalizeFinishedSessions(),
  detected: detectClients(),
  protonCandidates: protonCandidates()
}));

ipcMain.handle("client:save", (_event, client) => {
  const config = ensureConfig();
  const normalized = normalizeClient(client);
  const index = config.clients.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    config.clients[index] = normalized;
  } else {
    config.clients.push(normalized);
  }
  config.activeClientId = normalized.id;
  writeConfig(config);
  return ensureConfig();
});

ipcMain.handle("client:create", (_event, client) => {
  const config = ensureConfig();
  const title = String(client?.title || "").trim() || "Custom Client";
  const version = String(client?.version || "").trim() || "Custom";
  const idBase = normalizeId(client?.id || `${title}-${version}`);
  let id = idBase;
  let counter = 2;
  while (config.clients.some((item) => item.id === id)) {
    id = `${idBase}-${counter}`;
    counter += 1;
  }
  const normalized = normalizeClient({
    ...client,
    id,
    title,
    version,
    subtitle: client?.subtitle || "Custom private server client",
    folderName: client?.folderName || id,
    notes: client?.notes || "Custom private server client.",
    customTheme: client?.customTheme || customThemes[config.clients.filter((item) => !versionDefaults.some((base) => base.id === item.id)).length % customThemes.length]
  });
  config.clients.push(normalized);
  config.activeClientId = normalized.id;
  writeConfig(config);
  return ensureConfig();
});

ipcMain.handle("client:delete", (_event, clientId) => {
  const id = String(clientId || "");
  if (versionDefaults.some((client) => client.id === id)) {
    throw new Error("Built-in clients cannot be deleted.");
  }
  const config = ensureConfig();
  const nextClients = config.clients.filter((client) => client.id !== id);
  if (nextClients.length === config.clients.length) {
    throw new Error("Client not found.");
  }
  config.clients = nextClients;
  if (config.activeClientId === id) {
    config.activeClientId = config.clients[0]?.id || "wotlk";
  }
  writeConfig(config);
  return ensureConfig();
});

ipcMain.handle("client:set-active", (_event, clientId) => {
  const config = ensureConfig();
  config.activeClientId = clientId;
  writeConfig(config);
  return ensureConfig();
});

ipcMain.handle("client:launch", async (_event, client) => {
  const result = await launchClient(client);
  const config = ensureConfig();
  config.clients = config.clients.map((item) => (
    item.id === client.id ? normalizeClient({
      ...client,
      ...result,
      lastLaunchedAt: result.launchedAt,
      activeSession: {
        pid: result.pid,
        startedAt: result.launchedAt
      }
    }) : item
  ));
  config.activeClientId = client.id;
  writeConfig(config);
  return { ...result, config: ensureConfig() };
});

ipcMain.handle("battle-net:games", (_event, client) => findKnownBattleNetGames(client));
ipcMain.handle("battle-net:launch-game", (_event, client, game) => launchBattleNetGame(client, game));

ipcMain.handle("realmlist:read", (_event, client) => {
  const realmListPath = resolveRealmlistPath(client);
  if (!fs.existsSync(realmListPath)) {
    return { path: realmListPath, content: "" };
  }
  return { path: realmListPath, content: fs.readFileSync(realmListPath, "utf8") };
});

ipcMain.handle("realmlist:write", (_event, client, content) => {
  const realmListPath = resolveRealmlistPath(client);
  fs.mkdirSync(path.dirname(realmListPath), { recursive: true });
  fs.writeFileSync(realmListPath, `${String(content || "").trim()}\n`, "utf8");

  const config = ensureConfig();
  config.clients = config.clients.map((item) => (
    item.id === client.id ? normalizeClient({ ...client, realmListPath }) : item
  ));
  writeConfig(config);
  return { path: realmListPath, config: ensureConfig() };
});

ipcMain.handle("dialog:pick-executable", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose Wow.exe",
    properties: ["openFile"],
    filters: [
      { name: "Windows executables", extensions: ["exe"] },
      { name: "All files", extensions: ["*"] }
    ]
  });
  return result.canceled ? "" : result.filePaths[0];
});

ipcMain.handle("dialog:pick-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose folder",
    properties: ["openDirectory"]
  });
  return result.canceled ? "" : result.filePaths[0];
});

ipcMain.handle("calendar:save", (_event, event) => {
  const config = ensureConfig();
  const normalized = normalizeCalendar([{ ...event, id: event.id || makeId("event") }])[0];
  if (!normalized) {
    throw new Error("Calendar event needs a date and title.");
  }
  const index = config.calendar.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    config.calendar[index] = normalized;
  } else {
    config.calendar.push(normalized);
  }
  writeConfig(config);
  return ensureConfig();
});

ipcMain.handle("calendar:delete", (_event, eventId) => {
  const config = ensureConfig();
  config.calendar = config.calendar.filter((event) => event.id !== eventId);
  writeConfig(config);
  return ensureConfig();
});

ipcMain.handle("addons:list", (_event, addonsPath) => addonEntries(addonsPath));
ipcMain.handle("addons:resolve-path", (_event, addonsPath) => resolveAddonsPath(addonsPath));
ipcMain.handle("screenshots:list", (_event, screenshotsPath) => screenshotEntries(screenshotsPath));
ipcMain.handle("client:clear-cache", (_event, client) => clearClientCache(client));

ipcMain.handle("shell:open-path", (_event, targetPath) => (targetPath ? shell.openPath(targetPath) : ""));
ipcMain.handle("shell:show-item", (_event, targetPath) => {
  if (targetPath) {
    shell.showItemInFolder(targetPath);
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
