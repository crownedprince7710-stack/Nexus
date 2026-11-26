
import { Store } from "./storage.js";

export function initFiles(root) {
  const nexus = window.NexusApp;

  root.innerHTML = `
    <div class="file-layout">
      <aside class="file-sidebar">
        <button data-folder="all">🏠 Home</button>
        <button data-folder="files">📁 All files</button>
        <button data-folder="images">🖼 Images</button>
        <button data-folder="documents">📄 Documents</button>
        <button data-folder="videos">🎬 Videos</button>
        <button data-folder="downloads">⬇ Downloads</button>
      </aside>
      <section class="file-content">
        <h3 id="folder-heading">Home</h3>
        <button id="upload-file" class="nexus-button">＋ Add file</button>
        <div class="file-grid" id="explorer-grid" style="margin-top:20px"></div>
      </section>
    </div>`;

  const grid = root.querySelector("#explorer-grid");
  const heading = root.querySelector("#folder-heading");

  let filter = "all";

  function category(file) {
    if(file.type?.startsWith("image/")) return "images";
    if(file.type?.startsWith("video/")) return "videos";
    if(file.type?.includes("pdf") ||
       file.type?.includes("text") ||
       file.name.match(/\.(doc|docx|txt|pdf|xls|ppt)$/i)) {
      return "documents";
    }
    return "files";
  }

  async function refresh() {
    grid.replaceChildren();

    if(!nexus?.storage) {
      grid.textContent = "Storage unavailable.";
      return;
    }

    const files = await Store.all(nexus.storage,"files");

    const filtered = files.filter(file =>
      filter === "all" ||
      filter === "downloads" ||
      filter === "files" ||
      category(file) === filter
    );

    heading.textContent = filter === "all" ? "Home" : filter;

    filtered.forEach(file => {
      const card = document.createElement("div");
      card.className = "file-card";

      const symbol = document.createElement("span");
      symbol.className = "file-symbol";
      symbol.textContent =
        category(file) === "images" ? "🖼️" :
        category(file) === "videos" ? "🎬" :
        category(file) === "documents" ? "📄" : "📦";

      const name = document.createElement("div");
      name.textContent = file.name;

      const open = document.createElement("button");
      open.textContent = "Open";
      open.className = "nexus-button";
      open.onclick = () => {
        if(file.type?.startsWith("image/") ||
           file.type?.startsWith("video/") ||
           file.type?.startsWith("text/") ||
           file.type?.includes("pdf")) {
          const url = URL.createObjectURL(file.blob);
          window.open(url,"_blank","noopener");
        } else {
          const url = URL.createObjectURL(file.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url),3000);
        }
      };

      const remove = document.createElement("button");
      remove.textContent = "Delete";
      remove.onclick = async () => {
        if(confirm(`Delete ${file.name}?`)) {
          await Store.delete(nexus.storage,"files",file.id);
          refresh();
        }
      };

      card.append(symbol,name,open,remove);
      grid.append(card);
    });

    if(!filtered.length) grid.textContent = "This folder is empty.";
  }

  root.querySelectorAll("[data-folder]").forEach(button => {
    button.onclick = () => {
      filter = button.dataset.folder;
      refresh();
    };
  });

  root.querySelector("#upload-file").onclick = () => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.multiple = true;

    picker.onchange = async () => {
      for(const file of picker.files || []) {
        await Store.put(nexus.storage,"files",{
          id:crypto.randomUUID(),
          name:file.name,
          type:file.type,
          size:file.size,
          blob:file,
          created:Date.now()
        });
      }
      nexus.notify("Files added.");
      refresh();
    };

    picker.click();
  };

  refresh();
}

