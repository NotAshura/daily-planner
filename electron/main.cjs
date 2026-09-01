const { app, BrowserWindow, Menu, net, protocol, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const distPath = path.join(__dirname, "..", "dist");
const isDev = !app.isPackaged && process.env.PLANNER_DEV_URL;
const UPDATE_CHECK_DELAY_MS = 5000;
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
// Auf false setzen, wenn die App ohne Update-Prüfung laufen soll.
const AUTO_UPDATE_ENABLED = true;

function startUpdateChecks() {
  if (!app.isPackaged || !AUTO_UPDATE_ENABLED) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // A missing release or no network must never surface as a crash dialog.
  autoUpdater.on("error", () => {});

  const check = () => void autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  setTimeout(check, UPDATE_CHECK_DELAY_MS);
  setInterval(check, UPDATE_CHECK_INTERVAL_MS);
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

function resolveAsset(urlPath) {
  const relative = path.normalize(decodeURIComponent(urlPath)).replace(/^[\\/]+/, "");
  const candidate = path.join(distPath, relative);
  // Everything outside dist/ is rejected, unknown routes fall back to the SPA entry.
  if (!candidate.startsWith(distPath)) return null;
  if (path.extname(candidate) && fs.existsSync(candidate)) return candidate;
  return path.join(distPath, "index.html");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#09090b",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    void win.loadURL(process.env.PLANNER_DEV_URL);
  } else {
    void win.loadURL("app://planner/index.html");
  }
}

// A second launch focuses the running window instead of opening a rival instance.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    protocol.handle("app", (request) => {
      const file = resolveAsset(new URL(request.url).pathname);
      if (!file) return new Response("Forbidden", { status: 403 });
      return net.fetch(pathToFileURL(file).toString());
    });

    createWindow();
    startUpdateChecks();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
