
/* =====================================
   PROJECT NEXUS 2.0
   PERSONALISATION ENGINE
===================================== */

(() => {
  "use strict";

  const KEY = "nexus_v2_preferences";

  const defaults = {
    wallpaper: "default",
    motion: true,
    taskbar: "center"
  };

  let prefs = { ...defaults };

  try {
    prefs = {
      ...defaults,
      ...JSON.parse(localStorage.getItem(KEY) || "{}")
    };
  } catch (e) {
    console.warn("NEXUS preferences unavailable");
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function apply() {
    const wallpaper = document.querySelector(
      ".desktop-wallpaper"
    );

    if (wallpaper) {
      wallpaper.dataset.nexusWallpaper = prefs.wallpaper;
      wallpaper.style.setProperty(
        "--nexus-motion",
        prefs.motion ? "1" : "0"
      );
    }

    const desktop = document.getElementById("desktop");

    if (desktop) {
      desktop.dataset.nexusTaskbar = prefs.taskbar;
    }
  }

  function renderSettings() {
    const root = document.querySelector(
      '.nexus-window[data-app="settings"] .window-content'
    );

    if (!root || root.querySelector(".nexus-v2-settings")) {
      return;
    }

    const panel = document.createElement("section");

    panel.className = "nexus-v2-settings";

    panel.innerHTML = `
      <h3>NEXUS 2.0 EXPERIENCE</h3>
      <p>Personalise your desktop environment.</p>

      <div class="nexus-v2-setting">
        <div>
          <strong>Dynamic wallpaper</strong>
          <small>Choose your atmosphere</small>
        </div>

        <div class="nexus-v2-wallpapers">
          ${["default","ocean","purple","red","minimal"]
            .map(name => `
              <button
                class="nexus-v2-wallpaper"
                data-wallpaper="${name}"
                aria-label="${name}"
                aria-pressed="${prefs.wallpaper === name}">
              </button>
            `).join("")}
        </div>
      </div>

      <div class="nexus-v2-setting">
        <div>
          <strong>Wallpaper animation</strong>
          <small>Animated desktop atmosphere</small>
        </div>

        <input type="checkbox" data-motion
          ${prefs.motion ? "checked" : ""}>
      </div>

      <div class="nexus-v2-setting">
        <div>
          <strong>Taskbar alignment</strong>
          <small>Choose taskbar position</small>
        </div>

        <select class="nexus-v2-select" data-taskbar>
          <option value="center">Centered</option>
          <option value="left">Left</option>
        </select>
      </div>
    `;

    root.appendChild(panel);

    panel.querySelectorAll("[data-wallpaper]")
      .forEach(button => {
        button.addEventListener("click", () => {
          prefs.wallpaper = button.dataset.wallpaper;

          panel.querySelectorAll("[data-wallpaper]")
            .forEach(item => {
              item.setAttribute(
                "aria-pressed",
                String(item === button)
              );
            });

          save();
          apply();
        });
      });

    panel.querySelector("[data-motion]")
      .addEventListener("change", event => {
        prefs.motion = event.target.checked;
        save();
        apply();
      });

    const taskbar = panel.querySelector("[data-taskbar]");

    taskbar.value = prefs.taskbar;

    taskbar.addEventListener("change", event => {
      prefs.taskbar = event.target.value;
      save();
      apply();
    });
  }

  function initialise() {
    apply();

    const area = document.getElementById("windowArea");

    if (area) {
      new MutationObserver(renderSettings).observe(
        area,
        { childList: true, subtree: true }
      );
    }

    document.querySelectorAll(".version, .boot-footer")
      .forEach(el => {
        el.textContent = "NEXUS WEB DESKTOP · VERSION 2.0";
      });

    // Restore settings panel when opened.
    const originalOpenApp = window.openApp;

    if (typeof originalOpenApp === "function") {
      window.openApp = function(app, restore) {
        const result = originalOpenApp.apply(this, arguments);

        if (app === "settings") {
          requestAnimationFrame(renderSettings);
        }

        return result;
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialise,
      { once: true }
    );
  } else {
    initialise();
  }

})();
