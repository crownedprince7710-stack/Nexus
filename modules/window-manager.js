
export function initWindowManager(Nexus) {
  const layer = document.getElementById("window-layer");
  let zIndex = 20;

  function create({ id, title, icon, render }) {
    if (!layer) throw new Error("Window layer is missing");

    const win = document.createElement("section");

    // These classes match the existing style.css
    win.className = "nexus-window";
    win.dataset.id = id;
    win.style.zIndex = ++zIndex;

    win.innerHTML = `
      <header class="window-titlebar">
        <span>${icon}</span>
        <span class="window-title"></span>

        <div class="window-controls">
          <button class="minimize" title="Minimize">−</button>
          <button class="maximize" title="Maximize">□</button>
          <button class="close" title="Close">×</button>
        </div>
      </header>

      <div class="window-content"></div>
    `;

    win.querySelector(".window-title").textContent = title;

    const body = win.querySelector(".window-content");
    layer.append(win);

    function focus() {
      document.querySelectorAll(".nexus-window").forEach(window => {
        window.classList.remove("active");
      });

      win.classList.add("active");
      win.style.zIndex = ++zIndex;
    }

    try {
      render(body);
    } catch (error) {
      console.error(`Error opening ${id}:`, error);
      body.innerHTML = `
        <h2>Unable to open this app</h2>
        <p>Something went wrong while loading ${title}.</p>
        <p>Check the browser console for details.</p>
      `;
    }

    win.addEventListener("pointerdown", focus);

    win.querySelector(".close").onclick = () => {
      Nexus.close(id);
    };

    win.querySelector(".minimize").onclick = () => {
      win.style.display = "none";
    };

    let maximized = false;
    let previousSize = null;

    win.querySelector(".maximize").onclick = () => {
      if (!maximized) {
        previousSize = {
          top: win.style.top,
          left: win.style.left,
          width: win.style.width,
          height: win.style.height
        };

        win.style.top = "0";
        win.style.left = "0";
        win.style.width = "100%";
        win.style.height = "100%";
        win.style.borderRadius = "0";
        maximized = true;
      } else {
        if (previousSize) {
          Object.assign(win.style, previousSize);
        }

        win.style.borderRadius = "";
        maximized = false;
      }

      focus();
    };

    // Mouse and touch dragging
    const titlebar = win.querySelector(".window-titlebar");
    let drag = null;

    titlebar.addEventListener("pointerdown", event => {
      if (event.target.closest("button") || maximized) return;

      focus();

      drag = {
        x: event.clientX,
        y: event.clientY,
        left: win.offsetLeft,
        top: win.offsetTop
      };

      titlebar.setPointerCapture(event.pointerId);
    });

    titlebar.addEventListener("pointermove", event => {
      if (!drag) return;

      const newLeft = drag.left + event.clientX - drag.x;
      const newTop = drag.top + event.clientY - drag.y;

      win.style.left = `${Math.max(0, newLeft)}px`;
      win.style.top = `${Math.max(0, newTop)}px`;
    });

    titlebar.addEventListener("pointerup", () => {
      drag = null;
    });

    titlebar.addEventListener("pointercancel", () => {
      drag = null;
    });

    focus();

    return {
      element: win,

      focus() {
        win.style.display = "flex";
        focus();
      }
    };
  }

  function close(id) {
    layer?.querySelector(`[data-id="${id}"]`)?.remove();
  }

  return { create, close };
}
