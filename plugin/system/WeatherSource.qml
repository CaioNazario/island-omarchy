pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/weather.mjs" as WeatherCore
import "../core/weatherIcon.mjs" as WeatherIcon

// Clima da ilha compacta (specs/07-clima.md), como o widget de clima do
// Omarchy: a cidade das preferências da Island, senão o `weather.json` do
// `omarchy-weather-location`; sem coordenadas, o wttr.in acha a área pelo
// nome guardado ou pela IP (o padrão do Omarchy sem arquivo). O tempo vem do
// Open-Meteo pelas coordenadas, sem chave, pelo mesmo `curl`.
Scope {
  id: weather

  // Cidade das preferências da Island (spec 13); `null` usa a do Omarchy.
  property var preferredLocation: null
  property var omarchyLocation: null
  // Nome do `weather.json` sem coordenadas ('' sem arquivo: detectar pela IP).
  property string omarchyName: ""
  // Área achada pelo wttr.in quando não há coordenadas.
  property var detectedLocation: null
  readonly property var location: preferredLocation || omarchyLocation || detectedLocation
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
    if (!preferredLocation && !omarchyLocation) detectArea();
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
    onLoaded: {
      weather.omarchyLocation = WeatherCore.parseWeatherLocation(text());
      weather.omarchyName = WeatherCore.parseWeatherName(text());
      weather.detectedLocation = null;
      weather.refresh();
    }
    onLoadFailed: {
      weather.omarchyLocation = null;
      weather.omarchyName = "";
      weather.refresh();
    }
  }

  function detectArea() {
    if (areaFetcher.running) return;
    areaFetcher.command = ["curl", "-fsS", "--max-time", "10", WeatherCore.wttrUrl(omarchyName)];
    areaFetcher.running = true;
  }

  // O wttr.in é lento ou instável às vezes: sem área, a próxima atualização tenta de novo.
  Process {
    id: areaFetcher

    stdout: StdioCollector {
      onStreamFinished: {
        const area = WeatherCore.parseWttrArea(text);
        if (area) weather.detectedLocation = area;
      }
    }
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
