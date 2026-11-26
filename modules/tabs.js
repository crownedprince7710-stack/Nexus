
let activeTab = 0;
let tabs = [];

export function initTabs() {
  tabs = [{id:1,title:"New Tab",url:""}];
  activeTab = 1;
}

export function getTabs() {
  return tabs;
}

export function getActiveTab() {
  return tabs.find(tab => tab.id === activeTab);
}

export function addTab(url="") {
  const id = Date.now();
  tabs.push({id,title:"New Tab",url});
  activeTab = id;
  return id;
}

export function setActiveTab(id) {
  if (tabs.some(tab => tab.id === id)) activeTab = id;
}

export function updateTab(id,changes) {
  tabs = tabs.map(tab => tab.id === id ? {...tab,...changes} : tab);
}

export function closeTab(id) {
  tabs = tabs.filter(tab => tab.id !== id);
  if (activeTab === id) activeTab = tabs.at(-1)?.id || addTab();
}

