pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/icsEvents.mjs" as IcsEvents
import "../core/icsFeed.mjs" as IcsFeed

// Eventos do calendário (specs/06-calendario.md "Eventos"): feed ICS privado
// (spec 14, S8), por exemplo o "Endereço secreto no formato iCal" do Google
// Calendar. A URL é credencial: vem do chaveiro (`secret-tool`), fica só em
// memória e chega ao `curl` pela entrada padrão (`-K -`), nunca na linha de
// comando, em log ou em arquivo. Sem URL no chaveiro (ou sem `secret-tool`)
// a lista é vazia e a UI mostra só o título.
Scope {
  id: calendar

  readonly property real dayMs: 24 * 60 * 60 * 1000
  readonly property int refreshMs: 15 * 60 * 1000

  property string feedUrl: ""
  property string feedText: ""
  property real dayStartMs: startOfToday()
  // Ontem a amanhã: a UI filtra "hoje" (calendar.ts); a folga cobre evento que
  // cruza a meia-noite e a virada do dia entre duas atualizações do feed.
  // O feed é lido de novo só quando chega um novo ou o dia vira.
  /** `CalendarEvent[]` do src/core/calendar.ts. */
  readonly property var events: feedText === "" ? [] : IcsEvents.parseIcsEvents(feedText, new Date(dayStartMs - dayMs), new Date(dayStartMs + 2 * dayMs))

  function startOfToday() {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    return day.getTime();
  }

  function refresh() {
    if (reader.running || fetcher.running) return;
    if (feedUrl === "") {
      reader.running = true;
      secretTimeout.restart();
      return;
    }
    fetcher.configText = IcsFeed.curlConfigLine(feedUrl);
    fetcher.stdinEnabled = true;
    fetcher.running = true;
  }

  function accept(body) {
    // Falha de rede (corpo vazio) mantém URL e eventos. Corpo que não é ICS
    // (URL trocada no Google, página de login) pede a URL do chaveiro de novo.
    if (body === "") return;
    if (!IcsFeed.isIcsFeed(body)) {
      feedUrl = "";
      return;
    }
    feedText = body;
  }

  Process {
    id: reader

    command: ["secret-tool", "lookup", "service", "island", "kind", "calendar-ics"]
    stdout: StdioCollector {
      onStreamFinished: {
        secretTimeout.stop();
        const url = IcsFeed.feedUrlFromSecret(text);
        if (!url) return;
        calendar.feedUrl = url;
        calendar.refresh();
      }
    }
  }

  // Chaveiro bloqueado pedindo senha: mais de 5s sem terminar conta como sem URL
  // (mesma regra do token do GithubSource).
  Timer {
    id: secretTimeout

    interval: 5000
    onTriggered: reader.signal(9)
  }

  Process {
    id: fetcher

    property string configText: ""

    command: ["curl", "-fsS", "--max-time", "20", "-K", "-"]
    stdinEnabled: true
    onStarted: {
      write(configText);
      configText = "";
      // Fechar a entrada encerra o arquivo de configuração do `-K -`.
      stdinEnabled = false;
    }
    stdout: StdioCollector {
      onStreamFinished: calendar.accept(text)
    }
  }

  // Um tique por minuto: vira o dia (a lista de hoje muda sem novo download) e
  // percebe a volta da suspensão (um salto no relógio maior que o tique).
  Timer {
    property real lastTick: Date.now()
    property real lastRefresh: 0

    interval: 60000
    repeat: true
    running: true
    triggeredOnStart: true
    onTriggered: {
      const now = Date.now();
      const resumed = now - lastTick > 2 * interval;
      lastTick = now;
      calendar.dayStartMs = calendar.startOfToday();
      if (!resumed && now - lastRefresh < calendar.refreshMs) return;
      lastRefresh = now;
      calendar.refresh();
    }
  }
}
