pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/weather.mjs" as WeatherCore
import "../core/weatherIcon.mjs" as WeatherIcon

// Clima da ilha compacta (specs/07-clima.md), como o widget de clima do
// Omarchy: a cidade das preferências da Island, senão o `weather.json` do
// `omarchy-weather-location`; sem coordenadas, o wttr.in acha a área pelo
// nome guardado ou pela IP (o padrão do Omarchy sem arquivo), e o ipwho.is
// a acha pela IP quando o wttr.in falha. O tempo vem do
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
  // De onde vem a cidade em uso: `island`, `omarchy`, `auto` ou `none`.
  readonly property string origin: WeatherCore.weatherOrigin(preferredLocation, omarchyLocation, detectedLocation)
  property var reading: null
  property real nowMs: Date.now()
  readonly property bool available: reading !== null && WeatherCore.isFresh(reading, nowMs)
  readonly property string glyph: available ? reading.glyph : ""
  readonly property string temperature: available ? WeatherCore.formatTemperature(reading.celsius) : ""

  readonly property int refreshMs: 30 * 60 * 1000

  // Nenhuma fonte de área deu cidade, e não há outra: a barra decide a dica.
  signal detectionFailed

  onLocationChanged: {
    reading = null;
    refresh();
  }

  function refresh() {
    if (!preferredLocation && !omarchyLocation) detectArea();
    if (!location || fetcher.running) return;
    fetcher.command = ["curl", "-fsS", "--max-time", "10", "--max-filesize", String(WeatherCore.MAX_RESPONSE_BYTES), WeatherCore.openMeteoUrl(location)];
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

  // Índice da fonte de área em tentativa (`WeatherCore.areaSources`).
  property int areaAttempt: 0
  property bool nextAreaPending: false
  // Rodada de detecção: algum `curl` falou com um servidor? E quantas rodadas
  // seguidas assim falharam (offline não conta: `WeatherCore.reachedServer`).
  property bool roundReached: false
  property int failedRounds: 0

  function detectArea() {
    if (areaFetcher.running) return;
    areaAttempt = 0;
    roundReached = false;
    tryAreaSource();
  }

  function tryAreaSource() {
    const sources = WeatherCore.areaSources(omarchyName);
    if (areaAttempt >= sources.length) {
      endRound();
      return;
    }
    areaFetcher.command = ["curl", "-fsS", "--max-time", "10", "--max-filesize", String(WeatherCore.MAX_RESPONSE_BYTES), sources[areaAttempt].url];
    areaFetcher.running = true;
  }

  // Fim de uma rodada sem área: só com rede (algum servidor respondeu) e
  // repetida conta para a dica.
  function endRound() {
    failedRounds = roundReached ? failedRounds + 1 : 0;
    if (origin === "none" && failedRounds >= WeatherCore.HINT_AFTER_ROUNDS) detectionFailed();
  }

  function acceptArea(body) {
    const sources = WeatherCore.areaSources(omarchyName);
    const area = areaAttempt < sources.length ? sources[areaAttempt].parse(body) : null;
    if (!area) {
      // Fonte fora do ar ou sem área: tenta a próxima; sem mais, a próxima atualização recomeça.
      // O fim do `stdout` pode chegar antes de o `curl` sair: com o processo
      // ainda rodando, `running = true` não o reinicia, e a próxima fonte só
      // começa no `onExited`.
      areaAttempt += 1;
      if (areaFetcher.running) nextAreaPending = true;
      else tryAreaSource();
      return;
    }
    // Só troca com coordenadas novas: trocar o objeto apagaria a leitura,
    // buscaria de novo e detectaria a área outra vez, num laço que piscava
    // o clima na ilha.
    failedRounds = 0;
    if (!WeatherCore.sameLocation(area, detectedLocation)) detectedLocation = area;
  }

  // O wttr.in é lento ou instável às vezes: cai para a geolocalização por IP.
  Process {
    id: areaFetcher

    stdout: StdioCollector {
      onStreamFinished: weather.acceptArea(text)
    }
    // `curl -f` sem corpo (conexão recusada, 5xx): o coletor ainda termina com texto vazio.
    onExited: exitCode => {
      if (WeatherCore.reachedServer(exitCode)) weather.roundReached = true;
      if (!weather.nextAreaPending) return;
      weather.nextAreaPending = false;
      weather.tryAreaSource();
    }
  }

  // Busca de cidade por nome (aba Clima do editor, spec 17): até 20 resultados.
  property var searchResults: []
  property bool searching: false
  property string searchQuery: ""
  // Consulta que chegou enquanto a anterior ainda rodava.
  property string searchPending: ""

  function search(query) {
    const text = query.trim();
    if (text === "") {
      searchQuery = "";
      searchPending = "";
      searchResults = [];
      searching = false;
      return;
    }
    searching = true;
    if (searcher.running) {
      searchPending = text;
      return;
    }
    searchQuery = text;
    searcher.command = ["curl", "-fsS", "--max-time", "10", "--max-filesize", String(WeatherCore.MAX_RESPONSE_BYTES), WeatherCore.geocodingUrl(text)];
    searcher.running = true;
  }

  Process {
    id: searcher

    stdout: StdioCollector {
      // Resposta de uma consulta já trocada não entra.
      onStreamFinished: if (weather.searchPending === "") weather.searchResults = WeatherCore.parseGeocoding(text)
    }
    onExited: {
      const next = weather.searchPending;
      weather.searchPending = "";
      if (next === "") weather.searching = false;
      else weather.search(next);
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
