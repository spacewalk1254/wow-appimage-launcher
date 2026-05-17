const api = window.wowClient;

const els = {
  app: document.querySelector("#app"),
  platformBadge: document.querySelector("#platformBadge"),
  statusTitle: document.querySelector("#statusTitle"),
  statusText: document.querySelector("#statusText"),
  clientList: document.querySelector("#clientList"),
  addClientButton: document.querySelector("#addClientButton"),
  openCalendarButton: document.querySelector("#openCalendarButton"),
  sidebarCalendarMonthLabel: document.querySelector("#sidebarCalendarMonthLabel"),
  heroVersion: document.querySelector("#heroVersion"),
  heroTitle: document.querySelector("#heroTitle"),
  heroSubtitle: document.querySelector("#heroSubtitle"),
  homeClientTitle: document.querySelector("#homeClientTitle"),
  homeClientPath: document.querySelector("#homeClientPath"),
  homePlaytime: document.querySelector("#homePlaytime"),
  realmlistPanel: document.querySelector(".realmlist-panel"),
  realmListField: document.querySelector(".realm-list-field"),
  realmListPathLabel: document.querySelector("#realmListPathLabel"),
  realmListContentInput: document.querySelector("#realmListContentInput"),
  reloadRealmlistButton: document.querySelector("#reloadRealmlistButton"),
  saveRealmlistButton: document.querySelector("#saveRealmlistButton"),
  settingsTitle: document.querySelector("#settingsTitle"),
  clientForm: document.querySelector("#clientForm"),
  clientTitleInput: document.querySelector("#clientTitleInput"),
  clientVersionInput: document.querySelector("#clientVersionInput"),
  clientSubtitleInput: document.querySelector("#clientSubtitleInput"),
  executableInput: document.querySelector("#executableInput"),
  workingDirectoryInput: document.querySelector("#workingDirectoryInput"),
  realmListInput: document.querySelector("#realmListInput"),
  protonSelect: document.querySelector("#protonSelect"),
  protonPathInput: document.querySelector("#protonPathInput"),
  compatDataInput: document.querySelector("#compatDataInput"),
  launchArgsInput: document.querySelector("#launchArgsInput"),
  environmentInput: document.querySelector("#environmentInput"),
  notesInput: document.querySelector("#notesInput"),
  commandPreview: document.querySelector("#commandPreview"),
  launchButton: document.querySelector("#launchButton"),
  instanceCountSelect: document.querySelector("#instanceCountSelect"),
  setupToggleButton: document.querySelector("#setupToggleButton"),
  homeOpenFolderButton: document.querySelector("#homeOpenFolderButton"),
  clearCacheButton: document.querySelector("#clearCacheButton"),
  pickExecutableButton: document.querySelector("#pickExecutableButton"),
  pickWorkingDirectoryButton: document.querySelector("#pickWorkingDirectoryButton"),
  pickCompatDataButton: document.querySelector("#pickCompatDataButton"),
  tabButtons: [...document.querySelectorAll(".tab-button")],
  tabPanels: [...document.querySelectorAll(".tab-panel")],
  calendarForm: document.querySelector("#calendarForm"),
  calendarMonthLabel: document.querySelector("#calendarMonthLabel"),
  calendarGrid: document.querySelector("#calendarGrid"),
  prevMonthButton: document.querySelector("#prevMonthButton"),
  todayButton: document.querySelector("#todayButton"),
  nextMonthButton: document.querySelector("#nextMonthButton"),
  openEventsButton: document.querySelector("#openEventsButton"),
  eventIdInput: document.querySelector("#eventIdInput"),
  eventDateInput: document.querySelector("#eventDateInput"),
  eventTimeInput: document.querySelector("#eventTimeInput"),
  eventTitleInput: document.querySelector("#eventTitleInput"),
  eventClientInput: document.querySelector("#eventClientInput"),
  eventNotesInput: document.querySelector("#eventNotesInput"),
  newEventButton: document.querySelector("#newEventButton"),
  eventListPanel: document.querySelector("#eventListPanel"),
  eventList: document.querySelector("#eventList"),
  addonsPathLabel: document.querySelector("#addonsPathLabel"),
  addonsList: document.querySelector("#addonsList"),
  pickAddonsButton: document.querySelector("#pickAddonsButton"),
  openAddonsButton: document.querySelector("#openAddonsButton"),
  refreshAddonsButton: document.querySelector("#refreshAddonsButton"),
  screenshotsPathLabel: document.querySelector("#screenshotsPathLabel"),
  screenshotsGrid: document.querySelector("#screenshotsGrid"),
  battleNetScreenshotGameSelect: document.querySelector("#battleNetScreenshotGameSelect"),
  openScreenshotsButton: document.querySelector("#openScreenshotsButton"),
  refreshScreenshotsButton: document.querySelector("#refreshScreenshotsButton"),
  screenshotLightbox: document.querySelector("#screenshotLightbox"),
  screenshotLightboxTitle: document.querySelector("#screenshotLightboxTitle"),
  screenshotLightboxImage: document.querySelector("#screenshotLightboxImage"),
  screenshotLightboxMeta: document.querySelector("#screenshotLightboxMeta"),
  closeScreenshotLightboxButton: document.querySelector("#closeScreenshotLightboxButton"),
  previousScreenshotButton: document.querySelector("#previousScreenshotButton"),
  nextScreenshotButton: document.querySelector("#nextScreenshotButton"),
  openScreenshotFileButton: document.querySelector("#openScreenshotFileButton"),
  installedGamesPathLabel: document.querySelector("#installedGamesPathLabel"),
  installedGamesList: document.querySelector("#installedGamesList"),
  openBattleNetFolderButton: document.querySelector("#openBattleNetFolderButton"),
  refreshInstalledGamesButton: document.querySelector("#refreshInstalledGamesButton")
};

let state = null;
let activeClient = null;
let setupOpen = false;
let playtimeTimer = null;
let calendarMonth = new Date();
let calendarPopover = null;
let activeScreenshot = null;
let screenshotGallery = [];
let activeScreenshotIndex = -1;
let battleNetScreenshotGames = [];

function setStatus(title, text, tone = "neutral") {
  els.statusTitle.textContent = title;
  els.statusText.textContent = text;
  els.statusTitle.dataset.tone = tone;
  els.statusTitle.animate(
    [
      { transform: "translateY(4px)", opacity: 0.45 },
      { transform: "translateY(0)", opacity: 1 }
    ],
    { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
}

function renderScreenshotLightbox() {
  if (!activeScreenshot) {
    return;
  }

  els.screenshotLightboxTitle.textContent = activeScreenshot.name;
  els.screenshotLightboxImage.src = activeScreenshot.url;
  els.screenshotLightboxImage.alt = activeScreenshot.name;
  const position = screenshotGallery.length > 1 ? ` · ${activeScreenshotIndex + 1} of ${screenshotGallery.length}` : "";
  els.screenshotLightboxMeta.textContent = `${new Date(activeScreenshot.modifiedAt).toLocaleString()}${position}`;
  const hasMultipleScreenshots = screenshotGallery.length > 1;
  els.previousScreenshotButton.disabled = !hasMultipleScreenshots;
  els.nextScreenshotButton.disabled = !hasMultipleScreenshots;
}

function openScreenshotLightbox(index) {
  activeScreenshotIndex = index;
  activeScreenshot = screenshotGallery[activeScreenshotIndex];
  if (!activeScreenshot) {
    return;
  }
  renderScreenshotLightbox();
  els.screenshotLightbox.hidden = false;
  els.screenshotLightbox.dataset.open = "true";
  els.closeScreenshotLightboxButton.focus();
}

function navigateScreenshot(direction) {
  if (els.screenshotLightbox.hidden || screenshotGallery.length <= 1) {
    return;
  }
  activeScreenshotIndex = (activeScreenshotIndex + direction + screenshotGallery.length) % screenshotGallery.length;
  activeScreenshot = screenshotGallery[activeScreenshotIndex];
  renderScreenshotLightbox();
}

function openScreenshotFile() {
  if (activeScreenshot?.path) {
    api.openPath(activeScreenshot.path);
  }
}

function closeScreenshotLightbox() {
  if (els.screenshotLightbox.hidden) {
    return;
  }
  els.screenshotLightbox.hidden = true;
  els.screenshotLightbox.dataset.open = "false";
  els.screenshotLightboxImage.removeAttribute("src");
  activeScreenshot = null;
  activeScreenshotIndex = -1;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function quote(value) {
  if (!value) {
    return "";
  }
  return /\s/.test(value) ? `"${value}"` : value;
}

function shortPathLabel(value) {
  if (!value) {
    return "Not configured";
  }
  const parts = value.split("/").filter(Boolean);
  if (parts.length <= 2) {
    return value;
  }
  return `.../${parts.slice(-2).join("/")}`;
}

function formatPlaytime(ms) {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalMinutes = Math.floor(safeMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function lastLaunchedClient() {
  return [...(state?.config?.clients || [])]
    .filter((client) => Number.isFinite(Date.parse(client.lastLaunchedAt || "")))
    .sort((a, b) => Date.parse(b.lastLaunchedAt) - Date.parse(a.lastLaunchedAt))[0] || null;
}

function renderLastLaunchedStatus() {
  const client = lastLaunchedClient();
  els.statusTitle.textContent = "Last Played";
  els.statusText.textContent = client ? `${client.title} ${client.version}` : "Never launched";
  els.statusTitle.dataset.tone = "neutral";
}

function currentPlayMs(client) {
  const baseMs = Number(client?.totalPlayMs) || 0;
  const startedAt = client?.activeSession?.startedAt ? Date.parse(client.activeSession.startedAt) : NaN;
  if (!Number.isFinite(startedAt)) {
    return baseMs;
  }
  return baseMs + Math.max(0, Date.now() - startedAt);
}

function addonsPathForClient(client) {
  if (!client) {
    return "";
  }
  const clientDirectory = client.workingDirectory || (client.executablePath ? client.executablePath.split("/").slice(0, -1).join("/") : "");
  return clientDirectory ? `${clientDirectory}/Interface/Addons` : "";
}

function screenshotsPathForClient(client) {
  if (!client) {
    return "";
  }
  const clientDirectory = client.workingDirectory || (client.executablePath ? client.executablePath.split("/").slice(0, -1).join("/") : "");
  return clientDirectory ? `${clientDirectory}/Screenshots` : "";
}

function selectedBattleNetScreenshotGame() {
  const selectedId = els.battleNetScreenshotGameSelect?.value || "";
  return battleNetScreenshotGames.find((game) => game.id === selectedId) || null;
}

function activeScreenshotsPath() {
  if (isBattleNetClient()) {
    return screenshotsPathForClient(selectedBattleNetScreenshotGame());
  }
  return screenshotsPathForClient(activeClient);
}

function isBattleNetClient(client = activeClient) {
  return client?.id === "battle-net";
}

function battleNetRootForClient(client) {
  if (!client) {
    return "";
  }
  return client.workingDirectory || (client.executablePath ? client.executablePath.split("/").slice(0, -1).join("/") : "");
}

function hasRealmlistTarget(client) {
  return Boolean(client?.realmListPath || client?.workingDirectory || client?.executablePath);
}

function localDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setSetupOpen(open) {
  setupOpen = open;
  els.clientForm.dataset.open = String(open);
  els.setupToggleButton.dataset.active = String(open);
  els.setupToggleButton.textContent = open ? "Hide Setup" : "Client Setup";
  if (open) {
    els.clientForm.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }
}

function gatherClient() {
  const battleNet = isBattleNetClient(activeClient);
  return {
    ...activeClient,
    title: els.clientTitleInput.value.trim(),
    version: els.clientVersionInput.value.trim(),
    subtitle: els.clientSubtitleInput.value.trim(),
    executablePath: els.executableInput.value.trim(),
    workingDirectory: els.workingDirectoryInput.value.trim(),
    realmListPath: els.realmListInput.value.trim(),
    instanceCount: battleNet ? 1 : Number.parseInt(els.instanceCountSelect.value, 10) || 1,
    protonPath: els.protonPathInput.value.trim(),
    compatDataPath: els.compatDataInput.value.trim(),
    launchArgs: els.launchArgsInput.value.trim(),
    environment: els.environmentInput.value.trim(),
    notes: els.notesInput.value.trim()
  };
}

function renderCommandPreview() {
  const client = gatherClient();
  const proton = quote(client.protonPath || state?.protonCandidates?.[0] || "/path/to/Steam/Proton/proton");
  const executableName = client.executableName || "Wow.exe";
  const exe = quote(client.executablePath || `/path/to/${client.folderName}/${executableName}`);
  const args = client.launchArgs ? ` ${client.launchArgs}` : "";
  const count = Number(client.instanceCount) || 1;
  const prefix = client.compatDataPath ? `STEAM_COMPAT_DATA_PATH=${quote(client.compatDataPath)} ` : "";
  els.commandPreview.textContent = count > 1
    ? `${count} instances: ${prefix}${proton} run ${exe}${args}`
    : `${prefix}${proton} run ${exe}${args}`;
}

function renderHomeSummary() {
  const client = gatherClient();
  els.homeClientTitle.textContent = `${client.title} ${client.version}`;
  els.homeClientPath.textContent = client.executablePath ? shortPathLabel(client.executablePath) : "No executable selected.";
  els.homeClientPath.title = client.executablePath || "";
  els.homePlaytime.textContent = formatPlaytime(currentPlayMs(client));
  els.homeOpenFolderButton.disabled = !client.workingDirectory && !client.executablePath;
  els.clearCacheButton.disabled = !client.workingDirectory && !client.executablePath;
}

function configureClientMode(client) {
  const battleNet = isBattleNetClient(client);
  els.app.dataset.clientMode = battleNet ? "battle-net" : "wow";
  els.realmlistPanel.hidden = battleNet;
  els.realmListField.hidden = battleNet;
  els.clearCacheButton.hidden = battleNet;
  els.instanceCountSelect.value = battleNet ? "1" : els.instanceCountSelect.value;
  const instancePicker = els.instanceCountSelect.closest(".instance-picker");
  instancePicker.hidden = battleNet;
  instancePicker.style.display = battleNet ? "none" : "";
  for (const button of els.tabButtons) {
    const battleNetOnly = button.dataset.tab === "installedGames";
    const wowOnly = button.dataset.tab === "addons";
    button.hidden = (battleNetOnly && !battleNet) || (wowOnly && battleNet);
  }
  const screenshotGamePicker = els.battleNetScreenshotGameSelect.closest(".battle-net-screenshot-picker");
  screenshotGamePicker.hidden = !battleNet;
  screenshotGamePicker.style.display = battleNet ? "" : "none";
}

async function loadRealmlist() {
  const client = gatherClient();
  if (isBattleNetClient(client)) {
    els.realmListPathLabel.textContent = "Battle.net does not use realmlist.wtf.";
    els.realmListContentInput.value = "";
    els.saveRealmlistButton.disabled = true;
    return;
  }
  if (!hasRealmlistTarget(client)) {
    els.realmListPathLabel.textContent = "Choose a client executable first.";
    els.realmListPathLabel.title = "";
    els.realmListContentInput.value = "";
    els.saveRealmlistButton.disabled = true;
    return;
  }
  try {
    const result = await api.readRealmlist(client);
    els.realmListPathLabel.textContent = result.path;
    els.realmListPathLabel.title = result.path;
    els.realmListContentInput.value = result.content || "";
    els.saveRealmlistButton.disabled = false;
  } catch (error) {
    els.realmListPathLabel.textContent = error.message;
    els.realmListPathLabel.title = "";
    els.realmListContentInput.value = "";
    els.saveRealmlistButton.disabled = true;
  }
}

function themeForClient(client) {
  const builtInThemes = new Set(["vanilla", "tbc", "wotlk", "battle-net"]);
  if (builtInThemes.has(client.id)) {
    return client.id;
  }
  if (client.customTheme) {
    return client.customTheme;
  }
  const customClients = state.config.clients.filter((item) => !builtInThemes.has(item.id));
  const index = Math.max(0, customClients.findIndex((item) => item.id === client.id));
  return ["custom-loatheb", "custom-gluth", "custom-sapphiron"][index % 3];
}

function hydrateClient(client) {
  activeClient = { ...client };
  const theme = themeForClient(client);
  els.app.className = `app-shell theme-${theme}`;
  configureClientMode(client);
  document.querySelector(".version-hero")?.animate(
    [
      { opacity: 0.72, transform: "translateY(10px) scale(.992)" },
      { opacity: 1, transform: "translateY(0) scale(1)" }
    ],
    { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
  els.heroVersion.textContent = client.version;
  els.heroTitle.textContent = client.title;
  els.heroSubtitle.textContent = client.subtitle;
  els.settingsTitle.textContent = `${client.title} ${client.version}`;
  els.clientTitleInput.value = client.title || "";
  els.clientVersionInput.value = client.version || "";
  els.clientSubtitleInput.value = client.subtitle || "";
  els.executableInput.value = client.executablePath || "";
  els.workingDirectoryInput.value = client.workingDirectory || "";
  els.realmListInput.value = client.realmListPath || "";
  els.protonPathInput.value = client.protonPath || state.protonCandidates?.[0] || "";
  els.compatDataInput.value = client.compatDataPath || "";
  els.launchArgsInput.value = client.launchArgs || "";
  els.instanceCountSelect.value = isBattleNetClient(client) ? "1" : String(client.instanceCount || 1);
  els.environmentInput.value = client.environment || "";
  els.notesInput.value = client.notes || "";
  els.launchButton.disabled = !client.executablePath;
  renderHomeSummary();
  renderCommandPreview();
  renderClients();
  renderEventVersionOptions();
  renderLastLaunchedStatus();
  loadRealmlist();
  if (document.querySelector("#installedGamesTab")?.dataset.active === "true") {
    refreshInstalledGames();
  }
}

function renderProtonOptions() {
  els.protonSelect.replaceChildren();
  const custom = new Option("Use custom path below", "");
  els.protonSelect.append(custom);

  for (const candidate of state.protonCandidates || []) {
    els.protonSelect.append(new Option(candidate.split("/").slice(-2).join("/"), candidate));
  }

  if (state.protonCandidates?.length) {
    els.protonSelect.value = activeClient?.protonPath || state.protonCandidates[0];
  }
}

async function selectClient(clientId) {
  state.config = await api.setActiveClient(clientId);
  const selectedClient = state.config.clients.find((item) => item.id === clientId);
  const nextTab = selectedClient?.id === "battle-net" && selectedClient?.executablePath ? "installedGames" : "launcher";
  hydrateClient(selectedClient);
  activateTab(nextTab);
  if (document.querySelector("#addonsTab")?.dataset.active === "true") {
    refreshAddons();
  }
  if (document.querySelector("#screenshotsTab")?.dataset.active === "true") {
    refreshScreenshots();
  }
}

async function deleteCustomClient(client) {
  if (!window.confirm(`Delete ${client.title} from the launcher?\n\nThis only removes the launcher entry inside this app. It will not delete your local WoW files or folders.`)) {
    return;
  }
  state.config = await api.deleteClient(client.id);
  activeClient = state.config.clients.find((item) => item.id === state.config.activeClientId) || state.config.clients[0];
  hydrateClient(activeClient);
  setStatus("Client Deleted", client.title, "danger");
}

function renderClients() {
  els.clientList.replaceChildren();
  const builtInClientIds = new Set(["vanilla", "tbc", "wotlk", "battle-net"]);
  const menuLabels = {
    vanilla: "Vanilla",
    tbc: "TBC",
    wotlk: "WOTLK",
    "battle-net": "Battle.net"
  };
  const builtInClients = state.config.clients.filter((client) => builtInClientIds.has(client.id));
  const customClients = state.config.clients.filter((client) => !builtInClientIds.has(client.id));

  for (const client of builtInClients) {
    const row = document.createElement("div");
    row.className = "client-row";
    row.dataset.active = String(client.id === activeClient?.id);
    row.dataset.client = client.id;
    row.innerHTML = `
      <button class="client-card" type="button">
        <span class="client-rune"></span>
        <span>
          <strong class="client-name"></strong>
          <small class="client-meta"></small>
        </span>
      </button>
    `;
    const button = row.querySelector(".client-card");
    row.querySelector(".client-rune").textContent = client.version;
    row.querySelector(".client-name").textContent = menuLabels[client.id] || client.title;
    const detail = `${formatPlaytime(currentPlayMs(client))} played`;
    row.querySelector(".client-meta").textContent = detail;
    row.querySelector(".client-meta").title = client.executablePath ? "Configured" : `${client.folderName}/Wow.exe not configured`;
    button.addEventListener("click", async () => {
      await selectClient(client.id);
    });
    els.clientList.append(row);
  }

  if (customClients.length) {
    const group = document.createElement("div");
    group.className = "custom-client-picker";
    group.dataset.active = String(customClients.some((client) => client.id === activeClient?.id));
    group.innerHTML = `
      <label>
        <span>Custom Clients</span>
        <select aria-label="Custom clients"></select>
      </label>
      <button class="delete-client-button" type="button">x</button>
    `;
    const select = group.querySelector("select");
    const deleteButton = group.querySelector("button");
    for (const client of customClients) {
      select.append(new Option(`${client.title} ${client.version}`, client.id));
    }
    select.value = customClients.some((client) => client.id === activeClient?.id) ? activeClient.id : customClients[0].id;
    deleteButton.title = "Delete selected custom client";
    deleteButton.setAttribute("aria-label", "Delete selected custom client");
    select.addEventListener("change", async () => {
      await selectClient(select.value);
    });
    deleteButton.addEventListener("click", async () => {
      const client = state.config.clients.find((item) => item.id === select.value);
      if (client) {
        await deleteCustomClient(client);
      }
    });
    els.clientList.append(group);
  }
}

function renderEventVersionOptions() {
  const selected = els.eventClientInput.value || activeClient?.id || "wotlk";
  els.eventClientInput.replaceChildren();
  for (const client of state.config.clients) {
    els.eventClientInput.append(new Option(`${client.title} ${client.version}`, client.id));
  }
  els.eventClientInput.value = selected;
}

function eventsForDate(dateValue) {
  return state.config.calendar.filter((event) => event.date === dateValue);
}

function isUpcomingEvent(event) {
  if (!event.date) {
    return false;
  }
  const eventDate = new Date(`${event.date}T${event.time || "23:59"}:00`);
  return eventDate >= new Date();
}

function closeCalendarPopover() {
  calendarPopover?.remove();
  calendarPopover = null;
}

function closeEventListPanel() {
  if (els.eventListPanel) {
    els.eventListPanel.dataset.open = "false";
  }
}

function toggleEventListPanel() {
  if (!els.eventListPanel) {
    return;
  }
  const open = els.eventListPanel.dataset.open === "true";
  els.eventListPanel.dataset.open = String(!open);
}

function showCalendarPopover(date, events, anchor) {
  closeCalendarPopover();

  const popover = document.createElement("aside");
  popover.className = "calendar-popover";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", "Calendar event overview");

  const header = document.createElement("div");
  header.className = "calendar-popover-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = date.toLocaleDateString(undefined, { weekday: "long" });
  const title = document.createElement("h3");
  title.textContent = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  header.append(eyebrow, title);
  popover.append(header);

  const list = document.createElement("div");
  list.className = "calendar-popover-events";
  for (const event of events) {
    const client = state.config.clients.find((item) => item.id === event.clientId);
    const item = document.createElement("article");
    item.className = "calendar-popover-event";
    item.dataset.client = event.clientId;

    const eventTitle = document.createElement("h4");
    eventTitle.textContent = event.title;
    const meta = document.createElement("small");
    meta.textContent = `${event.time || "Any time"} - ${client ? `${client.title} ${client.version}` : event.clientId}`;
    const notes = document.createElement("p");
    notes.textContent = event.notes || "No notes.";
    item.append(eventTitle, meta, notes);
    list.append(item);
  }
  popover.append(list);

  document.body.append(popover);
  const rect = anchor.getBoundingClientRect();
  const popupRect = popover.getBoundingClientRect();
  const left = Math.min(Math.max(rect.left, 12), window.innerWidth - popupRect.width - 12);
  const below = rect.bottom + 10;
  const above = rect.top - popupRect.height - 10;
  const top = below + popupRect.height < window.innerHeight - 12 ? below : Math.max(12, above);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  calendarPopover = popover;
}

function renderCalendarGrid() {
  if (!state?.config || !els.calendarGrid) {
    return;
  }

  closeCalendarPopover();
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  els.calendarMonthLabel.textContent = monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  els.calendarGrid.replaceChildren();

  const today = localDateValue(new Date());
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateValue = localDateValue(date);
    const dayEvents = eventsForDate(dateValue);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-day";
    cell.dataset.currentMonth = String(date.getMonth() === monthStart.getMonth());
    cell.dataset.today = String(dateValue === today);
    cell.innerHTML = `
      <span class="day-number">${date.getDate()}</span>
      <span class="day-events"></span>
    `;
    const chips = cell.querySelector(".day-events");
    for (const event of dayEvents.slice(0, 3)) {
      const chip = document.createElement("span");
      chip.className = "calendar-chip";
      chip.dataset.client = event.clientId;
      chip.textContent = event.title;
      chips.append(chip);
    }
    if (dayEvents.length > 3) {
      const more = document.createElement("span");
      more.className = "calendar-more";
      more.textContent = `+${dayEvents.length - 3}`;
      chips.append(more);
    }
    cell.addEventListener("click", (event) => {
      if (dayEvents.length) {
        event.stopPropagation();
        showCalendarPopover(date, dayEvents, cell);
        setStatus("Event Overview", date.toLocaleDateString(), "success");
        return;
      }
      resetEventForm();
      els.eventDateInput.value = dateValue;
      els.eventClientInput.value = activeClient?.id || "wotlk";
      els.eventTitleInput.focus();
      setStatus("Date Selected", date.toLocaleDateString(), "success");
    });
    els.calendarGrid.append(cell);
  }
  renderSidebarCalendarLabel();
}

function renderSidebarCalendarLabel() {
  if (!els.sidebarCalendarMonthLabel) {
    return;
  }
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  els.sidebarCalendarMonthLabel.textContent = monthStart.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function activateTab(tabName) {
  if (isBattleNetClient() && tabName === "addons") {
    tabName = "installedGames";
  }
  if (!isBattleNetClient() && tabName === "installedGames") {
    tabName = "launcher";
  }
  closeCalendarPopover();
  closeEventListPanel();
  els.app.dataset.activeScreen = tabName;
  els.tabButtons.forEach((item) => (item.dataset.active = String(item.dataset.tab === tabName)));
  els.tabPanels.forEach((panel) => (panel.dataset.active = String(panel.id === `${tabName}Tab`)));
  const activePanel = document.querySelector(`#${tabName}Tab`);
  activePanel?.animate(
    [
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
  if (tabName === "addons") {
    refreshAddons();
  }
  if (tabName === "screenshots") {
    refreshScreenshots();
  }
  if (tabName === "installedGames") {
    refreshInstalledGames();
  }
  if (tabName === "calendar") {
    renderCalendarGrid();
  }
}

function renderEvents() {
  els.eventList.replaceChildren();
  renderCalendarGrid();
  const events = [...state.config.calendar]
    .filter(isUpcomingEvent)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (!events.length) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = "No upcoming events.";
    els.eventList.append(empty);
    return;
  }

  for (const event of events) {
    const client = state.config.clients.find((item) => item.id === event.clientId);
    const row = document.createElement("article");
    row.className = "event-item";
    row.dataset.client = event.clientId;
    row.innerHTML = `
      <div class="event-date">
        <strong></strong>
        <small></small>
      </div>
      <div class="event-body">
        <h4></h4>
        <p></p>
        <small></small>
      </div>
      <div class="event-actions">
        <button class="icon-button edit-event" type="button" title="Edit event" aria-label="Edit event">✎</button>
        <button class="icon-button delete-event" type="button" title="Delete event" aria-label="Delete event">×</button>
      </div>
    `;
    row.querySelector(".event-date strong").textContent = new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    row.querySelector(".event-date small").textContent = event.time || "Any time";
    row.querySelector("h4").textContent = event.title;
    row.querySelector("p").textContent = event.notes || "No notes.";
    row.querySelector(".event-body small").textContent = client ? `${client.title} ${client.version}` : event.clientId;
    row.querySelector(".edit-event").addEventListener("click", () => editEvent(event));
    row.querySelector(".delete-event").addEventListener("click", async () => {
      state.config = await api.deleteCalendarEvent(event.id);
      renderEvents();
      setStatus("Deleted", "Calendar event removed.", "danger");
    });
    els.eventList.append(row);
  }
}

function editEvent(event) {
  closeEventListPanel();
  els.eventIdInput.value = event.id;
  els.eventDateInput.value = event.date;
  els.eventTimeInput.value = event.time;
  els.eventTitleInput.value = event.title;
  els.eventClientInput.value = event.clientId;
  els.eventNotesInput.value = event.notes;
}

function resetEventForm() {
  els.eventIdInput.value = "";
  els.eventDateInput.value = todayValue();
  els.eventTimeInput.value = "";
  els.eventTitleInput.value = "";
  els.eventClientInput.value = activeClient?.id || "wotlk";
  els.eventNotesInput.value = "";
}

async function refreshAddons() {
  const addonsPath = addonsPathForClient(activeClient);
  const resolvedPath = await api.resolveAddonsPath(addonsPath);
  els.addonsPathLabel.textContent = resolvedPath || "Choose a client executable first";
  els.addonsPathLabel.title = resolvedPath || "";
  els.addonsList.replaceChildren();

  const addons = await api.listAddons(resolvedPath);
  if (!addons.length) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = "No addon folders found. The Addons tab reads the selected client's executable folder plus /Interface/Addons.";
    els.addonsList.append(empty);
    return;
  }

  for (const addon of addons) {
    const row = document.createElement("article");
    row.className = "addon-item";
    row.innerHTML = `
      <button class="addon-card-button" type="button" title="Show addon folder">
        <span class="addon-card-mark" aria-hidden="true">A</span>
        <span class="addon-card-body">
          <strong></strong>
        </span>
      </button>
      <button class="icon-button addon-remove-button danger-action" type="button" title="Remove addon" aria-label="Remove addon">×</button>
    `;
    row.querySelector("strong").textContent = addon.name;
    row.querySelector(".addon-card-button").addEventListener("click", () => api.openPath(addon.path));
    row.querySelector(".addon-remove-button").addEventListener("click", async (event) => {
      event.stopPropagation();
      if (!window.confirm(`Are you sure you want to delete ${addon.name}?`)) {
        return;
      }
      try {
        await api.deleteAddon(addon.path);
        await refreshAddons();
        setStatus("Addon Deleted", addon.name, "danger");
      } catch (error) {
        setStatus("Delete Failed", error.message, "danger");
      }
    });
    els.addonsList.append(row);
  }
}

async function refreshInstalledGames() {
  const battleNetRoot = battleNetRootForClient(activeClient);
  els.installedGamesPathLabel.textContent = battleNetRoot || "Choose Battle.net.exe first";
  els.installedGamesPathLabel.title = battleNetRoot || "";
  els.installedGamesList.replaceChildren();

  if (!isBattleNetClient()) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = "Installed games are available when Battle.net is selected.";
    els.installedGamesList.append(empty);
    return;
  }

  const games = await api.listBattleNetGames(gatherClient());
  if (!games.length) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = battleNetRoot
      ? "No installed Battle.net games were found near this Battle.net directory."
      : "Choose Battle.net.exe in Client Setup so the launcher can scan for installed games.";
    els.installedGamesList.append(empty);
    return;
  }

  for (const game of games) {
    const row = document.createElement("article");
    row.className = "installed-game-item";
    row.innerHTML = `
      <div>
        <strong></strong>
        <small></small>
      </div>
      <div class="installed-game-actions">
        <button class="secondary-button launch-installed-game" type="button">Launch</button>
        <button class="icon-button show-installed-game" type="button" title="Show game folder" aria-label="Show game folder">▣</button>
      </div>
    `;
    row.querySelector("strong").textContent = game.title;
    row.querySelector("small").textContent = shortPathLabel(game.installDirectory || game.workingDirectory || game.executablePath);
    row.querySelector("small").title = game.executablePath;
    row.querySelector(".show-installed-game").addEventListener("click", () => api.openPath(game.installDirectory || game.workingDirectory));
    row.querySelector(".launch-installed-game").addEventListener("click", async () => {
      try {
        setStatus("Launching", game.title);
        const result = await api.launchBattleNetGame(gatherClient(), game);
        setStatus("Launched", `${game.title} started with PID ${result.pid}.`, "success");
      } catch (error) {
        setStatus("Launch Failed", error.message, "danger");
      }
    });
    els.installedGamesList.append(row);
  }
}

async function saveClient() {
  const client = gatherClient();
  state.config = await api.saveClient(client);
  activeClient = state.config.clients.find((item) => item.id === client.id);
  hydrateClient(activeClient);
  setSetupOpen(false);
  setStatus("Saved", `${activeClient.title} ${activeClient.version} settings saved.`, "success");
}

function bindEvents() {
  els.tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  els.openCalendarButton.addEventListener("click", () => activateTab("calendar"));

  els.addClientButton.addEventListener("click", async () => {
    state.config = await api.createClient({
      title: "New Custom Client",
      version: "Custom",
      subtitle: "Configure this client"
    });
    activeClient = state.config.clients.find((client) => client.id === state.config.activeClientId);
    renderProtonOptions();
    hydrateClient(activeClient);
    setSetupOpen(true);
    els.clientTitleInput.focus();
    els.clientTitleInput.select();
    setStatus("Custom Client Added", "Name it, choose Wow.exe, then save.", "success");
    const selected = await api.pickExecutable();
    if (selected) {
      els.executableInput.value = selected;
      els.workingDirectoryInput.value = selected.split("/").slice(0, -1).join("/");
      activeClient = gatherClient();
      renderHomeSummary();
      renderCommandPreview();
      loadRealmlist();
    }
  });

  els.clientForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveClient();
  });
  els.setupToggleButton.addEventListener("click", () => setSetupOpen(!setupOpen));
  els.homeOpenFolderButton.addEventListener("click", () => {
    const client = gatherClient();
    const target = client.workingDirectory || (client.executablePath ? client.executablePath.split("/").slice(0, -1).join("/") : "");
    if (target) {
      api.openPath(target);
    }
  });
  els.clearCacheButton.addEventListener("click", async () => {
    try {
      const result = await api.clearClientCache(gatherClient());
      setStatus(
        result.removed ? "Cache Cleared" : "No Cache Folder",
        result.path,
        result.removed ? "success" : "neutral"
      );
      if (result.removed) {
        window.alert("Cache has been cleared. If the client is open, please close and reopen it.");
      }
    } catch (error) {
      setStatus("Cache Clear Failed", error.message, "danger");
    }
  });
  els.clientForm.addEventListener("input", () => {
    activeClient = gatherClient();
    els.launchButton.disabled = !activeClient.executablePath;
    renderHomeSummary();
    renderCommandPreview();
  });
  els.realmListInput.addEventListener("change", loadRealmlist);
  els.reloadRealmlistButton.addEventListener("click", loadRealmlist);
  els.saveRealmlistButton.addEventListener("click", async () => {
    if (isBattleNetClient()) {
      setStatus("Not Needed", "Battle.net does not use realmlist.wtf.");
      return;
    }
    try {
      const result = await api.writeRealmlist(gatherClient(), els.realmListContentInput.value);
      state.config = result.config;
      activeClient = state.config.clients.find((client) => client.id === activeClient.id) || activeClient;
      hydrateClient(activeClient);
      setStatus("Realmlist Saved", result.path, "success");
    } catch (error) {
      setStatus("Realmlist Failed", error.message, "danger");
    }
  });
  els.protonSelect.addEventListener("change", () => {
    if (els.protonSelect.value) {
      els.protonPathInput.value = els.protonSelect.value;
      renderCommandPreview();
    }
  });
  els.instanceCountSelect.addEventListener("change", renderCommandPreview);

  els.pickExecutableButton.addEventListener("click", async () => {
    const selected = await api.pickExecutable();
    if (selected) {
      els.executableInput.value = selected;
      if (!els.workingDirectoryInput.value) {
        els.workingDirectoryInput.value = selected.split("/").slice(0, -1).join("/");
      }
      activeClient = gatherClient();
      renderHomeSummary();
      renderCommandPreview();
      loadRealmlist();
    }
  });
  els.pickWorkingDirectoryButton.addEventListener("click", async () => {
    const selected = await api.pickDirectory();
    if (selected) {
      els.workingDirectoryInput.value = selected;
      activeClient = gatherClient();
      renderHomeSummary();
      renderCommandPreview();
      loadRealmlist();
    }
  });
  els.pickCompatDataButton.addEventListener("click", async () => {
    const selected = await api.pickDirectory();
    if (selected) {
      els.compatDataInput.value = selected;
      renderCommandPreview();
    }
  });

  els.launchButton.addEventListener("click", async () => {
    try {
      els.launchButton.dataset.loading = "true";
      setStatus("Launching", activeClient.title);
      const result = await api.launchClient(gatherClient());
      state.config = result.config;
      activeClient = state.config.clients.find((client) => client.id === activeClient.id);
      hydrateClient(activeClient);
      setStatus("Launched", result.instanceCount > 1 ? `Started ${result.instanceCount} instances.` : `Started with PID ${result.pid}.`, "success");
    } catch (error) {
      setStatus("Launch Failed", error.message, "danger");
    } finally {
      els.launchButton.dataset.loading = "false";
    }
  });
  els.calendarForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.config = await api.saveCalendarEvent({
      id: els.eventIdInput.value,
      date: els.eventDateInput.value,
      time: els.eventTimeInput.value,
      title: els.eventTitleInput.value.trim(),
      clientId: els.eventClientInput.value,
      notes: els.eventNotesInput.value.trim()
    });
    resetEventForm();
    renderEvents();
    setStatus("Saved", "Calendar event saved.", "success");
  });
  els.openEventsButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleEventListPanel();
  });
  els.newEventButton.addEventListener("click", () => {
    closeEventListPanel();
    resetEventForm();
  });
  els.prevMonthButton.addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendarGrid();
  });
  els.todayButton.addEventListener("click", () => {
    calendarMonth = new Date();
    resetEventForm();
    renderCalendarGrid();
  });
  els.nextMonthButton.addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendarGrid();
  });
  document.addEventListener("click", (event) => {
    if (calendarPopover && !calendarPopover.contains(event.target)) {
      closeCalendarPopover();
    }
    if (
      els.eventListPanel?.dataset.open === "true" &&
      !els.eventListPanel.contains(event.target) &&
      !els.openEventsButton.contains(event.target)
    ) {
      closeEventListPanel();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (els.screenshotLightbox.hidden) {
      return;
    }
    if (event.key === "Escape") {
      closeScreenshotLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateScreenshot(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateScreenshot(1);
    }
  });

  els.pickAddonsButton?.addEventListener("click", refreshAddons);
  els.openAddonsButton.addEventListener("click", async () => {
    const addonsPath = addonsPathForClient(activeClient);
    const resolvedPath = await api.resolveAddonsPath(addonsPath);
    if (resolvedPath) {
      api.openPath(resolvedPath);
    }
  });
  els.refreshAddonsButton.addEventListener("click", refreshAddons);
  els.openScreenshotsButton.addEventListener("click", () => {
    const screenshotsPath = activeScreenshotsPath();
    if (screenshotsPath) {
      api.openPath(screenshotsPath);
    }
  });
  els.refreshScreenshotsButton.addEventListener("click", refreshScreenshots);
  els.battleNetScreenshotGameSelect.addEventListener("change", refreshScreenshots);
  els.closeScreenshotLightboxButton.addEventListener("click", closeScreenshotLightbox);
  els.previousScreenshotButton.addEventListener("click", () => navigateScreenshot(-1));
  els.nextScreenshotButton.addEventListener("click", () => navigateScreenshot(1));
  els.screenshotLightbox.addEventListener("click", (event) => {
    if (event.target.dataset.lightboxClose !== undefined) {
      closeScreenshotLightbox();
    }
  });
  els.openScreenshotFileButton.addEventListener("click", openScreenshotFile);
  els.openBattleNetFolderButton.addEventListener("click", () => {
    const target = battleNetRootForClient(activeClient);
    if (target) {
      api.openPath(target);
    }
  });
  els.refreshInstalledGamesButton.addEventListener("click", refreshInstalledGames);
}

async function refreshScreenshots() {
  if (isBattleNetClient()) {
    battleNetScreenshotGames = await api.listBattleNetGames(gatherClient());
    const currentValue = els.battleNetScreenshotGameSelect.value;
    els.battleNetScreenshotGameSelect.replaceChildren(new Option("None", ""));
    for (const game of battleNetScreenshotGames) {
      els.battleNetScreenshotGameSelect.append(new Option(game.title, game.id));
    }
    els.battleNetScreenshotGameSelect.value = battleNetScreenshotGames.some((game) => game.id === currentValue) ? currentValue : "";
  }

  const selectedGame = isBattleNetClient() ? selectedBattleNetScreenshotGame() : null;
  const screenshotsPath = activeScreenshotsPath();
  const emptyPathLabel = isBattleNetClient() ? "Select an installed game" : "Choose a client executable first";
  els.screenshotsPathLabel.textContent = screenshotsPath || emptyPathLabel;
  els.screenshotsPathLabel.title = screenshotsPath || "";
  els.screenshotsGrid.replaceChildren();
  els.openScreenshotsButton.disabled = !screenshotsPath;

  screenshotGallery = screenshotsPath ? await api.listScreenshots(screenshotsPath) : [];
  activeScreenshot = null;
  activeScreenshotIndex = -1;
  if (!screenshotGallery.length) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = isBattleNetClient() && !selectedGame
      ? "Select an installed game to view its screenshots."
      : "No screenshots found. This tab reads the selected client's /Screenshots folder.";
    els.screenshotsGrid.append(empty);
    return;
  }

  screenshotGallery.forEach((screenshot, index) => {
    const card = document.createElement("article");
    card.className = "screenshot-card";
    card.innerHTML = `
      <button class="screenshot-preview" type="button" title="Preview screenshot">
        <img loading="lazy" />
      </button>
      <div>
        <strong></strong>
        <small></small>
      </div>
    `;
    card.querySelector("img").src = screenshot.url;
    card.querySelector("img").alt = screenshot.name;
    card.querySelector("strong").textContent = screenshot.name;
    card.querySelector("small").textContent = new Date(screenshot.modifiedAt).toLocaleString();
    card.querySelector("button").addEventListener("click", () => openScreenshotLightbox(index));
    els.screenshotsGrid.append(card);
  });
}

async function refreshState(preferredClientId) {
  state = await api.getState();
  const detected = state.detected || {};
  let changed = false;

  for (const client of state.config.clients) {
    if (!client.executablePath && detected[client.id]) {
      Object.assign(client, detected[client.id]);
      changed = true;
    }
  }
  if (changed) {
    for (const client of state.config.clients) {
      state.config = await api.saveClient(client);
    }
  }

  els.platformBadge.textContent = state.platform === "linux" ? "Linux" : "Desktop";
  const selectedId = preferredClientId || state.config.activeClientId || "wotlk";
  activeClient = state.config.clients.find((client) => client.id === selectedId) || state.config.clients[0];
  renderProtonOptions();
  hydrateClient(activeClient);
  activateTab(isBattleNetClient(activeClient) && activeClient.executablePath ? "installedGames" : "launcher");
  renderEvents();
  resetEventForm();
  if (playtimeTimer) {
    clearInterval(playtimeTimer);
  }
  playtimeTimer = setInterval(renderHomeSummary, 60000);
}

bindEvents();
refreshState().catch((error) => setStatus("Startup Failed", error.message, "danger"));
