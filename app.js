
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
  active: null,
  storage: null,
  notify(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    $("toast-container").append(el);
    setTimeout(() => el.remove(), 3200);
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

    this.windows[name] = windowManager.create({
      id: name,
      title: app[0],
      icon: app[1],
      render: app[2]
    });

    this.updateTaskbar();
  },
  close(name) {
    windowManager.close(name);
    delete this.windows[name];
    this.updateTaskbar();
  },
  updateTaskbar() {
    const root = $("task-apps");
    root.replaceChildren();

    Object.keys(this.windows).forEach(name => {
      const button = document.createElement("button");
      button.className = "task-app running";
      button.textContent = ({
        browser: "🌐", files: "📁", downloads: "⬇️",
        settings: "⚙️", ai: "✦", about: "ⓘ"
      })[name] || "□";
      button.title = name;
      button.onclick = () => this.windows[name]?.focus();
      root.append(button);
    });
  }
};

const windowManager = initWindowManager(Nexus);

function initAbout(container) {
  container.innerHTML = `
    <div class="panel">
      <h2>NEXUS V5</h2>
      <p>Universal browser-based desktop environment.</p>
      <p>Version 5.0.0</p>
      <p>Built for mouse, keyboard and television browsers.</p>
      <p>Local-first desktop with optional cloud services.</p>
    </div>`;
}

function clock() {
  const now = new Date();
  $("clock-time").textContent = now.toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit"
  });
  $("clock-date").textContent = now.toLocaleDateString();
  $("quick-clock").textContent = now.toLocaleString();
}

function boot() {
  const status = $("boot-status");
  status.textContent = "LOADING DESKTOP";

  initDesktop(Nexus);

  $("start-button").onclick = () =>
    $("start-menu").classList.toggle("hidden");

  $("task-search").onclick = () => Nexus.open("browser");

  $("quick-button").onclick = () =>
    $("quick-panel").classList.toggle("hidden");

  $("power-button").onclick = () => {
    if (confirm("Shut down NEXUS?")) {
      $("desktop").classList.add("hidden");
      $("boot-screen").classList.remove("hidden");
      status.textContent = "NEXUS IS OFF";
    }
  };

  $("start-search-input").addEventListener("input", event => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll("#start-app-grid button")
      .forEach(button => {
        button.hidden = !button.textContent.toLowerCase().includes(query);
      });
  });

  document.querySelectorAll("[data-setting]").forEach(button => {
    button.onclick = () => {
      $("quick-panel").classList.add("hidden");
      Nexus.open("settings");
    };
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $("start-menu").classList.add("hidden");
      $("quick-panel").classList.add("hidden");
      $("context-menu").classList.add("hidden");
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
      event.preventDefault();
      Nexus.open("files");
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();
      Nexus.open("browser");
    }
  });

  clock();
  setInterval(clock, 1000);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  }

  initStorage().then(db => {
    Nexus.storage = db;
    initCloudSync(Nexus);
  });

  initTabs();
  Nexus.notify("Welcome to NEXUS V5");

  $("boot-screen").classList.add("hidden");
  $("desktop").classList.remove("hidden");
}

boot();

