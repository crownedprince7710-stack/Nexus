
export function initWindowManager(Nexus) {
  const layer = document.getElementById("window-layer");
  let zIndex = 10;

  function create({id,title,icon,render}) {
    const win = document.createElement("section");
    win.className = "app-window";
    win.dataset.id = id;
    win.style.zIndex = ++zIndex;

    win.innerHTML = `
      <header class="window-titlebar">
        <span>${icon}</span>
        <span class="window-title">${title}</span>
        <div class="window-controls">
          <button class="minimize" title="Minimize">−</button>
          <button class="maximize" title="Maximize">□</button>
          <button class="close" title="Close">×</button>
        </div>
      </header>
      <div class="window-body"></div>`;

    layer.append(win);

    const body = win.querySelector(".window-body");
    render(body);

    const focus = () => {
      document.querySelectorAll(".app-window").forEach(w =>
        w.classList.remove("active")
      );
      win.classList.add("active");
      win.style.zIndex = ++zIndex;
    };

    win.addEventListener("pointerdown", focus);

    win.querySelector(".close").onclick = () => Nexus.close(id);

    win.querySelector(".minimize").onclick = () => {
      win.style.display = "none";
    };

    win.querySelector(".maximize").onclick = () => {
      win.classList.toggle("maximized");
    };

    const bar = win.querySelector(".window-titlebar");
    let drag = null;

    bar.addEventListener("pointerdown", event => {
      if (event.target.closest("button") || win.classList.contains("maximized")) return;
      drag = {
        x: event.clientX,
        y: event.clientY,
        left: win.offsetLeft,
        top: win.offsetTop
      };
      bar.setPointerCapture(event.pointerId);
    });

    bar.addEventListener("pointermove", event => {
      if (!drag) return;
      win.style.left = `${Math.max(0,drag.left + event.clientX-drag.x)}px`;
      win.style.top = `${Math.max(0,drag.top + event.clientY-drag.y)}px`;
    });

    bar.addEventListener("pointerup", () => drag = null);
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
    layer.querySelector(`[data-id="${id}"]`)?.remove();
  }

  return {create,close};
}

