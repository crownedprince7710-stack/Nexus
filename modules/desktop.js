
const apps = [
  ["browser","🌐","Browser"],
  ["files","📁","File Explorer"],
  ["downloads","⬇️","Downloads"],
  ["ai","✦","NEXUS AI"],
  ["settings","⚙️","Settings"],
  ["about","ⓘ","About"]
];

export function initDesktop(Nexus) {
  const icons = document.getElementById("desktop-icons");
  const grid = document.getElementById("start-app-grid");

  apps.forEach(([id,icon,name]) => {
    const desktopIcon = document.createElement("button");
    desktopIcon.className = "desktop-icon";
    desktopIcon.innerHTML =
      `<span class="icon">${icon}</span><span>${name}</span>`;
    desktopIcon.ondblclick = () => Nexus.open(id);
    desktopIcon.onclick = () => {
      document.querySelectorAll(".desktop-icon").forEach(el =>
        el.classList.remove("selected")
      );
      desktopIcon.classList.add("selected");
    };
    icons.append(desktopIcon);

    const startIcon = document.createElement("button");
    startIcon.innerHTML = `<span>${icon}</span>${name}`;
    startIcon.onclick = () => {
      document.getElementById("start-menu").classList.add("hidden");
      Nexus.open(id);
    };
    grid.append(startIcon);
  });

  document.getElementById("desktop").addEventListener("contextmenu", event => {
    if (event.target.closest(".app-window")) return;
    event.preventDefault();

    const menu = document.getElementById("context-menu");
    menu.innerHTML = `
      <button data-action="refresh">↻ Refresh desktop</button>
      <button data-action="browser">🌐 Open Browser</button>
      <button data-action="settings">⚙️ Personalize</button>`;

    menu.style.left = `${Math.min(event.clientX,innerWidth-190)}px`;
    menu.style.top = `${Math.min(event.clientY,innerHeight-130)}px`;
    menu.classList.remove("hidden");

    menu.querySelectorAll("button").forEach(button => {
      button.onclick = () => {
        menu.classList.add("hidden");
        if (button.dataset.action === "refresh") location.reload();
        else Nexus.open(button.dataset.action);
      };
    });
  });

  document.addEventListener("click", event => {
    if (!event.target.closest("#context-menu")) {
      document.getElementById("context-menu").classList.add("hidden");
    }
  });
}

