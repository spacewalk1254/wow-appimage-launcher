const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("wowClient", {
  getState: () => ipcRenderer.invoke("state:get"),
  saveClient: (client) => ipcRenderer.invoke("client:save", client),
  createClient: (client) => ipcRenderer.invoke("client:create", client),
  deleteClient: (clientId) => ipcRenderer.invoke("client:delete", clientId),
  setActiveClient: (clientId) => ipcRenderer.invoke("client:set-active", clientId),
  launchClient: (client) => ipcRenderer.invoke("client:launch", client),
  listBattleNetGames: (client) => ipcRenderer.invoke("battle-net:games", client),
  launchBattleNetGame: (client, game) => ipcRenderer.invoke("battle-net:launch-game", client, game),
  clearClientCache: (client) => ipcRenderer.invoke("client:clear-cache", client),
  readRealmlist: (client) => ipcRenderer.invoke("realmlist:read", client),
  writeRealmlist: (client, content) => ipcRenderer.invoke("realmlist:write", client, content),
  pickExecutable: () => ipcRenderer.invoke("dialog:pick-executable"),
  pickDirectory: () => ipcRenderer.invoke("dialog:pick-directory"),
  saveCalendarEvent: (event) => ipcRenderer.invoke("calendar:save", event),
  deleteCalendarEvent: (eventId) => ipcRenderer.invoke("calendar:delete", eventId),
  listAddons: (addonsPath) => ipcRenderer.invoke("addons:list", addonsPath),
  deleteAddon: (addonPath) => ipcRenderer.invoke("addons:delete", addonPath),
  resolveAddonsPath: (addonsPath) => ipcRenderer.invoke("addons:resolve-path", addonsPath),
  listScreenshots: (screenshotsPath) => ipcRenderer.invoke("screenshots:list", screenshotsPath),
  openPath: (targetPath) => ipcRenderer.invoke("shell:open-path", targetPath),
  showItem: (targetPath) => ipcRenderer.invoke("shell:show-item", targetPath)
});
