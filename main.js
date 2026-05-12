const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

ipcMain.handle('save-invoice', (event, invoice) => {
  return db.saveInvoice(invoice);
});

ipcMain.handle('get-invoices', () => {
  return db.getInvoices();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
