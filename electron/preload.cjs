const { contextBridge, ipcRenderer } = require("electron");

// Only these four calls are exposed to the page; no Node access leaks into the renderer.
contextBridge.exposeInMainWorld("plannerUpdater", {
  check: () => ipcRenderer.invoke("updater:check"),
  download: () => ipcRenderer.invoke("updater:download"),
  install: () => ipcRenderer.invoke("updater:install"),
  onStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("updater:status", listener);
    return () => ipcRenderer.off("updater:status", listener);
  },
});
