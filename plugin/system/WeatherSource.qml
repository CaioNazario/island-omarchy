pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/weather.mjs" as WeatherCore
import "../core/weatherIcon.mjs" as WeatherIcon

// Clima da ilha compacta (specs/07-clima.md). Localização: a cidade das
// preferências da Island, senão a do Omarchy (`omarchy-weather-location`,
// em `~/.local/state/omarchy/settings/weather.json`), senão nada. Dados do
// Open-Meteo, sem chave, pelo mesmo `curl` que o widget de clima do Omarchy.
Scope {
  id: weather

  // Cidade das preferências da Island (spec 13); `null` usa a do Omarchy.
  property var preferredLocation: null
  property var omarchyLocation: null
  readonly property var location: preferredLocation || omarchyLocation
  property var reading: null
  property real nowMs: Date.now()
  readonly property bool available: reading !== null && WeatherCore.isFresh(reading, nowMs)
  readonly property string glyph: available ? reading.glyph : ""
  readonly property string temperature: available ? WeatherCore.formatTemperature(reading.celsius) : ""

  readonly property int refreshMs: 30 * 60 * 1000

  onLocationChanged: {
    reading = null;
    refresh();
  }

  function refresh() {
    if (!location || fetcher.running) return;
    fetcher.command = ["curl", "-fsS", "--max-time", "10", WeatherCore.openMeteoUrl(location)];
    fetcher.running = true;
  }

  function accept(body) {
    const current = WeatherCore.parseOpenMeteoCurrent(body);
    if (!current) return;
    const glyph = WeatherIcon.weatherGlyph(current.code, current.isDay);
    if (!glyph) return;
    reading = { glyph: glyph, celsius: current.celsius, receivedAt: Date.now() };
    nowMs = reading.receivedAt;
  }

  FileView {
    path: Quickshell.env("HOME") + "/.local/state/omarchy/settings/weather.json"
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: weather.omarchyLocation = WeatherCore.parseWeatherLocation(text())
    onLoadFailed: weather.omarchyLocation = null
  }

  // Falha mantém a última leitura até ela vencer (3h, `isFresh`).
  Process {
    id: fetcher

    stdout: StdioCollector {
      onStreamFinished: weather.accept(text)
    }
  }

  // Um tique por minuto: vence a leitura antiga e percebe a volta da
  // suspensão (um salto no relógio maior que o tique) para buscar de novo.
  Timer {
    property real lastTick: Date.now()

    interval: 60000
    repeat: true
    running: true
    onTriggered: {
      const now = Date.now();
      const resumed = now - lastTick > 2 * interval;
      lastTick = now;
      weather.nowMs = now;
      if (resumed || !weather.reading || now - weather.reading.receivedAt >= weather.refreshMs) weather.refresh();
    }
  }
}
