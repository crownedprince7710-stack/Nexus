
/* ==========================================
   PROJECT NEXUS
   Desktop Environment
========================================== */

const desktop = document.getElementById("desktop");
const windowLayer = document.getElementById("windowLayer");
const startMenu = document.getElementById("startMenu");
const searchPanel = document.getElementById("searchPanel");
const controlPanel = document.getElementById("controlPanel");
const contextMenu = document.getElementById("contextMenu");
const taskbarApps = document.getElementById("taskbarApps");

let zIndex = 100;
let windowCount = 0;
let activeWindow = null;

const apps = {
  explorer: { title: "File Explorer", icon: "📁" },
  notes: { title: "Notes", icon: "📝" },
  calculator: { title: "Calculator", icon: "🧮" },
  settings: { title: "Settings", icon: "⚙️" },
  about: { title: "About NEXUS", icon: "◈" }
};

function closePanels() {
  startMenu.classList.add("hidden");
  searchPanel.classList.add("hidden");
  controlPanel.classList.add("hidden");
  contextMenu.classList.add("hidden");
}

function openApp(appName) {
  if (!apps[appName]) return;

  closePanels();

  const existing = document.querySelector(
    `.window[data-app="${appName}"]`
  );

  if (existing) {
    existing.classList.remove("hidden");
    focusWindow(existing);
    return;
  }

  const win = document.createElement("section");
  const id = "window-" + (++windowCount);

  win.className = "window";
  win.dataset.app = appName;
  win.id = id;
  win.style.zIndex = ++zIndex;

  win.innerHTML = `
    <div class="window-header">
      <div class="window-title">
        ${apps[appName].icon} ${apps[appName].title}
      </div>

      <div class="window-controls">
        <button data-action="minimize">−</button>
        <button data-action="maximize">□</button>
        <button class="close" data-action="close">×</button>
      </div>
    </div>

    <div class="window-content">
      ${getAppContent(appName)}
    </div>
  `;

  windowLayer.appendChild(win);
  createTaskbarItem(id, appName);
  focusWindow(win);
  makeDraggable(win);

  win.addEventListener("pointerdown", () => focusWindow(win));

  win.querySelector(".window-controls").addEventListener("click", e => {
    const action = e.target.dataset.action;

    if (action === "close") {
      removeWindow(win);
    }

    if (action === "minimize") {
      win.classList.add("hidden");
      updateTaskbar();
    }

    if (action === "maximize") {
      win.classList.toggle("maximized");
      focusWindow(win);
    }
  });

  if (appName === "notes") setupNotes(win);
  if (appName === "calculator") setupCalculator(win);
  if (appName === "settings") setupSettings(win);
}

function getAppContent(appName) {
  switch (appName) {

    case "notes":
      return `
        <h2>My Notes</h2>
        <p>Your notes are saved automatically on this browser.</p>
        <textarea id="noteArea" class="note-area"
          placeholder="Start writing something..."></textarea>
      `;

    case "calculator":
      return `
        <h2>Calculator</h2>
        <div id="calcDisplay" class="calculator-display">0</div>

        <div class="calculator-grid">
          <button data-calc="C">C</button>
          <button data-calc="(">(</button>
          <button data-calc=")">)</button>
          <button class="operator" data-calc="/">÷</button>

          <button data-calc="7">7</button>
          <button data-calc="8">8</button>
          <button data-calc="9">9</button>
          <button class="operator" data-calc="*">×</button>

          <button data-calc="4">4</button>
          <button data-calc="5">5</button>
          <button data-calc="6">6</button>
          <button class="operator" data-calc="-">−</button>

          <button data-calc="1">1</button>
          <button data-calc="2">2</button>
          <button data-calc="3">3</button>
          <button class="operator" data-calc="+">+</button>

          <button data-calc="0">0</button>
          <button data-calc=".">.</button>
          <button data-calc="DEL">⌫</button>
          <button class="operator" data-calc="=">=</button>
        </div>
      `;

    case "explorer":
      return `
        <h2>File Explorer</h2>
        <p>NEXUS virtual workspace</p>

        <div>
          <div class="explorer-item" data-folder="Documents">
            <span style="font-size:30px">📁</span>
            Documents
          </div>

          <div class="explorer-item" data-folder="Pictures">
            <span style="font-size:30px">🖼️</span>
            Pictures
          </div>

          <div class="explorer-item" data-folder="Music">
            <span style="font-size:30px">🎵</span>
            Music
          </div>

          <div class="explorer-item" data-folder="Downloads">
            <span style="font-size:30px">⬇️</span>
            Downloads
          </div>
        </div>

        <p id="folderMessage">Select a folder to explore.</p>
      `;

    case "settings":
      return `
        <h2>Personalisation</h2>
        <p>Customise your NEXUS desktop.</p>

        <div class="settings-row">
          <strong>Accent Colour</strong>
          <button class="color-option" style="background:#ff304f"
            data-color="#ff304f"></button>
          <button class="color-option" style="background:#2684ff"
            data-color="#2684ff"></button>
          <button class="color-option" style="background:#8c52ff"
            data-color="#8c52ff"></button>
          <button class="color-option" style="background:#00b894"
            data-color="#00b894"></button>
        </div>

        <div class="settings-row">
          <strong>Desktop Icons</strong>
          <button class="app-button" id="toggleIcons">Show / Hide Icons</button>
        </div>

        <div class="settings-row">
          <strong>Wallpaper</strong>
          <button class="app-button" data-wallpaper="default">Default</button>
          <button class="app-button" data-wallpaper="purple">Purple</button>
          <button class="app-button" data-wallpaper="blue">Blue</button>
        </div>
      `;

    case "about":
      return `
        <h2>PROJECT NEXUS</h2>
        <p>A new kind of personal digital workspace.</p>

        <div class="settings-row">
          <strong>Version</strong>
          NEXUS 1.0
        </div>

        <div class="settings-row">
          <strong>Environment</strong>
          Browser-based desktop
        </div>

        <div class="settings-row">
          <strong>Vision</strong>
          Bringing desktop-style productivity to the web.
        </div>

        <p>Designed for exploration, productivity and creativity.</p>
      `;

    default:
      return "<p>Application unavailable.</p>";
  }
}

function focusWindow(win) {
  document.querySelectorAll(".window").forEach(w => {
    w.classList.remove("focused");
  });

  win.style.zIndex = ++zIndex;
  win.classList.remove("hidden");
  win.classList.add("focused");
  activeWindow = win.id;

  updateTaskbar();
}

function removeWindow(win) {
  const id = win.id;
  win.remove();

  const task = document.querySelector(`[data-window-id="${id}"]`);
  if (task) task.remove();

  activeWindow = null;
  updateTaskbar();
}

function createTaskbarItem(id, appName) {
  const button = document.createElement("button");

  button.className = "task-app";
  button.dataset.windowId = id;
  button.textContent = apps[appName].icon + " " + apps[appName].title;

  button.addEventListener("click", () => {
    const win = document.getElementById(id);

    if (!win) return;

    if (activeWindow === id && !win.classList.contains("hidden")) {
      win.classList.add("hidden");
    } else {
      win.classList.remove("hidden");
      focusWindow(win);
    }

    updateTaskbar();
  });

  taskbarApps.appendChild(button);
}

function updateTaskbar() {
  document.querySelectorAll(".task-app").forEach(button => {
    const win = document.getElementById(button.dataset.windowId);

    button.classList.toggle(
      "active",
      !!win &&
      !win.classList.contains("hidden") &&
      win.id === activeWindow
    );
  });
}

function makeDraggable(win) {
  const header = win.querySelector(".window-header");

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    if (win.classList.contains("maximized")) return;

    dragging = true;

    const rect = win.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    header.setPointerCapture(e.pointerId);
    focusWindow(win);
  });

  header.addEventListener("pointermove", e => {
    if (!dragging) return;

    const desktopRect = desktop.getBoundingClientRect();

    let x = e.clientX - desktopRect.left - offsetX;
    let y = e.clientY - desktopRect.top - offsetY;

    x = Math.max(0, Math.min(x, desktop.clientWidth - 80));
    y = Math.max(0, Math.min(y, desktop.clientHeight - 60));

    win.style.left = x + "px";
    win.style.top = y + "px";
  });

  header.addEventListener("pointerup", () => {
    dragging = false;
  });

  header.addEventListener("pointercancel", () => {
    dragging = false;
  });
}

/* NOTES */

function setupNotes(win) {
  const area = win.querySelector("#noteArea");

  area.value = localStorage.getItem("nexus-notes") || "";

  area.addEventListener("input", () => {
    localStorage.setItem("nexus-notes", area.value);
  });
}

/* CALCULATOR */

function setupCalculator(win) {
  const display = win.querySelector("#calcDisplay");
  let expression = "";

  win.querySelector(".calculator-grid").addEventListener("click", e => {
    const value = e.target.dataset.calc;

    if (!value) return;

    if (value === "C") {
      expression = "";
      display.textContent = "0";
      return;
    }

    if (value === "DEL") {
      expression = expression.slice(0, -1);
      display.textContent = expression || "0";
      return;
    }

    if (value === "=") {
      try {
        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
          throw new Error("Invalid");
        }

        const result = Function(
          '"use strict"; return (' + expression + ')'
        )();

        if (!Number.isFinite(result)) throw new Error("Invalid");

        expression = String(result);
        display.textContent = expression;
      } catch {
        expression = "";
        display.textContent = "Error";
      }

      return;
    }

    expression += value;
    display.textContent = expression;
  });
}

/* SETTINGS */

function setupSettings(win) {
  win.querySelectorAll("[data-color]").forEach(button => {
    button.addEventListener("click", () => {
      const color = button.dataset.color;

      document.documentElement.style.setProperty("--accent", color);
      localStorage.setItem("nexus-accent", color);
    });
  });

  win.querySelector("#toggleIcons").addEventListener("click", () => {
    const icons = document.getElementById("desktopIcons");

    icons.classList.toggle("hidden");

    localStorage.setItem(
      "nexus-icons-hidden",
      icons.classList.contains("hidden")
    );
  });

  win.querySelectorAll("[data-wallpaper]").forEach(button => {
    button.addEventListener("click", () => {
      const choice = button.dataset.wallpaper;

      const wallpapers = {
        default: "linear-gradient(135deg,#080b14,#10182b 55%,#090d18)",
        purple: "linear-gradient(135deg,#100c25,#25134a,#090d18)",
        blue: "linear-gradient(135deg,#071426,#102e52,#080b14)"
      };

      desktop.style.background = wallpapers[choice];
      localStorage.setItem("nexus-wallpaper", choice);
    });
  });
}

/* DESKTOP ICONS */

let lastIconClick = 0;

document.querySelectorAll(".desktop-icon").forEach(icon => {

  icon.addEventListener("click", () => {
    const now = Date.now();

    document.querySelectorAll(".desktop-icon").forEach(item => {
      item.classList.remove("selected");
    });

    icon.classList.add("selected");

    if (now - lastIconClick < 350) {
      openApp(icon.dataset.app);
    }

    lastIconClick = now;
  });

  icon.addEventListener("dblclick", () => {
    openApp(icon.dataset.app);
  });

});

/* START MENU */

document.getElementById("startButton").addEventListener("click", () => {
  searchPanel.classList.add("hidden");
  controlPanel.classList.add("hidden");
  contextMenu.classList.add("hidden");

  startMenu.classList.toggle("hidden");
});

startMenu.addEventListener("click", e => {
  const app = e.target.closest("[data-app]");

  if (app) openApp(app.dataset.app);
});

/* SEARCH */

document.getElementById("searchButton").addEventListener("click", () => {
  closePanels();
  searchPanel.classList.remove("hidden");
  document.getElementById("globalSearch").focus();
});

document.getElementById("startSearch").addEventListener("input", e => {
  const query = e.target.value.toLowerCase();

  document.querySelectorAll(".pinned-apps button").forEach(button => {
    button.style.display = button.textContent.toLowerCase().includes(query)
      ? ""
      : "none";
  });
});

document.getElementById("globalSearch").addEventListener("input", e => {
  const query = e.target.value.toLowerCase();
  const results = document.getElementById("searchResults");

  results.innerHTML = "";

  Object.entries(apps).forEach(([key, app]) => {
    if (
      app.title.toLowerCase().includes(query) ||
      key.includes(query)
    ) {
      const button = document.createElement("button");
      button.textContent = app.icon + " " + app.title;

      button.addEventListener("click", () => openApp(key));

      results.appendChild(button);
    }
  });
});

/* CONTROL CENTRE */

document.getElementById("controlButton").addEventListener("click", () => {
  closePanels();
  controlPanel.classList.toggle("hidden");
});

document.querySelectorAll(".control-tile").forEach(button => {
  button.addEventListener("click", () => {
    button.classList.toggle("active");
  });
});

/* CONTEXT MENU */

desktop.addEventListener("contextmenu", e => {
  if (e.target.closest(".window")) return;

  e.preventDefault();
  closePanels();

  contextMenu.classList.remove("hidden");

  const rect = desktop.getBoundingClientRect();

  contextMenu.style.left = Math.min(
    e.clientX - rect.left,
    desktop.clientWidth - 190
  ) + "px";

  contextMenu.style.top = Math.min(
    e.clientY - rect.top,
    desktop.clientHeight - 160
  ) + "px";
});

contextMenu.addEventListener("click", e => {
  const action = e.target.dataset.action;

  if (action === "refresh") {
    location.reload();
  }

  if (action === "new-note") {
    openApp("notes");
  }

  if (action === "settings") {
    openApp("settings");
  }
});

/* EXPLORER */

windowLayer.addEventListener("click", e => {
  const folder = e.target.closest("[data-folder]");

  if (folder) {
    const message = folder.closest(".window")
      .querySelector("#folderMessage");

    message.textContent =
      folder.dataset.folder + " is a virtual demo folder.";
  }
});

/* KEYBOARD SHORTCUTS */

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closePanels();
  }

  if (e.ctrlKey && e.key.toLowerCase() === "k") {
    e.preventDefault();
    closePanels();
    searchPanel.classList.remove("hidden");
    document.getElementById("globalSearch").focus();
  }

  if (e.altKey && e.key === "Tab") {
    e.preventDefault();

    const visibleWindows = [...document.querySelectorAll(".window")]
      .filter(win => !win.classList.contains("hidden"));

    if (!visibleWindows.length) return;

    const current = visibleWindows.findIndex(
      win => win.id === activeWindow
    );

    const next = visibleWindows[(current + 1) % visibleWindows.length];

    focusWindow(next);
  }

  if (e.ctrlKey && e.key.toLowerCase() === "c") {
    if (activeWindow) {
      const win = document.getElementById(activeWindow);

      if (win && win.contains(document.activeElement)) return;
    }
  }

  if (e.key === "Delete" || e.key === "F2") {
    if (e.target.matches("input, textarea")) return;
  }
});

/* CLOCK */

function updateClock() {
  const now = new Date();

  document.getElementById("clockTime").textContent =
    now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

  document.getElementById("clockDate").textContent =
    now.toLocaleDateString([], {
      day: "2-digit",
      month: "short"
    });
}

updateClock();
setInterval(updateClock, 1000);

/* POWER BUTTON */

document.getElementById("powerButton").addEventListener("click", () => {
  const confirmed = confirm(
    "Close all NEXUS windows and return to the desktop?"
  );

  if (confirmed) {
    windowLayer.innerHTML = "";
    taskbarApps.innerHTML = "";
    activeWindow = null;
    closePanels();
  }
});

/* RESTORE PERSONALISATION */

const savedAccent = localStorage.getItem("nexus-accent");

if (savedAccent) {
  document.documentElement.style.setProperty("--accent", savedAccent);
}

const savedWallpaper = localStorage.getItem("nexus-wallpaper");

if (savedWallpaper) {
  const wallpapers = {
    default: "linear-gradient(135deg,#080b14,#10182b 55%,#090d18)",
    purple: "linear-gradient(135deg,#100c25,#25134a,#090d18)",
    blue: "linear-gradient(135deg,#071426,#102e52,#080b14)"
  };

  desktop.style.background = wallpapers[savedWallpaper] || wallpapers.default;
}

if (localStorage.getItem("nexus-icons-hidden") === "true") {
  document.getElementById("desktopIcons").classList.add("hidden");
}

/* PWA SERVICE WORKER */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => console.error("Service Worker:", error));
  });
}
