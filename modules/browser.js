
import {
  getTabs, getActiveTab, addTab, setActiveTab,
  updateTab, closeTab
} from "./tabs.js";
import { searchWeb } from "./search.js";

export function initBrowser(root) {
  let currentUrl = "";
  let historyStack = [];
  let historyIndex = -1;

  root.innerHTML = `
    <div class="browser">
      <div class="browser-tabs" id="browser-tabs"></div>
      <div class="browser-toolbar">
        <button id="back">←</button>
        <button id="forward">→</button>
        <button id="reload">↻</button>
        <input id="address" class="browser-address"
          placeholder="Search or enter website address">
        <button id="go">Go</button>
        <button id="new-tab">＋</button>
      </div>
      <div class="browser-view" id="browser-view"></div>
    </div>`;

  const $ = id => root.querySelector("#"+id);
  const address = $("address");
  const view = $("browser-view");

  function home() {
    currentUrl = "";
    address.value = "";
    view.innerHTML = `
      <div class="browser-home">
        <h1>NEX<span>U</span>S</h1>
        <p>Explore without limits.</p>
        <form class="home-search">
          <input placeholder="Search the internet..." required>
          <button>Search</button>
        </form>
        <p style="color:#91a3c5;font-size:12px">
          Search · Explore · Discover
        </p>
      </div>`;

    view.querySelector("form").onsubmit = event => {
      event.preventDefault();
      navigate(view.querySelector("input").value);
    };
    renderTabs();
  }

  function normalize(input) {
    const value = input.trim();
    if (!value) return null;

    if (/^https?:\/\//i.test(value)) return value;

    if (/^(localhost|[\w-]+\.)+[\w-]{2,}(:\d+)?(\/.*)?$/i.test(value)
        && !value.includes(" ")) {
      return "https://" + value;
    }

    return null;
  }

  async function navigate(input,record=true) {
    const url = normalize(input);

    if (!url) {
      await showSearch(input);
      return;
    }

    currentUrl = url;
    address.value = url;

    if (record) {
      historyStack = historyStack.slice(0,historyIndex+1);
      historyStack.push(url);
      historyIndex++;
    }

    renderTabs();

    view.innerHTML = `
      <iframe class="browser-frame"
        src="${url.replaceAll("&","&amp;").replaceAll('"',"&quot;")}"
        referrerpolicy="strict-origin-when-cross-origin"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-downloads allow-modals">
      </iframe>
      <div style="position:absolute;bottom:8px;left:8px;
        background:#17243b;color:white;padding:6px 10px;
        border-radius:7px;font-size:10px">
        Some websites block embedded viewing.
        <button id="external-open">Open externally ↗</button>
      </div>`;

    view.querySelector("#external-open").onclick = () =>
      window.open(url,"_blank","noopener");

    updateTab(getActiveTab()?.id,{
      url,title:new URL(url).hostname
    });
  }

  async function showSearch(query) {
    currentUrl = "";
    address.value = query;
    view.innerHTML = `<div class="search-results">Searching...</div>`;

    const results = view.querySelector(".search-results");

    try {
      const items = await searchWeb(query);

      results.replaceChildren();

      const heading = document.createElement("h2");
      heading.textContent = `Results for "${query}"`;
      results.append(heading);

      if (!items.length) {
        results.textContent = "No results found. Check your search service.";
        return;
      }

      items.forEach(item => {
        const article = document.createElement("article");
        article.className = "search-result";

        const link = document.createElement("a");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = item.title;

        const desc = document.createElement("p");
        desc.textContent = item.description || item.url;

        const open = document.createElement("button");
        open.className = "nexus-button";
        open.textContent = "Open website";
        open.onclick = () => navigate(item.url);

        article.append(link,desc,open);
        results.append(article);
      });
    } catch(error) {
      results.textContent =
        "Search service is not configured or currently unavailable.";
    }
  }

  function renderTabs() {
    const bar = $("browser-tabs");
    bar.replaceChildren();

    getTabs().forEach(tab => {
      const button = document.createElement("button");
      button.className = "browser-tab" +
        (tab.id === getActiveTab()?.id ? " active" : "");
      button.textContent = tab.title || "New Tab";
      button.onclick = () => {
        setActiveTab(tab.id);
        tab.url ? navigate(tab.url,false) : home();
      };
      bar.append(button);
    });
  }

  function submit() {
    navigate(address.value);
  }

  $("go").onclick = submit;
  address.addEventListener("keydown",event => {
    if(event.key === "Enter") submit();
  });

  $("new-tab").onclick = () => {
    addTab();
    home();
  };

  $("back").onclick = () => {
    if(historyIndex > 0) {
      historyIndex--;
      navigate(historyStack[historyIndex],false);
    }
  };

  $("forward").onclick = () => {
    if(historyIndex < historyStack.length-1) {
      historyIndex++;
      navigate(historyStack[historyIndex],false);
    }
  };

  $("reload").onclick = () => {
    const frame = view.querySelector("iframe");
    if(frame) frame.src = frame.src;
    else home();
  };

  if(!getTabs().length) addTab();
  home();
}

