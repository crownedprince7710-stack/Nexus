
import { Store } from "./storage.js";

export function initDownloads(root) {
  const nexus = window.NexusApp;
  root.innerHTML = `
    <div class="panel">
      <h2>⬇ Downloads</h2>
      <p style="color:#9ba9c2;font-size:12px">
        Files downloaded or saved from NEXUS.
      </p>
      <button class="nexus-button" id="save-file">
        Save a file
      </button>
      <div id="download-list" class="file-grid" style="margin-top:20px"></div>
    </div>`;

  const list = root.querySelector("#download-list");

  async function refresh() {
    list.replaceChildren();

    if (!nexus?.storage) {
      list.textContent = "Storage is initializing.";
      return;
    }

    const files = await Store.all(nexus.storage,"files");

    files.forEach(file => {
      const card = document.createElement("div");
      card.className = "file-card";

      const symbol = document.createElement("span");
      symbol.className = "file-symbol";
      symbol.textContent = "📄";

      const name = document.createElement("div");
      name.textContent = file.name;

      const download = document.createElement("button");
      download.textContent = "Export";
      download.className = "nexus-button";
      download.onclick = () => {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url),3000);
      };

      const remove = document.createElement("button");
      remove.textContent = "Delete";
      remove.onclick = async () => {
        await Store.delete(nexus.storage,"files",file.id);
        refresh();
      };

      card.append(symbol,name,download,remove);
      list.append(card);
    });

    if (!files.length) {
      list.textContent = "No downloaded files yet.";
    }
  }

  root.querySelector("#save-file").onclick = async () => {
    if (!nexus?.storage) return;

    const picker = document.createElement("input");
    picker.type = "file";

    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;

      await Store.put(nexus.storage,"files",{
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        blob: file,
        created: Date.now()
      });

      nexus.notify("File saved to NEXUS storage.");
      refresh();
    };

    picker.click();
  };

  refresh();
}

