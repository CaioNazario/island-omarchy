# Changelog

Island releases, the Omarchy bar plugin. Format from [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), numbering from [SemVer](https://semver.org/): in the 0.x series, a minor release may break compatibility.

## [Unreleased]

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

[Unreleased]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.5...dev
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
