
const apps = [
  ["browser", "🌐", "Browser"],
  ["files", "📁", "File Explorer"],
  ["downloads", "⬇️", "Downloads"],
  ["ai", "✦", "NEXUS AI"],
  ["settings", "⚙️", "Settings"],
  ["about", "ⓘ", "About"]
];

export function initDesktop(Nexus) {
  const desktop = document.getElementById("desktop");
  const icons = document.getElementById("desktop-icons");
  const startMenu = document.getElementById("start-menu");

  if (!desktop || !icons || !startMenu) {
    throw new Error("Required desktop HTML elements are missing");
  }

  // Use existing HTML launchers; do not duplicate them
  const existing = document.querySelectorAll("[data-open]");

  existing.forEach(button => {
    button.addEventListener("dblclick", event => {
      event.preventDefault();
      Nexus.open(button.dataset.open);
    });
  });

  // Add About to the Start menu if it is not already there
  const startApps = startMenu.querySelector(".start-apps");

  if (startApps &&
      !startApps.querySelector('[data-open="about"]')) {
    const aboutButton = document.createElement("button");
    aboutButton.dataset.open = "about";
    aboutButton.textContent = "ⓘ About NEXUS";
    startApps.append(aboutButton);
  }

  // Right-click desktop context menu
  let menu = document.getElementById("context-menu");

  if (!menu) {
    menu = document.createElement("div");
    menu.id = "context-menu";
    menu.className = "nexus-context-menu hidden";

    menu.style.cssText = `
      position: fixed;
      z-index: 5000;
      min-width: 180px;
      padding: 7px;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 12px;
      background: #101b30;
      box-shadow: 0 12px 35px #0008;
    `;

    document.body.append(menu);
  }

  menu.innerHTML = `
    <button data-action="refresh">↻ Refresh desktop</button>
    <button data-action="browser">🌐 Open Browser</button>
    <button data-action="settings">⚙️ Personalize</button>
  `;

  menu.querySelectorAll("button").forEach(button => {
    button.style.cssText = `
      display:block;
      width:100%;
      padding:11px;
      margin:2px 0;
      border:0;
      border-radius:7px;
      text-align:left;
      background:transparent;
      color:white;
    `;

    button.onmouseenter = () => {
      button.style.background = "#ffffff18";
    };

    button.onmouseleave = () => {
      button.style.background = "transparent";
    };

    button.onclick = () => {
      menu.classList.add("hidden");

      if (button.dataset.action === "refresh") {
        location.reload();
      } else {
        Nexus.open(button.dataset.action);
      }
    };
  });

  desktop.addEventListener("contextmenu", event => {
    if (event.target.closest(".nexus-window")) return;

    event.preventDefault();

    menu.style.left =
      `${Math.min(event.clientX, innerWidth - 190)}px`;

    menu.style.top =
      `${Math.min(event.clientY, innerHeight - 150)}px`;

    menu.classList.remove("hidden");
  });

  document.addEventListener("click", event => {
    if (!event.target.closest("#context-menu")) {
      menu.classList.add("hidden");
    }
  });
}
