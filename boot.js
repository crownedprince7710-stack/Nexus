
/* ==========================================
   PROJECT NEXUS
   BOOT EXPERIENCE 1.0
========================================== */

(() => {
  "use strict";

  const BOOT_DURATION = 4300;

  const desktop = document.getElementById("desktop");
  const welcome = document.getElementById("welcomeScreen");
  const enterButton = document.getElementById("enterButton");

  if (!desktop || !welcome || !enterButton) return;

  let bootRunning = false;
  let bootTimer = null;

  const boot = document.createElement("section");

  boot.id = "nexusBoot";
  boot.className = "nexus-boot hidden";

  boot.innerHTML = `
    <div class="boot-background"></div>

    <div class="boot-content">

      <div class="boot-logo">
        <span>N</span>
      </div>

      <div class="boot-brand">
        NEXUS<span>.</span>
      </div>

      <p class="boot-subtitle">
        YOUR PERSONAL DIGITAL SPACE
      </p>

      <div class="boot-loader">
        <div class="boot-loader-fill"></div>
      </div>

      <p class="boot-status" id="bootStatus">
        Initialising system...
      </p>

      <button class="boot-skip" id="bootSkip">
        SKIP INTRO
      </button>

    </div>

    <div class="boot-footer">
      NEXUS WEB DESKTOP · VERSION 1.0
    </div>
  `;

  document.body.appendChild(boot);

  const status = boot.querySelector("#bootStatus");
  const skip = boot.querySelector("#bootSkip");

  const messages = [
    "Initialising system...",
    "Loading desktop environment...",
    "Restoring workspace...",
    "Preparing your desktop...",
    "Welcome to NEXUS."
  ];

  let messageIndex = 0;
  let messageTimer = null;

  function showBoot() {
    if (bootRunning) return;

    bootRunning = true;

    clearTimeout(bootTimer);

    welcome.classList.add("hidden");
    desktop.classList.add("hidden");

    boot.classList.remove("hidden");

    messageIndex = 0;
    status.textContent = messages[0];

    messageTimer = setInterval(() => {
      messageIndex = Math.min(
        messageIndex + 1,
        messages.length - 1
      );

      status.textContent = messages[messageIndex];
    }, 850);

    bootTimer = setTimeout(finishBoot, BOOT_DURATION);
  }

  function finishBoot() {
    if (!bootRunning) return;

    bootRunning = false;

    clearTimeout(bootTimer);
    clearInterval(messageTimer);

    boot.classList.add("boot-exit");

    setTimeout(() => {
      boot.classList.add("hidden");
      boot.classList.remove("boot-exit");

      if (typeof window.enterDesktop === "function") {
        window.enterDesktop();
      } else {
        welcome.classList.add("hidden");
        desktop.classList.remove("hidden");
      }

    }, 450);
  }

  // First startup: intercept the welcome button.
  enterButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    showBoot();
  }, true);

  // Returning session: show boot before revealing desktop.
  try {
    const saved = JSON.parse(
      localStorage.getItem("nexus_state") || "{}"
    );

    if (saved.entered === true) {
      showBoot();
    }
  } catch (error) {
    console.warn("NEXUS boot session could not be read.", error);
  }

  skip.addEventListener("click", finishBoot);

})();
