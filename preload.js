const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveInvoice: (invoice) => ipcRenderer.invoke('save-invoice', invoice),
  getInvoices: () => ipcRenderer.invoke('get-invoices'),
  writeClipboard: (text) => clipboard.writeText(text)
});
