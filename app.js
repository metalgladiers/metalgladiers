const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
  width: 1000,
  height: 600,   // tamanho normal
  center: true,
  frame: true,   // mantém a barra padrão do Windows
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false
  }
});


  win.loadFile(path.join(__dirname, 'index.html'));

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
