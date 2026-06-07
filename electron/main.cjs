const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 480,
    height: 820,
    minWidth: 360,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "PatentFlow",
    autoHideMenuBar: true,
    backgroundColor: "#0B0D13", // match the CSS --bg-primary
  });

  // Load local dev server if environment variable is set to development or --dev flag is passed
  const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");
  
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
