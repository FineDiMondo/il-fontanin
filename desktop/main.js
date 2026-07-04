const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "El Fontanin",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Carica direttamente l'applicazione online di Firebase (Web-Server mode)
  win.loadURL('https://el-fontanin.web.app')

  // Nasconde la barra dei menu di default di Electron
  Menu.setApplicationMenu(null)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
