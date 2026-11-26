
/* ==========================================
   PROJECT NEXUS — DRIVE 2.0
   Folder-based virtual file manager
========================================== */

let driveCurrentFolderId = null;
let driveSearchText = "";
let driveSortMode = "name";
let driveEditingFileId = null;

const driveOriginalBindApp = bindApp;

function driveEnsureData() {
  if (!Array.isArray(state.files)) state.files = [];
  if (!Array.isArray(state.driveFolders)) state.driveFolders = [];

  state.files.forEach(file => {
    if (typeof file.content !== "string") file.content = "";
    if (!file.id) file.id = String(Date.now()) + Math.random();
  });
}

function driveId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "drive-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

function driveEscape(value) {
  return escapeHTML(String(value ?? ""));
}

function driveFolderName(id) {
  if (!id) return "My Drive";
  const folder = state.driveFolders.find(item => item.id === id);
  return folder ? folder.name : "My Drive";
}

function driveRender(content) {
  driveEnsureData();

  const folders = state.driveFolders.filter(folder =>
    (folder.parentId || null) === driveCurrentFolderId
  );

  let files = state.files.filter(file =>
    (file.folderId || null) === driveCurrentFolderId
  );

  if (driveSearchText) {
    const query = driveSearchText.toLowerCase();
    files = files.filter(file =>
      file.name.toLowerCase().includes(query) ||
      file.content.toLowerCase().includes(query)
    );
  }

  files.sort((a, b) => {
    if (driveSortMode === "newest") return
      (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    if (driveSortMode === "type") {
      return a.name.split(".").pop().localeCompare(b.name.split(".").pop());
    }
    return a.name.localeCompare(b.name);
  });

  const folder = state.driveFolders.find(item =>
    item.id === driveCurrentFolderId
  );

  const breadcrumbs = [];
  let current = folder;

  while (current) {
    breadcrumbs.unshift(current);
    current = state.driveFolders.find(item => item.id === current.parentId);
  }

  const breadcrumbHTML = `
    <button class="drive-crumb" data-drive-home>My Drive</button>
    ${breadcrumbs.map(item => `
      <span class="drive-separator">/</span>
      <button class="drive-crumb" data-drive-folder="${driveEscape(item.id)}">
        ${driveEscape(item.name)}
      </button>
    `).join("")}
  `;

  content.innerHTML = `
    <div class="drive-app">
      <div class="drive-heading">
        <div>
          <h2>NEXUS Drive</h2>
          <p>Your personal file space, stored in this browser.</p>
        </div>
        <span class="drive-storage-icon">◈</span>
      </div>

      <div class="drive-toolbar">
        <button class="app-button" data-drive-action="new-file">＋ New file</button>
        <button class="secondary-button" data-drive-action="new-folder">＋ Folder</button>
        <button class="secondary-button" data-drive-action="upload">↑ Upload</button>
        <button class="secondary-button" data-drive-action="export">Export</button>
      </div>

      <div class="drive-breadcrumbs">${breadcrumbHTML}</div>

      <div class="drive-tools">
        <input class="app-input drive-search"
          id="driveSearch"
          placeholder="Search files in this folder..."
          value="${driveEscape(driveSearchText)}">

        <select class="app-select drive-sort" id="driveSort">
          <option value="name">Name</option>
          <option value="newest">Newest</option>
          <option value="type">File type</option>
        </select>
      </div>

      <div class="drive-list">
        ${folders.map(item => `
          <div class="drive-item">
            <button class="drive-open" data-drive-folder="${driveEscape(item.id)}">
              <span class="drive-file-icon">📁</span>
              <span class="drive-item-name">${driveEscape(item.name)}</span>
              <small>Folder</small>
            </button>
            <button class="drive-more" data-drive-menu="folder"
              data-drive-id="${driveEscape(item.id)}" title="Folder options">•••</button>
          </div>
        `).join("")}

        ${files.map(file => `
          <div class="drive-item">
            <button class="drive-open" data-drive-file="${driveEscape(file.id)}">
              <span class="drive-file-icon">📄</span>
              <span class="drive-item-name">${driveEscape(file.name)}</span>
              <small>${driveFormatDate(file.updatedAt || file.createdAt)}</small>
            </button>
            <button class="drive-more" data-drive-menu="file"
              data-drive-id="${driveEscape(file.id)}" title="File options">•••</button>
          </div>
        `).join("")}

        ${!folders.length && !files.length ? `
          <div class="drive-empty">
            <span>📂</span>
            <h3>This folder is empty</h3>
            <p>Create a folder or a text file to get started.</p>
          </div>
        ` : ""}
      </div>

      <div class="drive-footer">
        ${folders.length} folders · ${files.length} files
        <span>Saved locally</span>
      </div>

      <input type="file" id="driveUploadInput" hidden multiple>
    </div>
  `;

  const sort = content.querySelector("#driveSort");
  sort.value = driveSortMode;

  content.querySelector("#driveSearch").addEventListener("input", event => {
    driveSearchText = event.target.value;
    const position = event.target.selectionStart;
    driveRender(content);
    const input = content.querySelector("#driveSearch");
    input.focus();
    input.setSelectionRange(position, position);
  });

  sort.addEventListener("change", event => {
    driveSortMode = event.target.value;
    driveRender(content);
  });

  content.querySelectorAll("[data-drive-home]").forEach(button => {
    button.addEventListener("click", () => {
      driveCurrentFolderId = null;
      driveSearchText = "";
      driveRender(content);
    });
  });

  content.querySelectorAll("[data-drive-folder]").forEach(button => {
    button.addEventListener("click", () => {
      driveCurrentFolderId = button.dataset.driveFolder;
      driveSearchText = "";
      driveRender(content);
    });
  });

  content.querySelectorAll("[data-drive-file]").forEach(button => {
    button.addEventListener("click", () => {
      driveOpenFile(button.dataset.driveFile, content);
    });
  });

  content.querySelectorAll("[data-drive-action]").forEach(button => {
    button.addEventListener("click", () => {
      driveAction(button.dataset.driveAction, content);
    });
  });

  content.querySelectorAll("[data-drive-menu]").forEach(button => {
    button.addEventListener("click", () => {
      driveItemMenu(
        button.dataset.driveMenu,
        button.dataset.driveId,
        content
      );
    });
  });

  content.querySelector("#driveUploadInput").addEventListener("change", async event => {
    await driveImportFiles(event.target.files);
    event.target.value = "";
    driveRender(content);
  });
}

function driveFormatDate(value) {
  if (!value) return "Text file";
  return new Date(value).toLocaleDateString();
}

function driveAction(action, content) {
  if (action === "new-file") {
    const name = prompt("File name:", "New document.txt");
    if (!name || !name.trim()) return;

    const now = Date.now();
    state.files.push({
      id: driveId(),
      name: name.trim(),
      content: "",
      folderId: driveCurrentFolderId,
      createdAt: now,
      updatedAt: now
    });

    saveState();
    driveRender(content);
    showToast("File created");
  }

  if (action === "new-folder") {
    const name = prompt("Folder name:", "New folder");
    if (!name || !name.trim()) return;

    state.driveFolders.push({
      id: driveId(),
      name: name.trim(),
      parentId: driveCurrentFolderId,
      createdAt: Date.now()
    });

    saveState();
    driveRender(content);
    showToast("Folder created");
  }

  if (action === "upload") {
    content.querySelector("#driveUploadInput").click();
  }

  if (action === "export") {
    downloadFile(
      "NEXUS-Drive-Backup.json",
      JSON.stringify({
        files: state.files,
        folders: state.driveFolders
      }, null, 2),
      "application/json"
    );
    showToast("Drive backup exported");
  }
}

function driveOpenFile(id, content) {
  const file = state.files.find(item => item.id === id);
  if (!file) return;

  driveEditingFileId = id;

  content.innerHTML = `
    <div class="drive-editor">
      <div class="drive-editor-top">
        <button class="secondary-button" id="driveBack">← Back to Drive</button>
        <span>TEXT EDITOR</span>
      </div>

      <input class="app-input" id="driveFileName"
        value="${driveEscape(file.name)}">

      <textarea class="app-textarea drive-editor-area"
        id="driveFileContent"
        placeholder="Start writing..."></textarea>

      <div class="drive-editor-bottom">
        <span id="driveSaveStatus">Ready to edit</span>
        <button class="app-button" id="driveSave">Save changes</button>
      </div>
    </div>
  `;

  content.querySelector("#driveFileContent").value = file.content;

  content.querySelector("#driveBack").addEventListener("click", () => {
    driveRender(content);
  });

  content.querySelector("#driveSave").addEventListener("click", () => {
    const newName = content.querySelector("#driveFileName").value.trim();

    if (!newName) {
      showToast("Please enter a file name");
      return;
    }

    file.name = newName;
    file.content = content.querySelector("#driveFileContent").value;
    file.updatedAt = Date.now();

    saveState();
    content.querySelector("#driveSaveStatus").textContent = "All changes saved";
    showToast("File saved successfully");
  });
}

function driveItemMenu(type, id, content) {
  const isFolder = type === "folder";
  const item = isFolder
    ? state.driveFolders.find(value => value.id === id)
    : state.files.find(value => value.id === id);

  if (!item) return;

  const choice = prompt(
    `${item.name}\n\nR = Rename\nD = Delete${isFolder ? " folder and contents" : " file"}`
  );

  if (!choice) return;

  if (choice.toLowerCase() === "r") {
    const name = prompt("Enter new name:", item.name);
    if (name && name.trim()) item.name = name.trim();
  }

  if (choice.toLowerCase() === "d") {
    if (!confirm(`Delete "${item.name}"?`)) return;

    if (isFolder) {
      driveDeleteFolder(id);
    } else {
      state.files = state.files.filter(file => file.id !== id);
    }
  }

  saveState();
  driveRender(content);
}

function driveDeleteFolder(folderId) {
  const childFolders = state.driveFolders.filter(
    folder => folder.parentId === folderId
  );

  childFolders.forEach(folder => driveDeleteFolder(folder.id));

  state.driveFolders = state.driveFolders.filter(
    folder => folder.id !== folderId
  );

  state.files = state.files.filter(file => file.folderId !== folderId);
}

async function driveImportFiles(fileList) {
  for (const file of Array.from(fileList || [])) {
    try {
      const content = await file.text();
      const now = Date.now();

      state.files.push({
        id: driveId(),
        name: file.name,
        content,
        folderId: driveCurrentFolderId,
        createdAt: now,
        updatedAt: now
      });
    } catch {
      showToast("Could not import " + file.name);
    }
  }

  saveState();
  showToast("Import complete");
}

/* Keep every other NEXUS app unchanged. */
bindApp = function(app, content) {
  if (app === "explorer") {
    driveRender(content);
    return;
  }

  driveOriginalBindApp(app, content);
};

driveEnsureData();

/* Refresh Explorer if it was restored during startup. */
if (windows.has("explorer")) {
  closeApp("explorer", true);
  openApp("explorer");
}
