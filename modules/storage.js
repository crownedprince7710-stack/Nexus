
const DB_NAME = "NEXUS_V5_DATABASE";
const DB_VERSION = 1;

export function initStorage() {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open(DB_NAME,DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files",{keyPath:"id"});
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings",{keyPath:"key"});
      }

      if (!db.objectStoreNames.contains("bookmarks")) {
        db.createObjectStore("bookmarks",{keyPath:"url"});
      }

      if (!db.objectStoreNames.contains("history")) {
        db.createObjectStore("history",{keyPath:"id",autoIncrement:true});
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction(db,store,mode,action) {
  return new Promise((resolve,reject) => {
    const tx = db.transaction(store,mode);
    const request = action(tx.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const Store = {
  put(db,store,value) {
    return transaction(db,store,"readwrite",s => s.put(value));
  },
  get(db,store,key) {
    return transaction(db,store,"readonly",s => s.get(key));
  },
  all(db,store) {
    return transaction(db,store,"readonly",s => s.getAll());
  },
  delete(db,store,key) {
    return transaction(db,store,"readwrite",s => s.delete(key));
  },
  clear(db,store) {
    return transaction(db,store,"readwrite",s => s.clear());
  }
};

