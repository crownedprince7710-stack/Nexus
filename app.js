
/* =========================================
   PROJECT NEXUS 1.0
   Browser-based personal desktop
========================================= */

const $ = (id) => document.getElementById(id);

const APPS = {
  explorer:   { name: "File Explorer", icon: "📁" },
  notes:      { name: "Notes", icon: "📝" },
  calculator: { name: "Calculator", icon: "🧮" },
  browser:    { name: "Browser", icon: "🌐" },
  settings:   { name: "Settings", icon: "⚙️" },
  library:    { name: "App Library", icon: "▦" },
  calendar:   { name: "Calendar", icon: "📅" },
  about:      { name: "About NEXUS", icon: "◈" }
};

const DEFAULT_STATE = {
  entered: false,
  accent: "#f04455",
  wallpaper: "default",
  notes: "",
  files: [],
  installed: ["explorer","notes","calculator","browser","settings","library","calendar","about"],
  session: [],
  lastId: 0
};

let state = { ...DEFAULT_STATE };
let windows = new Map();
let activeWindow = null;
let zIndex = 10;
let drag = null;

/* ---------- STORAGE ---------- */

function loadState() {
  try {
    const saved = localStorage.getItem("nexus_state");
    if (saved) state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
  } catch (error) {
    console.warn("NEXUS storage could not be read:", error);
    state = { ...DEFAULT_STATE };
  }
}

function saveState() {
  try {
    state.session = [...windows.values()].map(w => ({
      app: w.app,
      id: w.id,
      minimized: w.minimized,
      maximised: w.maximised,
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height
    }));
    localStorage.setItem("nexus_state", JSON.stringify(state));
  } catch (error) {
    console.warn("NEXUS could not save. Browser storage may be full.", error);
    showToast("Could not save. Export a backup or free browser storage.");
  }
}

function showToast(message) {
  let toast = $("nexusToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "nexusToast";
    toast.style.cssText = `
      position:fixed;z-index:9999;bottom:75px;left:50%;
      transform:translateX(-50%);padding:12px 18px;
      border:1px solid var(--line);border-radius:8px;
      background:#171d2c;color:white;font-size:12px;
      box-shadow:0 10px 30px #0008;max-width:90vw;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.style.display = "none", 2600);
}

/* ---------- DESKTOP STARTUP ---------- */

function applySettings() {
  document.documentElement.style.setProperty("--accent", state.accent);
  const rgb = hexToRgb(state.accent);
  document.documentElement.style.setProperty("--accent-rgb", `${rgb.r},${rgb.g},${rgb.b}`);

  const wallpapers = {
    default: `radial-gradient(ellipse at 75% 25%,#46265388,transparent 45%),
              radial-gradient(ellipse at 20% 80%,#14416988,transparent 50%),
              linear-gradient(135deg,#090d19,#111627 55%,#090b13)`,
    ocean: `radial-gradient(ellipse at 70% 30%,#087caa88,transparent 45%),
            linear-gradient(135deg,#031522,#092f48,#06101e)`,
    purple: `radial-gradient(ellipse at 65% 25%,#8144aa88,transparent 45%),
             linear-gradient(135deg,#10091d,#26133b,#090b13)`,
    red: `radial-gradient(ellipse at 70% 25%,#a5233588,transparent 45%),
          linear-gradient(135deg,#18090e,#36121c,#090b13)`,
    minimal: `linear-gradient(135deg,#171b24,#303744,#11151d)`
  };
  document.querySelector(".desktop-wallpaper").style.background =
    wallpapers[state.wallpaper] || wallpapers.default;
}

function enterDesktop() {
  state.entered = true;
  $("welcomeScreen").classList.add("hidden");
  $("desktop").classList.remove("hidden");
  renderStartApps();
  applySettings();
  updateClock();
  saveState();

  if (windows.size === 0 && state.session?.length) {
    state.session.forEach(item => {
      if (state.installed.includes(item.app)) {
        openApp(item.app, item);
      }
    });
  }
}

function restartWelcome() {
  Object.keys(APPS).forEach(app => closeApp(app, true));
  state.session = [];
  saveState();
  $("desktop").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");
}

/* ---------- WINDOW MANAGER ---------- */

function openApp(app, restore = null) {
  if (!APPS[app]) return;

  if (windows.has(app)) {
    const existing = windows.get(app);
    if (existing.minimized) {
      existing.element.classList.remove("hidden");
      existing.minimized = false;
    }
    focusWindow(app);
    saveState();
    return;
  }

  const id = `window-${++state.lastId}`;
  const win = document.createElement("section");
  win.className = "nexus-window";
  win.dataset.app = app;
  win.id = id;
  win.style.zIndex = ++zIndex;

  const titlebar = document.createElement("div");
  titlebar.className = "window-titlebar";
  titlebar.innerHTML = `
    <div class="window-title">${APPS[app].icon} &nbsp; ${APPS[app].name}</div>
    <div class="window-controls">
      <button data-window-action="minimise" title="Minimise">−</button>
      <button data-window-action="maximise" title="Maximise">□</button>
      <button data-window-action="close" title="Close">×</button>
    </div>
  `;

  const content = document.createElement("div");
  content.className = "window-content";
  content.innerHTML = appContent(app);

  win.append(titlebar, content);
  $("windowArea").appendChild(win);

  const info = {
    app, id, element: win, content, minimized: false,
    maximised: false, x: null, y: null, width: null, height: null
  };

  windows.set(app, info);
  titlebar.addEventListener("pointerdown", e => startDrag(e, info));
  win.addEventListener("pointerdown", () => focusWindow(app));
  win.querySelectorAll("[data-window-action]").forEach(button => {
    button.addEventListener("click", e => {
      e.stopPropagation();
      const action = button.dataset.windowAction;
      if (action === "close") closeApp(app);
      if (action === "minimise") minimiseApp(app);
      if (action === "maximise") maximiseApp(app);
    });
  });

  renderTaskbar();
  focusWindow(app);
  bindApp(app, content);
  if (restore) restoreWindow(info, restore);
  saveState();
}

function focusWindow(app) {
  const win = windows.get(app);
  if (!win) return;
  activeWindow = app;
  win.element.style.zIndex = ++zIndex;
  renderTaskbar();
}

function minimiseApp(app) {
  const win = windows.get(app);
  if (!win) return;
  win.element.classList.add("hidden");
  win.minimized = true;
  if (activeWindow === app) activeWindow = null;
  renderTaskbar();
  saveState();
}

function maximiseApp(app) {
  const win = windows.get(app);
  if (!win) return;
  if (!win.maximised) {
    win.x = win.element.style.left;
    win.y = win.element.style.top;
    win.width = win.element.style.width;
    win.height = win.element.style.height;
    win.element.classList.add("maximised");
    win.maximised = true;
  } else {
    win.element.classList.remove("maximised");
    win.element.style.left = win.x || "";
    win.element.style.top = win.y || "";
    win.element.style.width = win.width || "";
    win.element.style.height = win.height || "";
    win.maximised = false;
  }
  saveState();
}

function closeApp(app, silent = false) {
  const win = windows.get(app);
  if (!win) return;
  win.element.remove();
  windows.delete(app);
  if (activeWindow === app) activeWindow = null;
  renderTaskbar();
  if (!silent) saveState();
}

function restoreWindow(info, data) {
  if (data.maximised) {
    info.element.classList.add("maximised");
    info.maximised = true;
  }
  if (data.minimized) {
    info.element.classList.add("hidden");
    info.minimized = true;
  }
  if (data.width) info.element.style.width = data.width;
  if (data.height) info.element.style.height = data.height;
  if (data.x) info.element.style.left = data.x;
  if (data.y) info.element.style.top = data.y;
}

function startDrag(event, info) {
  if (event.target.closest(".window-controls")) return;
  if (info.maximised) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  drag = {
    info, startX: event.clientX, startY: event.clientY,
    left: info.element.offsetLeft, top: info.element.offsetTop
  };
  info.element.style.transform = "none";
  info.element.style.left = `${drag.left}px`;
  info.element.style.top = `${drag.top}px`;
  info.element.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

document.addEventListener("pointermove", event => {
  if (!drag) return;
  const { info, startX, startY, left, top } = drag;
  const area = $("windowArea").getBoundingClientRect();
  const maxLeft = Math.max(0, area.width - info.element.offsetWidth);
  const maxTop = Math.max(0, area.height - 65);
  info.element.style.left = `${Math.max(0, Math.min(maxLeft, left + event.clientX - startX))}px`;
  info.element.style.top = `${Math.max(0, Math.min(maxTop, top + event.clientY - startY))}px`;
});

document.addEventListener("pointerup", () => {
  if (drag) {
    const { info } = drag;
    info.x = info.element.style.left;
    info.y = info.element.style.top;
    drag = null;
    saveState();
  }
});

function renderTaskbar() {
  const container = $("taskApps");
  container.innerHTML = "";
  windows.forEach((win, app) => {
    const button = document.createElement("button");
    button.className = `task-app ${activeWindow === app && !win.minimized ? "active" : ""}`;
    button.title = APPS[app].name;
    button.textContent = APPS[app].icon;
    button.addEventListener("click", () => {
      if (win.minimized || activeWindow === app) {
        win.element.classList.toggle("hidden");
        win.minimized = win.element.classList.contains("hidden");
        if (!win.minimized) focusWindow(app);
      } else focusWindow(app);
      renderTaskbar();
      saveState();
    });
    container.appendChild(button);
  });
}

/* ---------- APPLICATION CONTENT ---------- */

function appContent(app) {
  switch (app) {
    case "explorer":
      return `
        <h2>NEXUS Drive</h2>
        <p>Your personal virtual storage space.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0">
          <button class="app-button" data-action="new-file">＋ New text file</button>
          <button class="secondary-button" data-action="export-files">Export files</button>
        </div>
        <div class="file-grid" id="fileGrid"></div>
      `;

    case "notes":
      return `
        <h2>Quick Notes</h2>
        <p>Your notes save automatically in this browser.</p>
        <textarea class="app-textarea" id="notesArea" placeholder="Write something..."></textarea>
        <small id="notesStatus" style="color:var(--muted)">Auto-save enabled</small>
      `;

    case "calculator":
      return `
        <h2>Calculator</h2>
        <input class="calc-display" id="calcDisplay" value="0" readonly>
        <div class="calc-grid">
          ${["AC","⌫","%","÷","7","8","9","×","4","5","6","−","1","2","3","+","±","0",".","="]
            .map((key,i) => `<button class="${[3,7,11,15,19].includes(i) ? "operator" : ""}" data-calc="${key}">${key}</button>`).join("")}
        </div>
      `;

    case "browser":
      return `
        <h2>NEXUS Browser</h2>
        <p>Open websites inside this window. Some websites block embedded viewing.</p>
        <form id="browserForm" class="browser-bar">
          <input class="app-input" id="browserAddress" value="https://www.google.com" placeholder="Enter website address">
          <button class="app-button">GO</button>
        </form>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:7px 0 12px">
          <button class="secondary-button" data-url="https://vscode.dev">VS Code Web</button>
          <button class="secondary-button" data-url="https://www.wikipedia.org">Wikipedia</button>
        </div>
        <iframe class="browser-frame" id="browserFrame" title="NEXUS Browser"
          referrerpolicy="no-referrer" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-downloads"></iframe>
        <p>If a website refuses to load here, use the open-in-new-tab button.</p>
        <button class="secondary-button" data-action="external-browser">Open in new tab ↗</button>
      `;

    case "settings":
      return `
        <h2>Personalisation</h2>
        <p>Make this desktop your own.</p>
        <div class="setting-row">
          <div><strong>Accent colour</strong><small>Change NEXUS highlights</small></div>
          <div class="color-options">
            ${["#f04455","#398cff","#9b65e8","#12b981","#e99b36","#e75ab4"].map(c =>
              `<button class="color-choice" style="background:${c}" data-color="${c}" title="${c}"></button>`).join("")}
          </div>
        </div>
        <div class="setting-row">
          <div><strong>Desktop wallpaper</strong><small>Choose your background</small></div>
          <select class="app-select" id="wallpaperSelect" style="width:130px">
            <option value="default">NEXUS</option><option value="ocean">Ocean</option>
            <option value="purple">Purple</option><option value="red">Red</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        <div class="setting-row">
          <div><strong>Backup workspace</strong><small>Save your data to a file</small></div>
          <button class="app-button" data-action="backup">Export</button>
        </div>
        <div class="setting-row">
          <div><strong>Restore workspace</strong><small>Load a previous backup</small></div>
          <button class="secondary-button" data-action="restore">Import</button>
        </div>
        <div class="setting-row">
          <div><strong>Reset NEXUS</strong><small>Erase saved settings and files</small></div>
          <button class="secondary-button" data-action="reset">Reset</button>
        </div>
      `;

    case "library":
      return `
        <h2>Application Library</h2>
        <p>Applications available in NEXUS.</p>
        <div class="file-grid">
          ${Object.entries(APPS).map(([key,app]) => `
            <div class="file-item">
              <span>${app.icon}</span>${app.name}
              <button class="secondary-button" data-library="${key}" style="margin-top:9px">
                ${state.installed.includes(key) ? "Open" : "Install"}
              </button>
            </div>`).join("")}
        </div>
      `;

    case "calendar":
      return `
        <h2>Calendar</h2>
        <p>Today's date</p>
        <div style="font-size:38px;font-weight:800;color:var(--accent)" id="calendarDate"></div>
        <p id="calendarFullDate"></p>
        <p>Calendar events and cloud syncing can be added in a future NEXUS update.</p>
      `;

    case "about":
      return `
        <h2>PROJECT NEXUS</h2>
        <p>Your personal digital space.</p>
        <div class="control-card"><span>◈</span><div><strong>NEXUS WEB DESKTOP</strong><small>Version 1.0 · Browser edition</small></div></div>
        <p>NEXUS is a customisable desktop environment that runs inside your web browser.</p>
        <p>It includes a virtual drive, app windows, desktop personalisation and local workspace storage.</p>
        <p><strong>Note:</strong> It cannot replace your device operating system or directly install native applications.</p>
      `;

    default:
      return `<h2>Application unavailable</h2>`;
  }
}

/* ---------- APPLICATION EVENTS ---------- */

function bindApp(app, content) {
  if (app === "notes") {
    const area = content.querySelector("#notesArea");
    area.value = state.notes || "";
    area.addEventListener("input", () => {
      state.notes = area.value;
      saveState();
      content.querySelector("#notesStatus").textContent = "Saved";
    });
  }

  if (app === "explorer") renderFiles(content);

  if (app === "calculator") bindCalculator(content);

  if (app === "settings") {
    content.querySelectorAll("[data-color]").forEach(button => {
      button.addEventListener("click", () => {
        state.accent = button.dataset.color;
        applySettings();
        saveState();
        showToast("Accent colour updated");
      });
    });
    const select = content.querySelector("#wallpaperSelect");
    select.value = state.wallpaper;
    select.addEventListener("change", () => {
      state.wallpaper = select.value;
      applySettings();
      saveState();
    });
  }

  if (app === "browser") {
    const form = content.querySelector("#browserForm");
    const address = content.querySelector("#browserAddress");
    const frame = content.querySelector("#browserFrame");
    const navigate = url => {
      let value = url.trim();
      if (!value) return;
      if (!/^https?:\/\//i.test(value)) value = "https://" + value;
      try {
        const parsed = new URL(value);
        if (!["http:","https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
        address.value = parsed.href;
        frame.src = parsed.href;
      } catch {
        showToast("Please enter a valid website address.");
      }
    };
    form.addEventListener("submit", e => {
      e.preventDefault();
      navigate(address.value);
    });
    content.querySelectorAll("[data-url]").forEach(button => {
      button.addEventListener("click", () => navigate(button.dataset.url));
    });
    content.querySelector('[data-action="external-browser"]').addEventListener("click", () => {
      let value = address.value.trim();
      if (!/^https?:\/\//i.test(value)) value = "https://" + value;
      try {
        const url = new URL(value);
        if (["http:","https:"].includes(url.protocol)) window.open(url.href, "_blank", "noopener");
      } catch { showToast("Invalid website address."); }
    });
  }

  if (app === "calendar") {
    const now = new Date();
    content.querySelector("#calendarDate").textContent = now.getDate();
    content.querySelector("#calendarFullDate").textContent =
      now.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  }

  content.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => handleAction(button.dataset.action, content));
  });

  content.querySelectorAll("[data-library]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.library;
      if (state.installed.includes(key)) {
        openApp(key);
      } else {
        state.installed.push(key);
        saveState();
        showToast(`${APPS[key].name} installed`);
        closeApp("library");
        openApp("library");
        renderStartApps();
      }
    });
  });
}

/* ---------- VIRTUAL FILE SYSTEM ---------- */


  
   
function renderFiles(content) {
  const grid = content.querySelector("#fileGrid");
  grid.innerHTML = "";

  if (!state.files.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <span>📂</span>
        Your NEXUS Drive is empty.<br>
        Create your first text file.
      </div>`;
    return;
  }

  state.files.forEach(file => {
    const item = document.createElement("button");
    item.className = "file-item";
    item.innerHTML = `<span>📄</span>${escapeHTML(file.name)}`;

    item.addEventListener("dblclick", () => {
      const editor = document.createElement("div");
      editor.innerHTML = `
        <h2>${escapeHTML(file.name)}</h2>
        <textarea class="app-textarea" id="fileEditor"></textarea>
        <button class="app-button" id="saveFile">Save file</button>
        <button class="secondary-button" id="backFiles">Back</button>
      `;

      grid.replaceWith(editor);
      const area = editor.querySelector("#fileEditor");
      area.value = file.content;

      editor.querySelector("#saveFile").addEventListener("click", () => {
        file.content = area.value;
        saveState();
        showToast("File saved");
        closeApp("explorer");
        openApp("explorer");
      });

      editor.querySelector("#backFiles").addEventListener("click", () => {
        closeApp("explorer");
        openApp("explorer");
      });
    });

    item.addEventListener("contextmenu", e => {
      e.preventDefault();
      const choice = prompt(
        `File: ${file.name}\nType R to rename or D to delete:`
      );

      if (!choice) return;

      if (choice.toLowerCase() === "r") {
        const name = prompt("New file name:", file.name);
        if (name && name.trim()) file.name = name.trim();
      } else if (choice.toLowerCase() === "d") {
        if (confirm(`Delete ${file.name}?`)) {
          state.files = state.files.filter(f => f.id !== file.id);
        }
      }

      saveState();
      renderFiles(content);
    });

    grid.appendChild(item);
  });
}


function createFile() {
  const name = prompt("Enter a file name:", "New document.txt");
  if (!name || !name.trim()) return;
  state.files.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: name.trim(),
    content: ""
  });
  saveState();
  closeApp("explorer");
  openApp("explorer");
}

function exportFiles() {
  downloadFile("nexus-drive.json", JSON.stringify(state.files, null, 2), "application/json");
}

/* ---------- CALCULATOR ---------- */

function bindCalculator(content) {
  let expression = "";
  const display = content.querySelector("#calcDisplay");
  content.querySelectorAll("[data-calc]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.calc;
      if (key === "AC") expression = "";
      else if (key === "⌫") expression = expression.slice(0, -1);
      else if (key === "=") {
        try {
          const safe = expression.replace(/×/g,"*").replace(/÷/g,"/");
          if (!/^[0-9+\-*/%.() ]+$/.test(safe)) throw new Error();
          const result = Function(`"use strict"; return (${safe})`)();
          if (!Number.isFinite(result)) throw new Error();
          expression = String(Number(result.toFixed(10)));
        } catch { expression = ""; display.value = "Error"; return; }
      } else if (key === "±") {
        if (expression) expression = `-(${expression})`;
      } else {
        const mapped = key === "×" ? "*" : key === "÷" ? "/" : key === "−" ? "-" : key;
        expression += mapped;
      }
      display.value = expression.replace(/\*/g,"×").replace(/\//g,"÷") || "0";
    });
  });
}

/* ---------- ACTIONS ---------- */

function handleAction(action, content) {
  if (action === "new-file") createFile();
  if (action === "export-files") exportFiles();
  if (action === "backup") backupWorkspace();
  if (action === "restore") $("restoreInput").click();
  if (action === "reset") {
    if (confirm("This will erase your saved NEXUS settings, notes and files. Continue?")) {
      localStorage.removeItem("nexus_state");
      location.reload();
    }
  }
}

/* ---------- START MENU & SEARCH ---------- */

function renderStartApps(filter = "") {
  const target = $("startApps");
  target.innerHTML = "";
  Object.entries(APPS)
    .filter(([key, app]) => state.installed.includes(key) &&
      `${key} ${app.name}`.toLowerCase().includes(filter.toLowerCase()))
    .forEach(([key, app]) => {
      const button = document.createElement("button");
      button.innerHTML = `<span>${app.icon}</span>${app.name}`;
      button.addEventListener("click", () => {
        openApp(key);
        $("startMenu").classList.add("hidden");
      });
      target.appendChild(button);
    });
}

function togglePanel(id) {
  const panel = $(id);
  const other = id === "startMenu" ? "controlPanel" : "startMenu";
  $(other).classList.add("hidden");
  panel.classList.toggle("hidden");
}

/* ---------- BACKUP & RESTORE ---------- */

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function backupWorkspace() {
  saveState();
  downloadFile(
    "NEXUS-Workspace-Backup.json",
    JSON.stringify(state, null, 2),
    "application/json"
  );
  showToast("Workspace backup created");
}

$("restoreInput").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported || typeof imported !== "object" ||
        !Array.isArray(imported.files) || !Array.isArray(imported.installed)) {
      throw new Error("Invalid backup");
    }
    if (!confirm("Replace your current NEXUS workspace with this backup?")) return;
    state = { ...DEFAULT_STATE, ...imported };
    saveState();
    showToast("Backup restored. Reloading...");
    setTimeout(() => location.reload(), 700);
  } catch {
    showToast("That backup file is invalid.");
  } finally {
    event.target.value = "";
  }
});

/* ---------- DESKTOP INTERACTION ---------- */

function bindDesktop() {
  $("enterButton").addEventListener("click", enterDesktop);
  $("startButton").addEventListener("click", () => togglePanel("startMenu"));
  $("controlButton").addEventListener("click", () => togglePanel("controlPanel"));
  $("closeControl").addEventListener("click", () => $("controlPanel").classList.add("hidden"));
  $("restartButton").addEventListener("click", restartWelcome);

  $("desktopIcons").addEventListener("click", e => {
    const icon = e.target.closest("[data-app]");
    if (icon) openApp(icon.dataset.app);
  });

  $("startSearch").addEventListener("input", e => renderStartApps(e.target.value));

  $("controlSettings").addEventListener("click", () => openApp("settings"));
  $("controlExplorer").addEventListener("click", () => openApp("explorer"));
  $("controlNotes").addEventListener("click", () => openApp("notes"));
  $("backupButton").addEventListener("click", backupWorkspace);

  document.addEventListener("contextmenu", e => {
    if (!e.target.closest(".nexus-window") && $("desktop").contains(e.target)) {
      e.preventDefault();
      const menu = $("contextMenu");
      menu.classList.remove("hidden");
      menu.style.left = `${Math.min(e.clientX, innerWidth - 200)}px`;
      menu.style.top = `${Math.min(e.clientY, innerHeight - 190)}px`;
    }
  });

  $("contextMenu").addEventListener("click", e => {
    const button = e.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    $("contextMenu").classList.add("hidden");
    if (action === "refresh") {
      applySettings();
      showToast("Desktop refreshed");
    } else openApp(action);
  });

  document.addEventListener("click", e => {
    if (!e.target.closest("#contextMenu")) $("contextMenu").classList.add("hidden");
    if (!e.target.closest("#startMenu") && !e.target.closest("#startButton"))
      $("startMenu").classList.add("hidden");
    if (!e.target.closest("#controlPanel") && !e.target.closest("#controlButton"))
      $("controlPanel").classList.add("hidden");
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      $("startMenu").classList.add("hidden");
      $("controlPanel").classList.add("hidden");
      $("contextMenu").classList.add("hidden");
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      $("startMenu").classList.remove("hidden");
      $("startSearch").focus();
    }
  });
}

/* ---------- CLOCK ---------- */

function updateClock() {
  const now = new Date();
  $("taskClock").textContent = now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  $("taskDate").textContent = now.toLocaleDateString([], { day:"2-digit", month:"short" });
  $("desktopDate").textContent = now.toLocaleDateString([], {
    weekday:"long", day:"numeric", month:"long"
  });
}

function hexToRgb(hex) {
  const clean = hex.replace("#","");
  const n = parseInt(clean,16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
}

/* ---------- INITIALISE ---------- */

loadState();
bindDesktop();
applySettings();
updateClock();
setInterval(updateClock, 1000);

if (state.entered) {
  $("welcomeScreen").classList.add("hidden");
  $("desktop").classList.remove("hidden");
  renderStartApps();
  state.session.forEach(item => {
    if (state.installed.includes(item.app)) openApp(item.app, item);
  });
}

window.addEventListener("beforeunload", saveState);


/* ---------- OFFLINE SUPPORT ---------- */

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("NEXUS offline support ready"))
      .catch(error => console.warn("Offline support unavailable:", error));
  });
}

