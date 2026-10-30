const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("jakutubby", {
  openMenu: () => ipcRenderer.send("open-menu"),
  askClaude: (message) => ipcRenderer.invoke("ask-claude", message),
  randomLine: () => ipcRenderer.invoke("random-line"),
  setClickable: (isClickable) => ipcRenderer.send("set-clickable", isClickable),
  setFollowing: (shouldFollow) => ipcRenderer.send("set-following", shouldFollow),
  onCursor: (callback) => ipcRenderer.on("cursor", (_event, position) => callback(position)),
  onSaySomething: (callback) => ipcRenderer.on("say-something", () => callback()),
  onOpenChat: (callback) => ipcRenderer.on("open-chat", () => callback()),
});
