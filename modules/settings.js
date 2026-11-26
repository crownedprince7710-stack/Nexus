
export function initSettings(root) {
  const nexus = window.NexusApp;
  const saved = JSON.parse(
    localStorage.getItem("nexus-settings") || "{}"
  );

  root.innerHTML = `
    <div class="panel">
      <h2>⚙ Personalization</h2>

      <h3>Appearance</h3>
      <div class="setting-row">
        <span>Theme</span>
        <select class="nexus-select" id="theme">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div class="setting-row">
        <span>Accent colour</span>
        <input type="color" id="accent" value="#7198ff">
      </div>

      <h3>Desktop wallpaper</h3>
      <div class="wallpaper-options" id="wallpaper-options"></div>

      <div class="setting-row">
        <span>Choose image or video</span>
        <input id="wallpaper-upload" type="file"
          accept="image/*,video/mp4,video/webm">
      </div>

      <div class="setting-row">
        <span>Remove custom wallpaper</span>
        <button class="nexus-button" id="reset-wallpaper">Reset</button>
      </div>

      <h3>System</h3>
      <div class="setting-row">
        <span>Reset all NEXUS settings</span>
        <button class="nexus-button" id="reset-settings">Reset</button>
      </div>
    </div>`;

  const theme = root.querySelector("#theme");
  const accent = root.querySelector("#accent");
  const wallpaper = document.getElementById("wallpaper");

  theme.value = saved.theme || "dark";
  accent.value = saved.accent || "#7198ff";

  function save() {
    const settings = {
      theme:theme.value,
      accent:accent.value,
      wallpaper:saved.wallpaper || ""
    };

    localStorage.setItem("nexus-settings",JSON.stringify(settings));
    document.documentElement.style.setProperty("--accent",accent.value);
    document.body.style.filter =
      theme.value === "light" ? "invert(0.88) hue-rotate(180deg)" : "";
  }

  function setWallpaper(url,type="image") {
    wallpaper.replaceChildren();

    if(type === "video") {
      const video = document.createElement("video");
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      wallpaper.append(video);
    } else {
      wallpaper.style.backgroundImage = `url("${url}")`;
    }
  }

  const options = root.querySelector("#wallpaper-options");
  const defaults = [
    "linear-gradient(130deg,#070d1a,#101b31,#080e1c)",
    "linear-gradient(130deg,#14284e,#4168a4,#11182c)",
    "linear-gradient(130deg,#201b3b,#56468b,#0e1730)",
    "linear-gradient(130deg,#092b30,#147d83,#101d34)"
  ];

  defaults.forEach((value,index) => {
    const button = document.createElement("button");
    button.className = "wallpaper-choice";
    button.style.background = value;
    button.onclick = () => {
      saved.wallpaper = "";
      wallpaper.replaceChildren();
      wallpaper.style.backgroundImage = value;
      save();
      localStorage.setItem("nexus-settings",JSON.stringify({
        theme:theme.value,accent:accent.value,wallpaper:""
      }));
    };
    options.append(button);
  });

  root.querySelector("#wallpaper-upload").onchange = async event => {
    const file = event.target.files?.[0];
    if(!file) return;

    const url = URL.createObjectURL(file);
    setWallpaper(url,file.type.startsWith("video/") ? "video" : "image");

    try {
      await nexus.storage?.transaction("settings","readwrite");
    } catch {}

    const reader = new FileReader();
    reader.onload = () => {
      const data = {
        theme:theme.value,
        accent:accent.value,
        wallpaper:reader.result,
        video:file.type.startsWith("video/")
      };
      localStorage.setItem("nexus-settings",JSON.stringify(data));
    };
    reader.readAsDataURL(file);

    nexus.notify("Wallpaper applied.");
  };

  theme.onchange = save;
  accent.oninput = save;

  root.querySelector("#reset-wallpaper").onclick = () => {
    wallpaper.replaceChildren();
    wallpaper.style.backgroundImage = "";
    saved.wallpaper = "";
    localStorage.removeItem("nexus-settings");
    nexus.notify("Wallpaper reset.");
  };

  root.querySelector("#reset-settings").onclick = () => {
    if(confirm("Reset NEXUS appearance settings?")) {
      localStorage.removeItem("nexus-settings");
      location.reload();
    }
  };

  if(saved.wallpaper) {
    setWallpaper(saved.wallpaper,saved.video ? "video" : "image");
  }

  save();
}

