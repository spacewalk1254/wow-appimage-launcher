# WoW Private Collection

Electron launcher for a Linux World of Warcraft private server collection. It is designed around four client versions:

- `1.12.1` Vanilla
- `2.4.3` The Burning Crusade
- `3.3.5` Wrath of the Lich King
- `Retail` Battle.net

Each version has its own themed background, executable settings, Proton prefix, notes, and launch history. The launcher starts Windows clients through Steam Proton by running the detected Proton `proton` script with `run`.

## Features

- Four fixed WoW version profiles with version-specific artwork and settings.
- Steam Proton auto-detection from common Steam library paths, plus a custom Proton path override.
- Per-version executable, working folder, realmlist path, launch args, Proton prefix, and environment variables.
- Custom calendar tab for raid nights, resets, maintenance, or server events.
- Addons tab that lists the Wrath `Interface/AddOns` directory and opens the folder in the file manager.
- AppImage packaging through `electron-builder`.

## Development

```bash
npm install
npm run dev
```

## Build AppImage

```bash
npm run build:linux
```

The AppImage is written to `dist/`.

## Folder Detection

On startup the launcher looks for clients in common locations such as:

```text
~/Games/WoW Private Servers/vanilla/Wow.exe
~/Games/WoW Private Servers/tbc/Wow.exe
~/Games/WoW Private Servers/wotlk/Wow.exe
~/Games/WoW Private Servers/battle-net/Battle.net.exe
```

You can still choose any executable manually from the Launcher tab.
