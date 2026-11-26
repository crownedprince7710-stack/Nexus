
/* ==========================================
   PROJECT NEXUS 3.0
   WALLPAPER STUDIO
   Image + Video + Smart Pause
========================================== */

(() => {
  "use strict";

  const DB_NAME = "nexus_v3_media";
  const STORE = "wallpapers";
  const KEY = "active";
  const MAX_SIZE = 180 * 1024 * 1024;

  const desktop = document.getElementById("desktop");
  const area = document.getElementById("windowArea");
  const wallpaper = document.querySelector(".desktop-wallpaper");

  if (!desktop || !wallpaper) return;

  let db;
  let mediaUrl = null;
  let video = null;
  let customMedia = null;

  /* DATABASE */

  function openDatabase() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE);
      };

      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async function storeMedia(record) {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record, KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function readMedia() {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const request = database
        .transaction(STORE, "readonly")
        .objectStore(STORE)
        .get(KEY);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteMedia() {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  /* MEDIA MANAGEMENT */

  function clearVideo() {
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      video = null;
    }
  }

  function clearObjectURL() {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    mediaUrl = null;
  }

  function applyImage(blob) {
    clearVideo();
    clearObjectURL();

    mediaUrl = URL.createObjectURL(blob);

    wallpaper.style.background =
      `center / cover no-repeat url("${mediaUrl}")`;

    wallpaper.dataset.mediaActive = "true";
    wallpaper.dataset.nexusWallpaper = "custom";
  }

  function applyVideo(blob) {
    clearVideo();
    clearObjectURL();

    mediaUrl = URL.createObjectURL(blob);

    wallpaper.style.background = "none";

    video = document.createElement("video");

    video.className = "nexus-wallpaper-video";
    video.src = mediaUrl;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");

    wallpaper.prepend(video);

    wallpaper.dataset.mediaActive = "true";
    wallpaper.dataset.nexusWallpaper = "custom";

    updatePlayback();
  }

  function applyRecord(record) {
    if (!record || !record.blob) return;

    customMedia = record;

    if (record.type === "video") {
      applyVideo(record.blob);
    } else {
      applyImage(record.blob);
    }
  }

  /* SMART PAUSE */

  function hasVisibleWindow() {
    if (!area) return false;

    return [...area.querySelectorAll(".nexus-window")].some(win => {
      return !win.classList.contains("hidden") &&
        getComputedStyle(win).display !== "none" &&
        getComputedStyle(win).visibility !== "hidden";
    });
  }

  function updatePlayback() {
    if (!video) return;

    const desktopVisible = !desktop.classList.contains("hidden");

    const shouldPlay =
      desktopVisible &&
      !document.hidden &&
      !hasVisibleWindow();

    if (shouldPlay) {
      video.play().catch(() => {
        const hint = document.getElementById("nexusVideoHint");

        if (hint) {
          hint.textContent =
            "Your browser may require a user gesture to start video playback.";
        }
      });
    } else {
      video.pause();
    }
  }

  /* FILE UPLOAD */

  async function uploadWallpaper(file) {
    if (!file) return;

    const image = file.type.startsWith("image/");
    const movie = file.type.startsWith("video/");

    if (!image && !movie) {
      setStatus("Please choose an image or video.");
      return;
    }

    if (movie && ![
      "video/mp4",
      "video/webm",
      "video/ogg"
    ].includes(file.type)) {
      setStatus("Use MP4, WebM or OGG video.");
      return;
    }

    if (file.size > MAX_SIZE) {
      setStatus("Choose a file smaller than 180 MB.");
      return;
    }

    try {
      setStatus("Saving your wallpaper...");

      const record = {
        type: movie ? "video" : "image",
        name: file.name,
        blob: file,
        updated: Date.now()
      };

      await storeMedia(record);

      applyRecord(record);

      setStatus("Applied: " + file.name);

      toast("Wallpaper saved successfully");

    } catch (error) {
      console.error(error);

      setStatus("Storage failed. Try a smaller file.");
      toast("Could not save wallpaper");
    }
  }

  function setStatus(message) {
    const el = document.getElementById("nexusWallpaperStatus");
    if (el) el.textContent = message;
  }

  function toast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
    }
  }

  /* BUILT-IN WALLPAPER */

  async function useDefaultWallpaper() {
    await deleteMedia();

    customMedia = null;

    clearVideo();
    clearObjectURL();

    wallpaper.style.background = "";
    wallpaper.dataset.mediaActive = "false";

    if (typeof window.applySettings === "function") {
      window.applySettings();
    }

    setStatus("NEXUS wallpaper restored.");
  }

  /* WALLPAPER STUDIO */

  function renderStudio() {
    const root = document.querySelector(
      '.nexus-window[data-app="settings"] .window-content'
    );

    if (!root || root.querySelector(".nexus-v3-studio")) return;

    const panel = document.createElement("section");

    panel.className = "nexus-v3-studio";

    panel.innerHTML = `
      <div class="nexus-v3-heading">
        <div>
          <span>NEXUS 3.0</span>
          <h3>Wallpaper Studio</h3>
          <p>Personalise your desktop with your own media.</p>
        </div>
        <div class="nexus-v3-star">✦</div>
      </div>

      <div class="nexus-v3-uploads">

        <label class="nexus-v3-upload">
          <span>▧</span>
          <strong>Choose Image</strong>
          <small>JPG · PNG · WebP · GIF</small>
          <input type="file"
            data-image
            accept="image/*">
        </label>

        <label class="nexus-v3-upload">
          <span>▶</span>
          <strong>Choose Video</strong>
          <small>MP4 · WebM · OGG</small>
          <input type="file"
            data-video
            accept="video/mp4,video/webm,video/ogg">
        </label>

      </div>

      <div class="nexus-v3-option">
        <div>
          <strong>Smart Pause</strong>
          <small>Pause when an application window is open.</small>
        </div>
        <span>ON</span>
      </div>

      <div class="nexus-v3-option">
        <div>
          <strong>Automatic Loop</strong>
          <small>Replay video continuously.</small>
        </div>
        <span>ON</span>
      </div>

      <div class="nexus-v3-option">
        <div>
          <strong>Video Audio</strong>
          <small>Keep desktop video muted.</small>
        </div>
        <span>MUTED</span>
      </div>

      <div class="nexus-v3-buttons">
        <button class="app-button" data-default>
          Default Wallpaper
        </button>

        <button class="secondary-button" data-remove>
          Remove Custom Media
        </button>
      </div>

      <p id="nexusWallpaperStatus">
        Choose a wallpaper from your device gallery.
      </p>

      <small id="nexusVideoHint">
        Video plays on the desktop and pauses while an app is visible.
      </small>
    `;

    root.appendChild(panel);

    panel.querySelector("[data-image]")
      .addEventListener("change", e => {
        uploadWallpaper(e.target.files[0]);
        e.target.value = "";
      });

    panel.querySelector("[data-video]")
      .addEventListener("change", e => {
        uploadWallpaper(e.target.files[0]);
        e.target.value = "";
      });

    panel.querySelector("[data-default]")
      .addEventListener("click", useDefaultWallpaper);

    panel.querySelector("[data-remove]")
      .addEventListener("click", async () => {
        await useDefaultWallpaper();
        setStatus("Custom wallpaper removed.");
      });

    if (customMedia) {
      setStatus("Active: " + customMedia.name);
    }
  }

  /* KEEP CUSTOM WALLPAPER AFTER NORMAL SETTINGS APPLY */

  const originalApply = window.applySettings;

  if (typeof originalApply === "function") {
    window.applySettings = function() {
      originalApply.apply(this, arguments);

      if (customMedia) {
        applyRecord(customMedia);
      }
    };
  }

  /* INITIALISE */

  async function initialise() {
    try {
      const saved = await readMedia();

      if (saved) {
        applyRecord(saved);
      }
    } catch (error) {
      console.warn("NEXUS media restore failed", error);
    }

    const observer = new MutationObserver(() => {
      renderStudio();
      updatePlayback();
    });

    if (area) {
      observer.observe(area, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"]
      });
    }

    const desktopObserver = new MutationObserver(updatePlayback);

    desktopObserver.observe(desktop, {
      attributes: true,
      attributeFilter: ["class"]
    });

    document.addEventListener("visibilitychange", updatePlayback);
    window.addEventListener("focus", updatePlayback);
    window.addEventListener("pageshow", updatePlayback);

    renderStudio();
    updatePlayback();

    document.querySelectorAll(".version, .boot-footer")
      .forEach(el => {
        el.textContent = "NEXUS WEB DESKTOP · VERSION 3.0";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, {
      once: true
    });
  } else {
    initialise();
  }

})();
