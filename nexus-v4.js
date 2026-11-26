
/* =====================================================
   PROJECT NEXUS 4.0
   AI + APP STORE + FILE MANAGER + MULTITASKING
   Additive upgrade for NEXUS V1–V3
===================================================== */

(() => {
  "use strict";

  const V4_APPS = {
    ai: { name: "NEXUS AI", icon: "✦" },
    store: { name: "NEXUS Store", icon: "▦" },
    filemanager: { name: "File Manager", icon: "🗂️" }
  };

  Object.assign(APPS, V4_APPS);

  state.installed = Array.isArray(state.installed)
    ? state.installed : [];

  Object.keys(V4_APPS).forEach(id => {
    if (!state.installed.includes(id)) {
      state.installed.push(id);
    }
  });

  const externalApps = {
    vscode: {
      name: "VS Code Web",
      icon: "💻",
      url: "https://vscode.dev"
    },
    photopea: {
      name: "Photopea",
      icon: "🎨",
      url: "https://www.photopea.com"
    },
    canva: {
      name: "Canva",
      icon: "🖌️",
      url: "https://www.canva.com"
    },
    drive: {
      name: "Google Drive",
      icon: "☁️",
      url: "https://drive.google.com"
    },
    youtube: {
      name: "YouTube",
      icon: "▶️",
      url: "https://www.youtube.com"
    },
    wikipedia: {
      name: "Wikipedia",
      icon: "📚",
      url: "https://www.wikipedia.org"
    }
  };

  /* =================================
     APPLICATION ROUTING
  ================================= */

  const originalContent = appContent;
  const originalBind = bindApp;

  appContent = function(app) {
    if (app === "ai") return aiHTML();
    if (app === "store") return storeHTML();
    if (app === "filemanager") return fileHTML();

    if (externalApps[app]) {
      return externalHTML(app);
    }

    return originalContent(app);
  };

  bindApp = function(app, content) {
    if (app === "ai") return bindAI(content);
    if (app === "store") return bindStore(content);
    if (app === "filemanager") return bindFiles(content);

    if (externalApps[app]) {
      return bindExternal(app, content);
    }

    return originalBind(app, content);
  };

  /* =================================
     1. NEXUS AI
  ================================= */

  let apiKey = "";
  let recognition = null;
  let speechEnabled = true;

  let aiSettings = {
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini"
  };

  let conversation = [];

  try {
    aiSettings = {
      ...aiSettings,
      ...JSON.parse(
        localStorage.getItem("nexus_v4_ai") || "{}"
      )
    };
  } catch (_) {}

  function aiHTML() {
    return `
      <div class="v4-ai">

        <div class="v4-heading">
          <div>
            <small>NEXUS INTELLIGENCE</small>
            <h2>NEXUS AI</h2>
            <p>Your personal desktop assistant.</p>
          </div>
          <div class="v4-ai-logo">✦</div>
        </div>

        <details class="v4-settings">
          <summary>AI Connection Settings</summary>

          <input id="v4Endpoint"
            placeholder="API endpoint">

          <input id="v4Model"
            placeholder="AI model">

          <input id="v4Key"
            type="password"
            autocomplete="off"
            placeholder="API key">

          <button class="app-button" id="v4SaveAI">
            Connect AI
          </button>

          <small>
            Your API key is kept in memory for this tab.
            Do not use an untrusted provider.
          </small>
        </details>

        <div class="v4-chat" id="v4Chat">

          <div class="v4-message assistant">
            Hello! I'm NEXUS AI.

            I can answer questions and help you
            navigate your desktop.

            Try asking me something!
          </div>

        </div>

        <div class="v4-compose">

          <textarea id="v4Message"
            rows="2"
            placeholder="Ask NEXUS AI..."></textarea>

          <button class="secondary-button"
            id="v4Voice"
            title="Voice input">🎙</button>

          <button class="app-button"
            id="v4Send">Send</button>

        </div>

        <div class="v4-ai-footer">
          <span id="v4Status">Local assistant ready</span>

          <button class="secondary-button"
            id="v4Speech">Voice replies: ON</button>
        </div>

      </div>
    `;
  }

  function bindAI(root) {
    const chat = root.querySelector("#v4Chat");
    const input = root.querySelector("#v4Message");
    const status = root.querySelector("#v4Status");

    root.querySelector("#v4Endpoint").value =
      aiSettings.endpoint;

    root.querySelector("#v4Model").value =
      aiSettings.model;

    root.querySelector("#v4Key").value = apiKey;

    function message(role, text) {
      const item = document.createElement("div");

      item.className = "v4-message " + role;
      item.textContent = text;

      chat.appendChild(item);
      chat.scrollTop = chat.scrollHeight;
    }

    function localResponse(text) {
      const value = text.toLowerCase();

      if (value.includes("open settings")) {
        openApp("settings");
        return "Opening Settings.";
      }

      if (value.includes("open notes")) {
        openApp("notes");
        return "Opening Notes.";
      }

      if (value.includes("open calculator")) {
        openApp("calculator");
        return "Opening Calculator.";
      }

      if (value.includes("open files")) {
        openApp("filemanager");
        return "Opening File Manager.";
      }

      if (value.includes("open store")) {
        openApp("store");
        return "Opening NEXUS Store.";
      }

      if (value.includes("open browser")) {
        openApp("browser");
        return "Opening Browser.";
      }

      if (value.includes("time")) {
        return "Current time: " +
          new Date().toLocaleTimeString();
      }

      if (value.includes("date")) {
        return "Today's date: " +
          new Date().toLocaleDateString();
      }

      return "I'm currently in local mode. Connect an AI API in my settings to enable full AI conversations. I can also open your NEXUS applications.";
    }

    async function sendMessage() {
      const text = input.value.trim();

      if (!text) return;

      input.value = "";
      message("user", text);

      conversation.push({
        role: "user",
        content: text
      });

      let answer;

      if (!apiKey) {
        answer = localResponse(text);
      } else {
        status.textContent = "Thinking...";

        try {
          const response = await fetch(aiSettings.endpoint, {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + apiKey
            },

            body: JSON.stringify({
              model: aiSettings.model,

              messages: [
                {
                  role: "system",
                  content:
                    "You are NEXUS AI, an assistant inside a browser-based desktop. Be helpful and concise. You cannot directly install native applications or control the user's device."
                },
                ...conversation.slice(-12)
              ]
            })
          });

          if (!response.ok) {
            throw new Error("HTTP " + response.status);
          }

          const data = await response.json();

          answer =
            data.choices?.[0]?.message?.content ||
            "No response received.";

        } catch (error) {
          answer =
            "AI connection failed: " + error.message;

          status.textContent = "Connection error";
        }
      }

      conversation.push({
        role: "assistant",
        content: answer
      });

      message("assistant", answer);

      if (speechEnabled && "speechSynthesis" in window) {
        speechSynthesis.cancel();

        speechSynthesis.speak(
          new SpeechSynthesisUtterance(answer)
        );
      }

      if (apiKey && status.textContent !== "Connection error") {
        status.textContent = "Connected";
      } else if (!apiKey) {
        status.textContent = "Local assistant ready";
      }
    }

    root.querySelector("#v4Send")
      .addEventListener("click", sendMessage);

    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    root.querySelector("#v4SaveAI")
      .addEventListener("click", () => {
        aiSettings.endpoint =
          root.querySelector("#v4Endpoint").value.trim();

        aiSettings.model =
          root.querySelector("#v4Model").value.trim();

        apiKey =
          root.querySelector("#v4Key").value.trim();

        localStorage.setItem(
          "nexus_v4_ai",
          JSON.stringify(aiSettings)
        );

        status.textContent =
          apiKey ? "API key active for this tab" :
          "Local assistant ready";

        showToast("AI settings saved");
      });

    root.querySelector("#v4Voice")
      .addEventListener("click", () => {
        const Speech =
          window.SpeechRecognition ||
          window.webkitSpeechRecognition;

        if (!Speech) {
          status.textContent =
            "Voice recognition unavailable in this browser.";
          return;
        }

        if (recognition) {
          recognition.stop();
          recognition = null;
          return;
        }

        recognition = new Speech();

        recognition.lang = navigator.language || "en-IN";
        recognition.interimResults = false;

        recognition.onresult = event => {
          input.value =
            event.results[0][0].transcript;

          sendMessage();
        };

        recognition.onerror = () => {
          status.textContent =
            "Microphone permission or recognition error.";
        };

        recognition.onend = () => {
          recognition = null;
        };

        status.textContent = "Listening...";
        recognition.start();
      });

    root.querySelector("#v4Speech")
      .addEventListener("click", event => {
        speechEnabled = !speechEnabled;

        event.currentTarget.textContent =
          "Voice replies: " + (speechEnabled ? "ON" : "OFF");

        if (!speechEnabled && "speechSynthesis" in window) {
          speechSynthesis.cancel();
        }
      });
  }

  /* =================================
     2. NEXUS APP STORE
  ================================= */

  function storeHTML() {
    return `
      <div class="v4-store">

        <div class="v4-heading">
          <div>
            <small>NEXUS MARKETPLACE</small>
            <h2>App Store</h2>
            <p>Discover applications for your desktop.</p>
          </div>
        </div>

        <div class="v4-store-grid">

          ${Object.entries(externalApps).map(([id, app]) => `
            <div class="v4-store-card">

              <span class="v4-store-icon">${app.icon}</span>

              <strong>${app.name}</strong>

              <small>Web application</small>

              <button class="app-button"
                data-store-app="${id}">
                ${state.installed.includes(id) ? "Open" : "Install"}
              </button>

            </div>
          `).join("")}

        </div>

        <p class="v4-note">
          These are web applications, not native software.
          Installed apps appear in your NEXUS Start menu.
          Some providers require opening in a separate tab.
        </p>

      </div>
    `;
  }

  function bindStore(root) {
    root.querySelectorAll("[data-store-app]")
      .forEach(button => {

        button.addEventListener("click", () => {
          const id = button.dataset.storeApp;

          if (!state.installed.includes(id)) {
            state.installed.push(id);

            APPS[id] = {
              name: externalApps[id].name,
              icon: externalApps[id].icon
            };

            saveState();
            renderStartApps();

            showToast("Application added to NEXUS");
          }

          openApp(id);
        });
      });
  }

  function externalHTML(id) {
    const app = externalApps[id];

    return `
      <div class="v4-webapp">

        <div class="v4-webapp-icon">${app.icon}</div>

        <h2>${app.name}</h2>

        <p>Ready to launch your web application.</p>

        <button class="app-button"
          id="v4LaunchExternal">
          Launch application ↗
        </button>

        <p class="v4-note">
          This service opens on its official website.
        </p>

      </div>
    `;
  }

  function bindExternal(id, root) {
    root.querySelector("#v4LaunchExternal")
      .addEventListener("click", () => {
        window.open(
          externalApps[id].url,
          "_blank",
          "noopener,noreferrer"
        );
      });
  }

  /* =================================
     3. NEXUS FILE MANAGER
     IndexedDB local file storage
  ================================= */

  const DB_NAME = "nexus_v4_files";
  const STORE_NAME = "files";

  let database = null;

  function openDatabase() {
    if (database) return Promise.resolve(database);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        request.result.createObjectStore(
          STORE_NAME,
          { keyPath: "id" }
        );
      };

      request.onsuccess = () => {
        database = request.result;
        resolve(database);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async function getFiles() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const request = db.transaction(
        STORE_NAME, "readonly"
      ).objectStore(STORE_NAME).getAll();

      request.onsuccess = () =>
        resolve(request.result || []);

      request.onerror = () =>
        reject(request.error);
    });
  }

  async function saveFile(file) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME, "readwrite"
      );

      transaction.objectStore(STORE_NAME).put(file);

      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function deleteFile(id) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME, "readwrite"
      );

      transaction.objectStore(STORE_NAME).delete(id);

      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function fileHTML() {
    return `
      <div class="v4-files">

        <div class="v4-heading">
          <div>
            <small>LOCAL STORAGE</small>
            <h2>File Manager</h2>
            <p>Manage files on this device.</p>
          </div>
        </div>

        <div class="v4-file-toolbar">

          <button class="app-button" id="v4Upload">
            + Add files
          </button>

          <input id="v4FileInput"
            type="file"
            multiple
            hidden>

        </div>

        <input class="app-input"
          id="v4FileSearch"
          placeholder="Search files...">

        <div id="v4FileList" class="v4-file-list">
          Loading...
        </div>

        <p class="v4-note">
          Files are stored in this browser's local database.
          Clearing browser site data can delete them.
        </p>

      </div>
    `;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";

    if (bytes < 1048576) {
      return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function downloadFile(blob, name) {
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function bindFiles(root) {
    const list = root.querySelector("#v4FileList");
    const picker = root.querySelector("#v4FileInput");
    const search = root.querySelector("#v4FileSearch");

    root.querySelector("#v4Upload")
      .addEventListener("click", () => picker.click());

    async function render() {
      try {
        const query = search.value.toLowerCase();

        const files = (await getFiles())
          .filter(file =>
            file.name.toLowerCase().includes(query)
          )
          .sort((a, b) => b.added - a.added);

        list.innerHTML = "";

        if (!files.length) {
          list.innerHTML =
            '<div class="v4-empty">No files found. Add files to get started.</div>';
          return;
        }

        files.forEach(file => {
          const row = document.createElement("div");
          row.className = "v4-file-row";

          const info = document.createElement("div");
          info.className = "v4-file-info";

          const icon = document.createElement("span");

          icon.textContent =
            file.type.startsWith("image/") ? "🖼️" :
            file.type === "application/pdf" ? "📕" : "📄";

          const details = document.createElement("div");

          const name = document.createElement("strong");
          name.textContent = file.name;

          const meta = document.createElement("small");
          meta.textContent =
            formatSize(file.size) + " · " +
            new Date(file.added).toLocaleDateString();

          details.append(name, meta);
          info.append(icon, details);

          const actions = document.createElement("div");
          actions.className = "v4-file-actions";

          const download = document.createElement("button");
          download.textContent = "↓";
          download.title = "Download";

          download.addEventListener("click", () => {
            downloadFile(file.blob, file.name);
          });

          const remove = document.createElement("button");
          remove.textContent = "×";
          remove.title = "Delete";

          remove.addEventListener("click", async () => {
            if (confirm("Delete " + file.name + "?")) {
              await deleteFile(file.id);
              render();
            }
          });

          actions.append(download, remove);
          row.append(info, actions);
          list.appendChild(row);
        });

      } catch (error) {
        list.textContent =
          "Storage error: " + error.message;
      }
    }

    picker.addEventListener("change", async () => {
      try {
        for (const file of Array.from(picker.files || [])) {
          await saveFile({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            added: Date.now(),
            blob: file
          });
        }

        showToast("Files imported successfully");
      } catch (error) {
        showToast("Could not import files: " + error.message);
      }

      picker.value = "";
      render();
    });

    search.addEventListener("input", render);

    render();
  }

  /* =================================
     4. MULTITASKING / SNAP WINDOWS

     Ctrl + Alt + Arrow keys
  ================================= */

  function snapWindow(direction) {
    if (!activeWindow) return;

    const win = windows.get(activeWindow);
    const area = document.getElementById("windowArea");

    if (!win || !area || win.minimized) return;

    const width = area.clientWidth;
    const height = area.clientHeight;

    win.element.classList.remove("maximised");
    win.maximised = false;

    if (direction === "left") {
      Object.assign(win.element.style, {
        left: "0px",
        top: "0px",
        width: width / 2 + "px",
        height: height + "px"
      });
    }

    if (direction === "right") {
      Object.assign(win.element.style, {
        left: width / 2 + "px",
        top: "0px",
        width: width / 2 + "px",
        height: height + "px"
      });
    }

    if (direction === "up") {
      Object.assign(win.element.style, {
        left: "0px",
        top: "0px",
        width: width + "px",
        height: height + "px"
      });
    }

    saveState();
  }

  document.addEventListener("keydown", event => {
    if (!(event.ctrlKey && event.altKey)) return;

    const keys = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up"
    };

    if (keys[event.key]) {
      event.preventDefault();
      snapWindow(keys[event.key]);
    }
  });

  /* Double-click titlebar to maximise */
  document.addEventListener("dblclick", event => {
    const bar = event.target.closest(".window-titlebar");

    if (!bar || event.target.closest(".window-controls")) return;

    const app = bar.closest(".nexus-window")?.dataset.app;

    if (app) maximiseApp(app);
  });

  /* =================================
     INITIALISE V4
  ================================= */

  document.querySelectorAll(".version, .boot-footer")
    .forEach(el => {
      el.textContent = "NEXUS WEB DESKTOP · VERSION 4.0";
    });

  renderStartApps();

  console.log("NEXUS V4 loaded successfully.");

})();
