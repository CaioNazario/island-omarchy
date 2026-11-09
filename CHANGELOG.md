# Changelog

Island releases, the Omarchy bar plugin. Format from [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), numbering from [SemVer](https://semver.org/): in the 0.x series, a minor release may break compatibility.

## [Unreleased]

### Fixed

- Widgets from other plugins no longer show up over a fullscreen video or game when a notification arrives. Under a fullscreen window the whole bar, plugin widgets included, now stays hidden and takes no clicks, even when Hyprland raises it back above the window.
- A plugin widget that hides itself (the QCY one with no earbuds connected) no longer takes the clicks meant for the widgets next to it.

## [0.11.1] - 2026-11-08

### Changed

- Island is now under the **MIT license** (it was GPL-3.0-or-later). The manifest, `LICENSE`, `plugin/NOTICE` and the README say so.

## [0.11.0] - 2026-11-06

### Added

- A full **Pomodoro**, from the Pomodoro Desktop v7 prototype. Clicking the Pomodoro widget now opens a card in the Island with the clock, **Restart**, **Skip** and **Start/Pause** buttons and a progress bar (`Space`, `R`, `S` and `M` work while it is open). The gear opens the settings inside the card: 1 to 24 sessions per cycle, one duration for every session (**Global**) or one per session (**Individual**), **Start automatically**, and the break wallpaper (four presets or your own image, picked with the desktop file chooser). Settings apply at once and live in `settings.json` (`pomodoro`).
- The Pomodoro widget in the bar is a pill with a status dot, the time left and a progress bar. **Controls in the bar**, in the Pomodoro settings, turns it into a row with Restart, Skip, Start/Pause, a gear that opens the settings in the Island and a minimize button; with little room it shrinks back to the pill, then to the dot.
- Your own break wallpaper can be removed: hover its thumbnail and click the **×**. It only forgets the path, the file stays where it is, and the Night wallpaper comes back if it was the chosen one.
- A **sound at the end of the break**: when a break runs out, the Island plays a sound (**Soft** by default, or **Bell**, **Alarm**, **Off**), picked under **Break end sound** in the Pomodoro settings, which plays the choice as you pick it. Skipping a break stays quiet, and so does a break that ended while the computer was suspended.
- A **break screen**: every break covers each monitor with the wallpaper, an instruction and the time left, with the entrance animation from the prototype; the monitor with the focus takes the keyboard. Moving the mouse to the top of the screen (or holding `Esc` for 2 seconds) reveals **Skip break** and **Emergency** (which asks first). **Test break** shows the screen without touching the cycle. The break screen survives a hot-reload of the bar.
- The cycle position and the number of focus sessions finished today are kept in `state.json`; reopening during a break goes back to that session's focus, stopped.

### Changed

- Clicking the Pomodoro widget opens its card instead of starting or pausing the timer; use the card's button (or `Space`) for that.
- The break and focus times are no longer fixed at 5 and 25 minutes, and the notification when a stage ends names the minutes of the stage that starts.

## [0.10.2] - 2026-11-06

### Fixed

- **Back to the plugin id `caionazario.island`.** 0.10.0 and 0.10.1 renamed it to `island-desktop`, but the Omarchy marketplace keeps the id of a listing for good and only accepts updates under the id it already has, so a renamed plugin could not be updated there. The install commands are `omarchy plugin add …` and `omarchy plugin enable caionazario.island` again, and `omarchy plugin update caionazario.island` works. Only 0.10.0 and 0.10.1 used `island-desktop`: if you installed one of them, run `omarchy plugin remove island-desktop`, then add and enable the plugin again (see "Coming from 0.10.0 or 0.10.1" in the README). Settings in `~/.config/island/` are kept. A source install migrates by itself: `./install.sh` removes the `island-desktop` folder. If you added the shortcuts by hand, point `hyprland.lua` back at `plugins/caionazario.island/hypr/island.lua`.

## [0.10.1] - 2026-11-06

### Fixed

- Widgets from other plugins were drawn over the music title when a video started: the window that holds them stayed at an intermediate position while the music widget changed width, and the final position never reached the compositor. The strip is now mapped again once its position settles, so it lands in the right place. The widget blinks for a moment after it moves.
- The volume and brightness keys didn't open the slider in the Island on Omarchy 4.5, which handles them inside the shell and asks its own OSD plugin, turned off while the Island takes over. `hypr/island.lua` now rebinds the five keys (volume up, down and mute, brightness up and down) to the commands that reach the Island. To get it, run `./install.sh` again, or update the plugin and reload Hyprland. Media key messages (play, pause, next) still come only from Omarchy's own OSD, so the Island doesn't show them.

## [0.10.0] - 2026-11-06

### Changed

- **Breaking:** the plugin id is now `island-desktop` (it was `caionazario.island`), so the install commands read `omarchy plugin add …` and `omarchy plugin enable island-desktop`. Don't run `omarchy plugin update caionazario.island` on an existing install: it would pull the new files into the old folder and leave the plugin half-registered. Reinstall with `omarchy plugin remove caionazario.island`, then add and enable it again (see "Coming from 0.9 or earlier" in the README). Settings in `~/.config/island/` are kept. A source install migrates by itself: `./install.sh` removes the old folder. If you added the shortcuts by hand, point `hyprland.lua` at `plugins/island-desktop/hypr/island.lua`.

### Added

- **Restart**, **Power off** and **Log out** now ask first, like the GNOME dialog: the power row turns into a confirmation with a 60 second countdown, and the action runs by itself if you do not answer. **Cancel**, Esc, a click outside or switching the island mode cancels it. Suspend and Lock still run right away.

### Fixed

- **Power off**, **Restart** and **Log out** did nothing on Omarchy 4.5, which no longer ships `omarchy-system-reboot`, `-shutdown` and `-logout`; a missing program fails silently, so the buttons looked dead. They now run `omarchy-system reboot|shutdown|logout`, the same commands as the Omarchy system menu. Closes #40.

## [0.9.0] - 2026-11-05

### Added

- A **Settings** tab in the editor with an *Island handles notifications and OSD* switch. It turns Omarchy's `omarchy.notifications` and `omarchy.osd` plugins off (one `omarchy plugin disable` each) and the Island takes over, or gives them back. Each swap makes the shell rebuild its plugin panels and freeze for a few seconds; the tab says so and trusts the plugin list it reads afterwards rather than the exit code of the `omarchy` command. Closes #38.
- A one-time notification asks whether the Island should take over notifications and the OSD while Omarchy's plugins are still on. The card stays open for 5 s; clicking it opens the Settings tab. Nothing changes until you flip the switch, and if you dismiss the question by mistake the switch is still there.
- A **Weather** tab in the editor: it shows the city in use and where it comes from, searches cities by name (up to 20 results) and clears your choice back to Omarchy's city or the automatic one. When no city can be found, a notification says so once and opens the tab; being offline doesn't count. Closes #37.

### Changed

- Notifications and the OSD no longer need a manual step after `omarchy plugin add`: until you agree, the Island is only a bar and doesn't claim the notification server or the `notifications` and `osd` IPC targets, so Omarchy's keep working. Setups that already turned both plugins off (`./install.sh`) are unaffected: the Island handles them from the start.
- Manifest tags now match the marketplace listing: `bar`, `media`, `quickshell`.
- The README explains how notifications and the OSD are handled and how to turn that on and off, and documents the Weather tab and the city hint.

### Fixed

- Third-party widgets were drawn over the music title: the strip window kept showing its old frame after a sibling changed width. The strip now follows its slot through its left margin, which makes the compositor commit it again. Closes #39.

## [0.8.3] - 2026-11-04

### Changed

- New marketplace preview: the bar and the island expanded, with media and calendar, on the theme gradient. New marketplace description and tags (`desktop`, `appearance`, `media`, `productivity`).

### Fixed

- The text size knob in the display tile was cut on its right side: the next segment painted over it.
- A crowded bar (worse with bar size `large`) pushed widgets under the right-hand buttons: a shrunk `hw` still reserved its full width. Now a slot takes only the width it shows, and widgets with an icon collapse to just the icon before any widget disappears.
- AI usage lagged behind real use: opening the `ai` mode always re-probes the limits (`--limits-only`), the limits refresh every 3 min while the widget is visible, a new refresh button forces a full update, and a collector `retryAdvised` is retried after 30 s.
- Weather: without a city, when wttr.in is unreachable, the area now comes from IP geolocation (ipwho.is) instead of hiding the weather.

## [0.8.2] - 2026-11-02

### Changed

- New marketplace preview: the top bar, the island panels (media and calendar, AI usage, battery, Wi-Fi, volume) and the theme palette in one image.

## [0.8.1] - 2026-11-02

### Fixed

- An event name is cut at 200 characters. A crafted feed with a name of millions of characters froze the shell for seconds every minute, worse since 0.8.0 measures the name to fit it.

## [0.8.0] - 2026-11-02

### Changed

- In English, times use the 12-hour clock (`9:41 PM`): the island clock, event times and the weekly AI usage reset. Event ranges are compact, like `9 – 10:30 AM`. Portuguese keeps the 24-hour clock.

### Fixed

- A long event name no longer pushes the event's time out of the calendar list: the name is cut with an ellipsis.

## [0.7.8] - 2026-11-02

### Fixed

- A crafted ICS feed with many plain events on the same day (about 100,000 fit in the 10 MB cap) could freeze the shell for minutes: events were gathered by copying the whole list for each one. They are now appended to a single list, and at most 10,000 events that may fall in the visible days reach the parser (the same feed now takes about 1.4 s). Time zones from many `VCALENDAR` blocks had the same copying.

## [0.7.7] - 2026-11-02

### Fixed

- A crafted ICS feed could still freeze the shell: the recurrence budget counted periods, and one yearly period with every month and every `BYDAY` value cost thousands of day checks. The budget now counts the work each period does and is sized for the shell's QML engine (the worst hostile feed now takes about 0.2 s instead of minutes), month days are computed without scanning or sorting, and occurrences that end before the visible window skip the time zone conversion.
- A crafted time zone (`VTIMEZONE`) in the feed could also freeze the shell, since every time conversion of every event expanded its rules. Observances with rules heavier than a daylight saving rule are ignored, a zone keeps its 32 most recent observances, and rule onsets are computed once per kind of year instead of on every conversion.
- A very large calendar feed (more than about 300,000 lines, near the 10 MB cap) no longer fails to load in the shell: splitting it into lines overflowed the QML engine's stack.

## [0.7.6] - 2026-11-01

### Fixed

- A crafted ICS feed could freeze the shell for minutes: recurrence rules with impossible or repeated `BYDAY`, `BYMONTHDAY` or `BYMONTH` values are now rejected or deduplicated, and expansion stops at the end of the visible window even when a rule never produces a date.
- Old recurring events with `COUNT` could still freeze the shell for seconds per few hundred events: a whole feed now has a shared expansion budget, and plain events keep showing.
- Network responses are size-capped: the calendar feed at 10 MB, weather and GitHub at 1 MB.
- A notification's text is cut at 500 characters, and its icon name can no longer point at a file path.
- Album art is decoded at the size it's shown, not at whatever size the player sends.

## [0.7.5] - 2026-11-01

### Fixed

- Every text is shown as plain text. A notification title (or a song or network name) carrying an HTML image no longer makes the desktop fetch that image from the sender's server.

## [0.7.4] - 2026-11-01

### Fixed

- The settings and state folders (`~/.config/island` and `~/.local/state/island`) are private (0700): other accounts on the same machine can no longer read the note or the environment names. Existing installs are fixed on the next start.

## [0.7.3] - 2026-10-31

### Added

- A preview image (`preview.png`) at the root of the published plugin, for the Omarchy plugin marketplace card.

### Changed

- The plugin is now named "Island Desktop" in its manifest and README, to stand apart from other plugins called "Island". The id stays `caionazario.island`, so `omarchy plugin update` keeps working.

## [0.7.2] - 2026-10-31

### Fixed

- The README explains how to uninstall a plugin installed with `omarchy plugin add`, and how to remove its settings.
- The manifest declares the same license as the README: GPL-3.0-or-later.

### Changed

- The third-party notice (`NOTICE`) is in English.

## [0.7.1] - 2026-10-31

### Added

- English interface, with a "Language" switch in the footer of the editor's Environments tab to go back to Portuguese. The change applies at once (`language` key in `settings.json`).
- Bar size in the Appearance tab (Size section): Automatic, Small, Medium or Large. It zooms the whole UI (bar, open island, panels and editor), stored in the `barSize` key of `settings.json`.
- On Automatic, each monitor gets the size that suits it: small on laptops and fractional scaling, large on QHD and 4K at scale 1.

### Changed

- English is now the default language. Anyone who prefers Portuguese picks "Português" in the environment editor; environments already edited keep their names as they are.
- The bar adapts to monitors under 1280×720 logical pixels: the zoom drops until the layout fits, instead of clipping the island and the editor.
- The Wi‑Fi speed test ends in "Complete", and the countdown widget shows in the catalog as "Date countdown".

## [0.7.0] - 2026-10-31

### Added

- Configurable background for the pills and the island in the `appearance` key of `settings.json`: the theme color, none or one of the solid colors, and opacity.
- Appearance tab in the environment editor, with the Background section. "Done" moves to the header, next to the tabs.
- Blur behind the pills and the island (Effects section), done by the compositor. With it, the theme background sits at 82%, as in the design.
- Gradient background, with 9 palettes and the Theme palette, taken from the Omarchy theme colors. The strength backs off so text stays readable.
- Film grain over the background (Effects section).
- Configurable border: on or off, width and opacity (Border section).
- Configurable shadow: on or off, and strength (Shadow section).
- Corners of the pills and the island, compact and open: the design's, rounded with a chosen radius, square, or the Hyprland window rounding (Shape section).
- The notification banner follows the island's appearance.
- Ready-made styles in the Appearance tab: Default (the design, which undoes every tweak) and Glass.
- Bar widgets from other Omarchy plugins (such as omaplug) in the pills, added from the "Omarchy plugins" section of the environment editor. The widget opens its panel right below the bar.

### Changed

- Theme and Accent move from the editor's Environments tab to the Appearance tab.
- CI runs on pushes to `dev`.
- A release tag publishes the build to `main` and creates the GitHub release.

## [0.6.0] - 2026-10-27

### Added

- Yellow battery while power saver is on.

### Removed

- What was left from the GNOME days: the city search of the old preferences and the acknowledged-notification field.

## [0.5.0] - 2026-10-21

### Added

- Shortcuts and gestures in the project (`hypr/island.lua`): `Super+S` opens the quick controls (instead of the Omarchy scratchpad); three fingers down open the notification list, and up close it.
- Purple or White accent in the editor.

### Changed

- Only the Nocturne and High contrast themes remain. A removed theme saved in the preferences falls back to Nocturne.
- Stronger quick-control buttons outside Nocturne with the Purple accent.

## [0.4.0] - 2026-10-18

### Added

- Calendar events read from a private ICS feed (Google Calendar's "secret address in iCal format"), with the URL kept in the keyring.
- Scrolling over the bar opens (down) and closes (up) the notification list.

### Fixed

- The widgets saved in environments were lost on restart, and the next edit wiped the preferences file.

## [0.3.0] - 2026-10-17

### Added

- Environment editor: create, rename, change the icon of and delete environments; add widgets from a catalog, move them between the pills and drag them.
- Design themes (Nocturne, Frosted glass, Solid, Light and High contrast), chosen in the editor.

### Fixed

- The weather finds the location the same way as the Omarchy weather widget.
- The weather flickered in an update loop.
- Two-finger swipe switches environments.
- Purple glow around the bar.

## [0.2.0] - 2026-10-17

Design v5.

### Added

- Volume manager: master volume, outputs, each playing app and the microphone. Scrolling on the volume button changes it by 5%.
- Display panel: brightness, text size and monitor scale.
- Battery panel, opened from the battery button: level, charge, cycles, power and power profiles.
- Wi‑Fi: statistics, QR sharing, speed test, DNS, and known networks split from the others.
- AI: one tab per provider, and tokens per day and per model.
- Quick controls at 660px with the Keep screen on, Record screen and Dictation buttons.
- Waves on the music while it plays.

### Changed

- 26px bar.
- Thinner one-line expansions.
- v5 finish on the pills and the island: gloss, halo and soft shadows.
- AI limits read from the `omarchy-agent-usage-update` records: Island no longer reads the CLIs' credentials.
- Suggested shortcuts that Omarchy leaves free: `Super+I` for the quick controls and `Super+Ctrl+Alt+←/→` to switch environments.

### Fixed

- Reinstalling restarts the shell, so the new version takes effect.

## [0.1.0] - 2026-10-17

First release: Island as an Omarchy bar plugin.

### Added

- Three-pill bar replacing the Omarchy bar, with the island in the middle.
- Quick controls: volume, brightness, Wi‑Fi (with the password on the island), Bluetooth and power.
- Volume and brightness OSD on the island.
- Its own notification server: banner, list, and the site instead of the browser on web alerts.
- Music via MPRIS, calendar and center card.
- Weather from Open-Meteo.
- Environments and widgets on the side pills, with hardware and Claude and Codex AI usage.

[Unreleased]: https://github.com/CaioNazario/island-omarchy/compare/v0.9.0...dev
[0.9.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.8.3...v0.9.0
[0.8.3]: https://github.com/CaioNazario/island-omarchy/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/CaioNazario/island-omarchy/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/CaioNazario/island-omarchy/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.8...v0.8.0
[0.7.8]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.7...v0.7.8
[0.7.7]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.6...v0.7.7
[0.7.6]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.5...v0.7.6
[0.7.5]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/CaioNazario/island-omarchy/releases/tag/v0.1.0
