const { app, BrowserWindow } = require("electron")
const path = require("path")

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Use a preload script for security
      nodeIntegration: true, // Enable nodeIntegration for child_process (be cautious in production)
      contextIsolation: false, // Disable contextIsolation for simplicity in this example
    },
  })

  mainWindow.loadFile("index.html")

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
