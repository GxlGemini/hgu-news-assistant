import { ipcRenderer } from 'electron';

// When contextIsolation is false, we assign directly to the window object
// instead of using contextBridge.
window.electron = {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => func(...args);
    ipcRenderer.on(channel, subscription);
  },
  off: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, func);
  }
};