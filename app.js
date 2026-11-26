
import { initDesktop } from "./modules/desktop.js";
import { initWindowManager } from "./modules/window-manager.js";
import { initBrowser } from "./modules/browser.js";
import { initTabs } from "./modules/tabs.js";
import { initDownloads } from "./modules/downloads.js";
import { initFiles } from "./modules/file-explorer.js";
import { initSettings } from "./modules/settings.js";
import { initStorage } from "./modules/storage.js";
import { initCloudSync } from "./modules/cloud-sync.js";
import { initAI } from "./modules/ai-agent.js";

const $ = id => document.getElementById(id);

export const Nexus = {
  windows: {},
  storage: null,
  cloud: null,

  notify(message) {
    const area = $("toast-area");
    if (!area) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    area.append(toast);

    setTimeout(() => toast.remove(), 3200);
  },

  open(name) {
    if (this.windows[name]) {
      this.windows[name].focus();
      return;
    }

    const apps = {
      browser: ["NEXUS Browser", "🌐", initBrowser],
      files: ["File Explorer", "📁", initFiles],
      downloads: ["Downloads", "⬇️", initDownloads],
      settings: ["Settings", "⚙️", initSettings],
      ai: ["NEXUS AI", "✦", initAI],
      about: ["About NEXUS", "ⓘ", initAbout]
    };

    const app = apps[name];
    if (!app) return;

    const win = windowManager.create({
      id: name,
      title: app[0],
      icon: app[1],
      render: app[2]
    });

    this.windows[name] = win;
    this.updateTaskbar();
  },

  close(name) {
    windowManager.close(name);
    delete this.windows[name];
    this.updateTaskbar();
  },

  updateTaskbar() {
    document.querySelectorAll("[data-running-app]").forEach(el => el.remove());

    const taskbar = document.querySelector(".taskbar");
    if (!taskbar) return;

    Object.keys(this.windows).forEach(name => {
      const icons = {
        browser: "🌐",
        files: "📁",
        downloads: "⬇️",
        settings: "⚙️",
        ai: "✦",
        about: "ⓘ"
      };

      const button = document.createElement("button");
      button.dataset.runningApp = name;
      button.title = name;
      button.textContent = icons[name] || "□";
      button.onclick = () => this.windows[name]?.focus();

      const spacer = taskbar.querySelector(".taskbar-spacer");
      taskbar.insertBefore(button, spacer || $("taskbar-clock"));
    });
  }
};

window.NexusApp = Nexus;

const windowManager = initWindowManager(Nexus);

function initAbout(root) {
  root.innerHTML = `
    <div class="panel">
      <h2>NEXUS V5</h2>
      <p>Your personal browser-based desktop environment.</p>
      <p>Version 5.0.0</p>
      <p>Designed for televisions, monitors, keyboards and mice.</p>
      <p>Local storage with optional cloud services.</p>
    </div>
  `;
}

function updateClock() {
  const now = new Date();

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  const date = now.toLocaleDateString();

  if ($("top-clock")) $("top-clock").textContent = time;
  if ($("taskbar-clock")) {
    $("taskbar-clock").textContent = time;
    $("taskbar-clock").title = date;
  }
}

function bindControls() {
  // Desktop, Start menu and taskbar app launchers
  document.addEventListener("click", event => {
    const launcher = event.target.closest("[data-open]");

    if (launcher) {
      event.preventDefault();
      Nexus.open(launcher.dataset.open);
      $("start-menu")?.classList.add("hidden");
    }
  });

  // Start menu
  $("start-button")?.addEventListener("click", () => {
    $("start-menu")?.classList.toggle("hidden");
  });

  // Search the installed app list
  $("start-search")?.addEventListener("input", event => {
    const query = event.target.value.toLowerCase();

    document.querySelectorAll(".start-apps [data-open]").forEach(button => {
      button.hidden = !button.textContent.toLowerCase().includes(query);
    });
  });

  // Power / restart
  $("power-button")?.addEventListener("click", () => {
    if (confirm("Restart NEXUS?")) {
      location.reload();
    }
  });

  // Close menus with Escape
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $("start-menu")?.classList.add("hidden");
      document.getElementById("context-menu")?.classList.add("hidden");
    }

    if ((event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "e") {
      event.preventDefault();
      Nexus.open("files");
    }

    if ((event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "l") {
      event.preventDefault();
      Nexus.open("browser");
    }
  });
}

async function startStorage() {
  try {
    Nexus.storage = await initStorage();
    initCloudSync(Nexus);
    Nexus.notify("Local storage ready");
  } catch (error) {
    console.error("NEXUS storage error:", error);
    Nexus.notify("Storage unavailable. Desktop is still running.");
  }
}

async function boot() {
  try {
    initTabs();
    initDesktop(Nexus);
    bindControls();

    updateClock();
    setInterval(updateClock, 1000);

    // Show desktop even if optional services fail
    $("boot-screen")?.classList.add("hidden");
    $("desktop")?.classList.remove("hidden");

    // Storage must never block desktop startup
    startStorage();

    // Register service worker
    if ("serviceWorker" in navigator &&
        location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("./sw.js")
        .catch(error => console.warn("Service worker:", error));
    }

    Nexus.notify("Welcome to NEXUS V5");
  } catch (error) {
    console.error("NEXUS startup error:", error);

    const bootScreen = $("boot-screen");
    if (bootScreen) {
      bootScreen.classList.remove("hidden");
      const message = bootScreen.querySelector("p");
      if (message) message.textContent = "STARTUP ERROR — CHECK CONSOLE";
    }
  }
}

boot();
