
/* ==========================================
   PROJECT NEXUS V5 — INTELLIGENT DESKTOP
   Additive upgrade for V1–V4
========================================== */

(() => {
  "use strict";

  if (!window.APPS || !window.appContent || !window.bindApp) {
    console.error("NEXUS V5: Base system unavailable.");
    return;
  }

  const V5_APPS = {
    ai: { name: "NEXUS AI Core", icon: "✦" },
    tasks: { name: "Tasks", icon: "☑️" },
    scratchpad: { name: "Scratchpad", icon: "📓" },
    sync: { name: "Cloud Sync", icon: "☁️" }
  };

  Object.assign(APPS, V5_APPS);

  const STORAGE = "nexus_v5_data";
  const CONFIG = "nexus_v5_config";

  const defaults = {
    tasks: [],
    scratchpad: ""
  };

  let data = loadData();
  let config = {
    aiEndpoint: "",
    syncEndpoint: ""
  };

  try {
    config = {
      ...config,
      ...JSON.parse(localStorage.getItem(CONFIG) || "{}")
    };
  } catch (_) {}

  function loadData() {
    try {
      return {
        ...defaults,
        ...JSON.parse(localStorage.getItem(STORAGE) || "{}")
      };
    } catch (_) {
      return { ...defaults };
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE, JSON.stringify(data));
  }

  function notify(message) {
    if (typeof showToast === "function") showToast(message);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  const oldContent = appContent;
  const oldBind = bindApp;

  appContent = function(app) {
    if (app === "ai") return aiHTML();
    if (app === "tasks") return tasksHTML();
    if (app === "scratchpad") return scratchHTML();
    if (app === "sync") return syncHTML();

    return oldContent(app);
  };

  bindApp = function(app, root) {
    if (app === "ai") return bindAI(root);
    if (app === "tasks") return bindTasks(root);
    if (app === "scratchpad") return bindScratch(root);
    if (app === "sync") return bindSync(root);

    return oldBind(app, root);
  };

  /* AI CORE */

  function aiHTML() {
    return `
      <section class="v5-app">

        <div class="v5-heading">
          <div>
            <small>NEXUS INTELLIGENCE</small>
            <h2>AI Core</h2>
            <p>Your intelligent desktop assistant.</p>
          </div>
          <span class="v5-orb">✦</span>
        </div>

        <details class="v5-settings">
          <summary>AI Connection Settings</summary>

          <input id="v5Endpoint"
            class="app-input"
            placeholder="Trusted AI gateway HTTPS URL">

          <button id="v5SaveEndpoint"
            class="app-button">
            Save connection
          </button>

          <small>
            Use a secure server-side AI gateway.
            Never expose private API keys in public code.
          </small>
        </details>

        <div id="v5Chat" class="v5-chat">
          <div class="v5-message">
            Hello! I'm NEXUS AI Core.

            Try:
            • Open Notes
            • Open Calculator
            • Create a task called Study PPS
            • List apps
          </div>
        </div>

        <div class="v5-compose">
          <input id="v5Prompt"
            class="app-input"
            placeholder="Tell NEXUS what to do...">

          <button id="v5Send" class="app-button">
            Run
          </button>
        </div>

        <div id="v5Review" class="v5-review hidden"></div>

        <small id="v5Status">Local AI action engine ready</small>

      </section>
    `;
  }

  function bindAI(root) {
    const chat = root.querySelector("#v5Chat");
    const prompt = root.querySelector("#v5Prompt");
    const status = root.querySelector("#v5Status");
    const review = root.querySelector("#v5Review");
    const endpoint = root.querySelector("#v5Endpoint");

    endpoint.value = config.aiEndpoint;

    function message(text, type = "") {
      const div = document.createElement("div");
      div.className = "v5-message " + type;
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    function plan(text) {
      const value = text.toLowerCase();

      const open = value.match(
        /(?:open|launch|start) (.+)/
      );

      if (open) {
        const target = open[1].trim();

        const found = Object.entries(APPS).find(
          ([id, app]) =>
            id === target ||
            app.name.toLowerCase() === target
        );

        if (found) {
          return {
            message: "I can open " + found[1].name + ".",
            actions: [{
              type: "open_app",
              appId: found[0]
            }]
          };
        }
      }

      const task = text.match(
        /(?:create|add) (?:a )?task(?: called| named)? (.+)/i
      );

      if (task) {
        return {
          message: "I'll add that task.",
          actions: [{
            type: "create_task",
            title: task[1].trim()
          }]
        };
      }

      if (value.includes("list apps")) {
        return {
          message: Object.values(APPS)
            .map(app => app.name).join(", "),
          actions: []
        };
      }

      if (value.includes("time")) {
        return {
          message: new Date().toLocaleTimeString(),
          actions: []
        };
      }

      return {
        message:
          "I can open applications and manage tasks locally. " +
          "Connect a trusted AI gateway for advanced natural-language planning.",
        actions: []
      };
    }

    function valid(action) {
      if (action.type === "open_app") {
        return !!APPS[action.appId];
      }

      if (action.type === "create_task") {
        return typeof action.title === "string" &&
          action.title.trim().length > 0;
      }

      return false;
    }

    function runActions(actions) {
      actions.filter(valid).forEach(action => {
        if (action.type === "open_app") {
          openApp(action.appId);
        }

        if (action.type === "create_task") {
          data.tasks.push({
            id: crypto.randomUUID
              ? crypto.randomUUID()
              : String(Date.now()),
            title: action.title,
            done: false
          });

          saveData();
        }
      });

      notify("NEXUS actions completed");
    }

    function showReview(actions) {
      review.replaceChildren();

      if (!actions.length) {
        review.classList.add("hidden");
        return;
      }

      const heading = document.createElement("strong");
      heading.textContent = "Approve these actions?";
      review.appendChild(heading);

      actions.forEach(action => {
        const row = document.createElement("p");

        row.textContent =
          action.type === "open_app"
            ? "Open " + APPS[action.appId].name
            : "Create task: " + action.title;

        review.appendChild(row);
      });

      const approve = document.createElement("button");
      approve.className = "app-button";
      approve.textContent = "Approve";

      approve.onclick = () => {
        runActions(actions);
        review.classList.add("hidden");
      };

      const cancel = document.createElement("button");
      cancel.className = "secondary-button";
      cancel.textContent = "Cancel";
      cancel.onclick = () => review.classList.add("hidden");

      review.append(approve, cancel);
      review.classList.remove("hidden");
    }

    async function send() {
      const text = prompt.value.trim();
      if (!text) return;

      prompt.value = "";
      message(text, "user");

      status.textContent = "Planning...";

      let result = plan(text);

      if (config.aiEndpoint) {
        try {
          const response = await fetch(config.aiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: text,
              availableApps: Object.keys(APPS),
              instruction:
                "Return JSON: {message, actions}. " +
                "Actions may only be open_app {appId} " +
                "or create_task {title}. No destructive actions."
            })
          });

          if (!response.ok) throw new Error("AI gateway error");

          const remote = await response.json();

          if (
            typeof remote.message === "string" &&
            Array.isArray(remote.actions)
          ) {
            result = {
              message: remote.message,
              actions: remote.actions.filter(valid)
            };

            status.textContent = "AI connected";
          }

        } catch (error) {
          status.textContent = "Local mode: " + error.message;
        }
      } else {
        status.textContent = "Local action engine ready";
      }

      message(result.message);
      showReview(result.actions);
    }

    root.querySelector("#v5Send").onclick = send;

    prompt.addEventListener("keydown", event => {
      if (event.key === "Enter") send();
    });

    root.querySelector("#v5SaveEndpoint").onclick = () => {
      config.aiEndpoint = endpoint.value.trim();

      localStorage.setItem(
        CONFIG,
        JSON.stringify(config)
      );

      notify("AI connection saved");
    };
  }

  /* TASK MANAGER */

  function tasksHTML() {
    return `
      <section class="v5-app">
        <h2>My Tasks</h2>
        <p>Manage your daily activities.</p>

        <form id="v5TaskForm" class="v5-compose">
          <input id="v5TaskInput"
            class="app-input"
            placeholder="New task..."
            required>
          <button class="app-button">Add</button>
        </form>

        <div id="v5TaskList"></div>
      </section>
    `;
  }

  function bindTasks(root) {
    const list = root.querySelector("#v5TaskList");

    function render() {
      list.replaceChildren();

      data.tasks.forEach((task, index) => {
        const row = document.createElement("div");
        row.className = "v5-task";

        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = task.done;

        check.onchange = () => {
          data.tasks[index].done = check.checked;
          saveData();
          render();
        };

        const title = document.createElement("span");
        title.textContent = task.title;

        if (task.done) title.className = "done";

        const remove = document.createElement("button");
        remove.textContent = "×";

        remove.onclick = () => {
          data.tasks.splice(index, 1);
          saveData();
          render();
        };

        row.append(check, title, remove);
        list.appendChild(row);
      });
    }

    root.querySelector("#v5TaskForm").onsubmit = event => {
      event.preventDefault();

      const input = root.querySelector("#v5TaskInput");

      if (!input.value.trim()) return;

      data.tasks.push({
        id: Date.now(),
        title: input.value.trim(),
        done: false
      });

      input.value = "";
      saveData();
      render();
    };

    render();
  }

  /* SCRATCHPAD */

  function scratchHTML() {
    return `
      <section class="v5-app">
        <h2>Scratchpad</h2>
        <p>Your quick notes, saved automatically.</p>

        <textarea id="v5Scratch"
          class="app-textarea"
          placeholder="Start writing..."></textarea>

        <button id="v5Export" class="app-button">
          Export notes
        </button>
      </section>
    `;
  }

  function bindScratch(root) {
    const area = root.querySelector("#v5Scratch");

    area.value = data.scratchpad;

    area.oninput = () => {
      data.scratchpad = area.value;
      saveData();
    };

    root.querySelector("#v5Export").onclick = () => {
      const blob = new Blob(
        [area.value],
        { type: "text/plain" }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "nexus-notes.txt";
      a.click();

      URL.revokeObjectURL(url);
    };
  }

  /* CLOUD SYNC */

  function syncHTML() {
    return `
      <section class="v5-app">
        <h2>Cloud Sync</h2>
        <p>Backup and restore your NEXUS V5 workspace.</p>

        <input id="v5SyncURL"
          class="app-input"
          placeholder="Your HTTPS sync endpoint">

        <button id="v5SaveSync" class="secondary-button">
          Save endpoint
        </button>

        <button id="v5Backup" class="app-button">
          Download backup
        </button>

        <button id="v5Upload" class="app-button">
          Upload to cloud
        </button>

        <button id="v5Restore" class="secondary-button">
          Restore from cloud
        </button>

        <p id="v5SyncStatus"></p>
      </section>
    `;
  }

  function bindSync(root) {
    const url = root.querySelector("#v5SyncURL");
    const status = root.querySelector("#v5SyncStatus");

    url.value = config.syncEndpoint;

    function snapshot() {
      return {
        version: 5,
        savedAt: new Date().toISOString(),
        data
      };
    }

    root.querySelector("#v5SaveSync").onclick = () => {
      config.syncEndpoint = url.value.trim();

      localStorage.setItem(
        CONFIG,
        JSON.stringify(config)
      );

      status.textContent = "Endpoint saved.";
    };

    root.querySelector("#v5Backup").onclick = () => {
      const blob = new Blob(
        [JSON.stringify(snapshot(), null, 2)],
        { type: "application/json" }
      );

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "nexus-v5-backup.json";
      link.click();
      URL.revokeObjectURL(link.href);
    };

    root.querySelector("#v5Upload").onclick = async () => {
      if (!config.syncEndpoint) {
        status.textContent = "Configure a sync endpoint first.";
        return;
      }

      try {
        const response = await fetch(config.syncEndpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot())
        });

        if (!response.ok) throw new Error("Upload failed");

        status.textContent = "Cloud backup uploaded.";
      } catch (error) {
        status.textContent = error.message;
      }
    };

    root.querySelector("#v5Restore").onclick = async () => {
      if (!config.syncEndpoint) return;

      if (!confirm("Replace local tasks and notes with cloud backup?")) return;

      try {
        const response = await fetch(config.syncEndpoint);

        if (!response.ok) throw new Error("Restore failed");

        const remote = await response.json();

        if (
          !remote.data ||
          !Array.isArray(remote.data.tasks) ||
          typeof remote.data.scratchpad !== "string"
        ) {
          throw new Error("Invalid backup format");
        }

        data = remote.data;
        saveData();

        status.textContent = "Workspace restored.";
      } catch (error) {
        status.textContent = error.message;
      }
    };
  }

  document.querySelectorAll(".version, .boot-footer")
    .forEach(el => {
      el.textContent = "NEXUS WEB DESKTOP · VERSION 5.0";
    });

  renderStartApps();

  console.log("NEXUS V5 loaded successfully.");

})();
