# Island

A bar plugin for **[Omarchy](https://omarchy.org/)** (Hyprland + Quickshell) that replaces the default bar with three floating pills.

The middle pill, the **Island**, works like a Dynamic Island for the desktop: it grows and shrinks with the context and brings together notifications, music, volume, brightness, calendar, quick controls and other system information. The side pills show widgets, grouped into **environments** you switch with a swipe or a shortcut.

![The Island bar with the music and calendar card open](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/hero.png)

---

## Features

### The Island

When compact, the Island shows the weather, the clock and the day of the week.

When expanded, it can show:

- Notifications
- Music and playback controls, with waves that pulse while playing
- Volume and brightness
- Volume mixer: outputs, per-app volume and microphone
- Calendar
- Quick controls
- Wi‑Fi: connection stats, a QR code to share the network, speed test and DNS
- Bluetooth
- Display: brightness, text size and monitor scale
- Battery: details and power profile
- AI usage

Only one mode is open at a time.

| Music and calendar | AI usage |
|---|---|
| ![The center card with music and the calendar](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/center-card.png) | ![AI usage](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/ai.png) |

| Wi‑Fi | Bluetooth |
|---|---|
| ![Quick controls with the Wi‑Fi panel](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/quick-wifi.png) | ![Quick controls with the Bluetooth panel](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/bluetooth.png) |

| Volume mixer | Battery |
|---|---|
| ![Volume mixer](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/mixer.png) | ![Battery](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/battery.png) |

### Environments

An environment is a named set of widgets for the two side pills. The left pill starts with the environment button, followed by the environment's widgets; the right pill holds the environment's widgets next to the fixed buttons (notifications, Wi‑Fi, volume, battery and quick controls). Only one environment is active at a time, the same on every monitor.

![The bar in the default environment](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/bar-default.png)

![The bar in a custom environment with music and widgets from other plugins](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/bar-plugins.png)

Island ships with four:

| Environment | Left | Right |
|---|---|---|
| Default | AI usage | Hardware |
| Work | Next event, Pomodoro, AI usage | Hardware, GitHub |
| Studies | Day progress, Pomodoro | Note |
| Weekend | Music | Date countdown |

You can have up to six. The first one can be renamed and changed, but not deleted.

To switch environments:

- Scroll horizontally over the bar (two fingers on the touchpad, or a tilting wheel)
- `Super+Ctrl+Alt+→` / `Super+Ctrl+Alt+←`
- Click one of the dots on the environment button
- Click its tab in the environment editor

### Widgets

| Widget | Shows | Click |
|---|---|---|
| AI usage | Session and weekly limits | Opens the AI card |
| Hardware | CPU, RAM, GPU, temperature and network | Opens the quick controls |
| Next event | Today's next event | Opens the calendar |
| Pomodoro | 25 min focus and 5 min break cycles | Starts or pauses |
| Music | What's playing now | Opens the music player |
| GitHub | Your open PRs and how many wait for your review | — |
| Day progress | How much of the day has passed | — |
| Date countdown | Days until a date | — |
| Note | A short note pinned to the bar | Edits the note |

The date countdown's name and date are set in `settings.json` (`countdownName` and `countdownDate`, as `YYYY-MM-DD`).

Widgets never push the Island or the fixed buttons. When space runs out, the Hardware widget drops its blocks (network, GPU, temperature), and then whole widgets disappear, starting with the one farthest from the Island.

Data sources used only by widgets (hardware, AI usage, GitHub) run only while one of their widgets is in the active environment.

#### Widgets from other plugins

Bar widgets from other Omarchy plugins, such as [omaplug](https://github.com/fross100/omaplug) or [OmaSettings](https://github.com/twiking/omasettings), can live in the pills next to the Island's own widgets. They show up in the editor under **Omarchy plugins**, and you add, move and remove them like any other widget. Their panels open right below the bar, one at a time, and opening an Island mode closes them.

Omarchy's own widgets (clock, audio, Bluetooth…) aren't offered: they expect Omarchy's full bar. A widget that needs its plugin's own service won't fully work, because Omarchy doesn't hand that service to third-party bars. If a plugin is removed, its widget stays in the environment and simply isn't drawn.

### Environment editor

Click the environment button, at the start of the left pill, to open the editor. In the **Environments** tab you can:

- Create, rename, change the icon of and delete environments
- Add widgets by clicking them in the catalog, or by dragging them onto a pill
- Choose which pill a click adds to (left or right)
- Reorder widgets by dragging them on the bar itself, or click a widget on the bar to move it one step, send it to the other pill or remove it

![The environment editor](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/editor.png)

Every change is saved right away. **Done**, `Esc`, a click on the dimmed background or another click on the environment button closes the editor.

### Language

The interface is in English by default. The **Language** switch in the footer of the editor's Environments tab changes it to Portuguese (Brazil) and back, right away (`language` in `settings.json`). Environment names you've edited stay as you wrote them.

### Appearance

The **Appearance** tab of the editor styles the pills, the Island and the notification banner together. Each section only shows the controls that apply to the current choice, and every change shows up on the bar as you make it.

![The Appearance tab of the editor](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/appearance.png)

- **Size**: Automatic, Small, Medium or Large. It scales the whole Island UI (bar, open Island, panels and editor). On Automatic, each monitor gets its own size: small on laptops and fractional scaling, large on QHD and 4K at scale 1. On small monitors the size drops until everything fits.
- **Style**: two presets. *Default* is the original design and undoes every tweak; *Glass* is a gradient with film grain.
- **Theme**: Nocturne or High contrast, with a purple or white accent.
- **Background**: on or off; solid (the theme color, none, or one of 10 dark colors) or a gradient (9 palettes, plus one taken from your Omarchy theme). The gradient strength backs off as needed to keep text readable. Opacity follows the theme or is set by hand.
- **Shape**: the design's corners, rounded with a chosen radius, square, or the same rounding as your Hyprland windows.
- **Shadow** and **border**: on or off, with strength, width and opacity.
- **Effects**: compositor blur behind the bar and film grain over the background.

The same bar with a gradient background and with a solid one:

![The bar with a gradient background](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/bar-default.png)

![The bar with a solid background](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/bar-solid.png)

Everything is stored under `appearance` in `~/.config/island/settings.json`. Without any change, the bar looks like the original design.

### Auto-hide

> Planned, not available yet.

When it lands, auto-hide will be off by default and switched on in the environment editor. With it on, the bar won't reserve space at the top of the screen: it slides out of view and comes back when the pointer pushes against the top edge, or when the Island opens a mode (a notification, `Super+S`…).

### Notifications

The Island is the session's notification server, in place of Omarchy's toasts. Notifications appear in the Island and are kept in a list.

In Chrome, Brave and other Chromium browsers, web notifications show the service they came from, such as WhatsApp, Discord or YouTube. Firefox doesn't send that information, so its notifications just say Firefox.

There is also **Do not disturb**, and Omarchy's notification shortcuts and scripts (`Super+,`, `omarchy toggle notification-silencing`…) keep working.

### Music

Works with any player that implements **MPRIS**, including Spotify and players running in the browser. Shows the album art, title, artist and playback controls.

### Center card

The center card brings together the music that's playing, the week or month calendar, and today's events from your calendar's ICS feed (see [Calendar](#calendar)). A click on the compact Island opens it, or opens just the calendar, depending on the `clickAction` setting.

### Calendar

Events come from a private ICS feed, for example Google Calendar's (read-only). In Google Calendar: **Settings → (your calendar) → Integrate calendar → Secret address in iCal format**. Store the URL in the keyring, without passing it on the command line:

```bash
secret-tool store --label="Island: calendar (ICS)" service island kind calendar-ics
```

The command asks for the value in the terminal: paste the URL. The Island reads the URL from the keyring each time it refreshes the feed (every 15 minutes) and keeps it only in memory. To stop using it: `secret-tool clear service island kind calendar-ics`.

Single, all-day and recurring events (`RRULE`, `EXDATE`) are supported, as well as edited or cancelled occurrences. Anyone with the URL can read your whole calendar: don't paste it into an issue, a log or a config file, and create a new one in Google if it leaks. Google takes a while to reflect changes in the feed (from minutes to a few hours).

### Weather

From Open-Meteo, with no API key. The city comes from:

- `weatherLocation` in `~/.config/island/settings.json`
- Omarchy's city (`omarchy weather location`)

Without a city, the weather disappears from the Island (there's no IP geolocation).

### Quick controls

Open them with the arrow on the right pill or with `Super+S`.

![Quick controls](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/quick.png)

They include:

- Volume (the icon opens the volume mixer) and brightness
- Wi‑Fi and Bluetooth
- Night light (Omarchy's hyprsunset)
- Do not disturb
- Display (brightness, `omarchy-display-text-size` and monitor scale)
- Keep the screen on (the same as `omarchy toggle idle`)
- Screen recording (Omarchy's capture menu)
- Dictation (Voxtype, if installed)
- Settings (Omarchy's setup menu)
- Power: suspend, restart, shut down, log out and lock, through Omarchy's commands

![The power row](https://raw.githubusercontent.com/CaioNazario/island-omarchy/dev/docs/screenshots/power.png)

Omarchy's volume and brightness keys open the Island instead of Omarchy's OSD. Other OSD messages (microphone, shutting down…) show up in a mode of their own.

### Hardware

CPU, RAM, Intel or AMD GPU, temperature and network.

### Battery

The bar draws the battery with the level inside: green from 80%, red up to 20%, and a bolt while charging. A click opens a panel with capacity, time left, charge cycles and power draw (`omarchy-battery-status`), and the power profile (`omarchy-powerprofiles-set`).

### AI usage

The Island shows the usage limits and the tokens per day and per model for **Claude** and **Codex**, from the records of `omarchy-agent-usage-update`, which it runs the same way Omarchy's agents widget does.

> See [AI usage: read first](#ai-usage-read-first).

---

## How it works

The Island has two kinds of modes.

### Transient

Opened automatically by events, and gone after a few seconds:

- `notif`
- `music`
- `volume`
- `brightness`
- `osd` (other OSD messages)
- `env` (the environment's name when you switch)

Hovering the Island keeps the mode open.

### Fixed

Opened by a click or a shortcut, and kept open until you:

- Click outside
- Press `Esc`
- Trigger something else

Fixed modes: `stack` (notification list), `calendar`, `quick`, `wifi`, `bt`, `mixer`, `display`, `battery`, `ai`, `note`.

### Events don't interrupt what you opened

Automatic events respect the fixed mode that's open. For example:

- A notification doesn't replace an open calendar: it shows up as a banner below the Island.
- A new song doesn't open the music mode while another fixed mode is open.

This keeps the interface from jumping around while you're using a control.

### Interactions

- **Click the compact Island:** opens the center card or the calendar, depending on the `clickAction` setting.
- **Click a notification:** opens the notification list.
- **Scroll down over the bar** (any of the three pills, mouse or touchpad): opens the notification list; **up** closes it. Inside the list, scrolling up scrolls the list and only closes it at the top.
- **Three fingers down on the touchpad:** opens the notification list; **up** closes it.
- **Click the environment button:** opens the environment editor.
- **`Super+S`:** opens the quick controls.
- **`Super+Ctrl+Alt+←/→`:** switches environments.
- **`Esc`:** closes the current fixed mode.

The shortcuts and gestures are Hyprland binds that call the Island's `island` IPC target (`toggleQuick`, `openStack`, `closeStack`, `nextEnvironment`, `previousEnvironment`), in `hypr/island.lua`.

---

## Architecture

```
src/core/       Pure TypeScript rules (Island states, notification routing, environments,
                appearance, calendar and weather parsing, formatting), tested with Vitest
plugin/         The plugin: manifest.json, Bar.qml (one bar per monitor) and Service.qml
                (state that survives reloads, IPC)
  system/       Data sources: PipeWire, MPRIS, UPower, NetworkManager, BlueZ, the notification
                server, /proc and /sys, Open-Meteo and GitHub over HTTP, the AI usage records,
                the ICS feed and Hyprland options
  ui/           QML components: pills, Island, modes, center card, widgets, editor
  shaders/      Gradient and film grain shaders (.frag sources and compiled .qsb)
hypr/           Island shortcuts and gestures (island.lua)
dev/            Harness that hosts the plugin in a nested Hyprland
scripts/        Build, the nested Hyprland driver and the shader check
specs/          Behavior specs
design/         Design reference extracted from the prototype
```

`src/core` is compiled to ES modules (`.mjs`) that the QML imports directly.

---

## Requirements

- **Omarchy 4** (Quickshell 0.3, Hyprland 0.56)

### Optional features

**Weather:** a city (see [Weather](#weather)).

**AI usage:** logged in to one or both:

- Claude Code — `~/.claude/.credentials.json`
- Codex CLI — `~/.codex/auth.json`

**Calendar:** `secret-tool` (libsecret) and your feed's ICS URL (see [Calendar](#calendar)).

**GitHub:** [`gh`](https://cli.github.com/), logged in (`gh auth login`). The Island only reads the token with `gh auth token` and keeps it in memory.

---

## Installation

```bash
omarchy plugin add https://github.com/CaioNazario/island-omarchy.git
omarchy plugin enable caionazario.island
```

The Island takes over notifications and the OSD. Disable the Omarchy plugins that do the same, so two servers don't compete for the same IPC targets:

```bash
omarchy plugin disable omarchy.notifications
omarchy plugin disable omarchy.osd
```

### Shortcuts and gestures

The plugin ships the Island's shortcuts and gestures in `hypr/island.lua`. To turn them on, add this to the end of `~/.config/hypr/hyprland.lua`:

```lua
dofile(os.getenv("HOME") .. "/.config/omarchy/plugins/caionazario.island/hypr/island.lua")
```

- `Super+S`: quick controls (takes this key away from Omarchy's scratchpad)
- `Super+Ctrl+Alt+←/→`: switch environments
- Three fingers down on the touchpad: open the notification list; up: close it

Since the file lives inside the plugin, `omarchy plugin update` updates the shortcuts too. Don't repeat these binds in your `bindings.lua`: Hyprland would run both.

### Settings

Settings live in `~/.config/island/settings.json` (a settings window isn't available yet). Changes to the file apply right away.

### From source

Building needs Node.js and npm (CI uses Node 26).

```bash
git clone -b dev https://github.com/CaioNazario/island-omarchy.git
cd island-omarchy

npm ci
./install.sh
```

`install.sh` builds the plugin, copies it to `~/.config/omarchy/plugins/caionazario.island/`, turns off Omarchy's notifications and OSD, and switches the bar. The shell reloads by itself, without logging out.

It also installs the shortcuts and gestures: it copies `hypr/island.lua` to `~/.config/hypr/island.lua` and adds `require("hypr.island")` to the end of `~/.config/hypr/hyprland.lua`, with a backup. `./install.sh --uninstall` removes the line and the file, goes back to Omarchy's bar and turns its notifications and OSD back on.

To update a source install: `git pull`, `npm ci` and `./install.sh` again.

---

## Updating

```bash
omarchy plugin update caionazario.island
```

---

## Uninstalling

Remove the plugin, then bring back Omarchy's bar, notifications and OSD:

```bash
omarchy plugin remove caionazario.island
omarchy plugin enable omarchy.bar
omarchy plugin enable omarchy.notifications
omarchy plugin enable omarchy.osd
```

If you turned on the shortcuts and gestures, delete the `dofile(...)` line you added to `~/.config/hypr/hyprland.lua`. For a source install, `./install.sh --uninstall` does all of this.

Your settings and state stay behind, in case you install it again. To remove them too:

```bash
rm -rf ~/.config/island ~/.local/state/island
secret-tool clear service island kind calendar-ics   # only if you set up the calendar
```

---

## AI usage: read first

The Island doesn't read credentials or call usage APIs on its own. It runs `omarchy-agent-usage-update` (the same collector as Omarchy's agents widget) every 15 minutes, while the AI widget is in the active environment, and reads its records in `~/.local/state/omarchy/agents/usage/`.

The limits depend on Omarchy's collector: Claude's uses Claude Code's credential to call a usage endpoint that isn't a public API and may change.

Without a CLI login, the widget is still there but only shows **"AI"**. To stop using this feature, turn the providers off with `aiClaudeEnabled` and `aiCodexEnabled` in `settings.json`.

---

## Limitations

Currently:

- Not built yet: auto-hide (the rules exist in the core, but the bar doesn't use them) and the settings window (settings are edited in `settings.json`).
- The calendar is read-only (ICS feed): it doesn't create or edit events. It doesn't support `RDATE`, or `RRULE` with `BYSETPOS`, `BYWEEKNO`, `BYYEARDAY`, `WKST` (weeks always start on Monday) or a frequency below daily: those events only show their first occurrence.
- The hardware widget reads AMD and Intel GPUs. NVIDIA doesn't show up.
- Firefox notifications don't show the web service they came from.
- There's no light theme and no action buttons on notifications: a click opens the app or the site.
- There's no system tray (AppIndicator) and no keyboard layout switcher.
- The bar only sits at the top of the screen.

---

## Development

```bash
npm ci
make test    # Vitest on src/core
make lint    # ESLint, Prettier, tsc, the core modules in the QML engine, and qmllint
make build   # dist/caionazario.island/
make dev     # nested Hyprland in a window, running the plugin through the dev/ harness
make smoke   # the same without interaction: 5 hot reloads, fails on any error in the log
```

The harness runs on its own D-Bus, with `XDG_CONFIG_HOME`/`XDG_STATE_HOME` under `dist/xdg`: it doesn't compete for your session's notifications or write to your settings. To drive the Island from outside: `scripts/nested.sh serve`, `scripts/nested.sh ipc dev open quick`, `scripts/nested.sh notify "Title" "Body"`, `scripts/nested.sh shot` and `scripts/nested.sh stop`.

The source lives on the [`dev`](https://github.com/CaioNazario/island-omarchy/tree/dev) branch; `main` only holds the built plugin, one `build: vX.Y.Z` commit per release.

---

## Specs and design

The Island's behavior is documented in [`specs/`](https://github.com/CaioNazario/island-omarchy/tree/dev/specs), starting with [`specs/00-visao-geral.md`](https://github.com/CaioNazario/island-omarchy/blob/dev/specs/00-visao-geral.md). The visual reference is in [`design/`](https://github.com/CaioNazario/island-omarchy/tree/dev/design), and the development conventions in [`AGENTS.md`](https://github.com/CaioNazario/island-omarchy/blob/dev/AGENTS.md). Specs and conventions are written in Brazilian Portuguese.

---

## Debugging

Logs of the Omarchy shell, where the plugin runs:

```bash
qs log -p /usr/share/omarchy/shell
```

Harness logs: `dist/dev.log`.

---

## License

GPL-3.0-or-later

The shaders and part of the appearance formulas come from [omadock](https://github.com/thepathless/omadock) (MIT); the license notice is in [`plugin/NOTICE`](https://github.com/CaioNazario/island-omarchy/blob/dev/plugin/NOTICE).
