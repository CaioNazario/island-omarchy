pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/aiUsage.mjs" as AiCore
import "../core/agentUsage.mjs" as AgentCore

// Um provedor de uso de IA (specs/12-uso-ia.md): credencial do CLI vigiada e
// só lida (nunca escrita nem renovada), polling na agenda do core, cache do
// último uso. Só busca com `polling` (widget `ai` no ambiente ativo). Os
// tokens por dia e por modelo vêm do registro do `omarchy-agent-usage-update`.
Scope {
  id: provider

  required property string providerId
  property bool enabled: true
  property bool polling: false

  property var credential: null
  property var usage: null
  property real fetchedAt: 0
  property var schedule: AiCore.INITIAL_SCHEDULE
  // 401 com o token do arquivo: só sai quando o CLI renovar o arquivo.
  property bool unauthorized: false
  // Registro do omarchy.agents (`parseAgentRecord`), ou null sem arquivo.
  property var record: null

  readonly property string name: providerId === "claude" ? "Claude" : "Codex"
  readonly property string glyph: providerId === "claude" ? "asterisk-fill" : "open-ai-logo-fill"
  readonly property bool loggedIn: enabled && credential !== null
  readonly property bool expired: loggedIn && (unauthorized || AiCore.isExpired(credential, Date.now()))
  readonly property bool offline: AiCore.isOffline(schedule)
  readonly property string plan: usage && usage.plan ? usage.plan
    : credential && credential.plan ? credential.plan
    : record && record.plan ? record.plan : ""

  function refresh() {
    if (!loggedIn || expired || http.running) return;
    const request = AiCore.usageRequest(providerId, credential);
    http.get(request.url, request.headers, response => provider.accept(response));
  }

  /** Abrir o modo `ai` atualiza se o cache passou de 60s. */
  function refreshIfStale() {
    if (Date.now() - fetchedAt > AiCore.OPEN_REFRESH_MS) refresh();
  }

  function accept(response) {
    const parsed = response.status !== 200 ? null
      : providerId === "claude" ? AiCore.parseClaudeUsage(response.body) : AiCore.parseCodexUsage(response.body, Date.now());
    const outcome = AiCore.fetchOutcome(response.status, parsed);
    schedule = AiCore.nextSchedule(schedule, outcome);
    if (outcome === "unauthorized") unauthorized = true;
    if (outcome !== "ok") return;
    usage = parsed;
    fetchedAt = Date.now();
  }

  function readCredential(text) {
    credential = providerId === "claude" ? AiCore.parseClaudeCredentials(text) : AiCore.parseCodexCredentials(text);
    unauthorized = false;
    refresh();
  }

  // O CLI renova o token reescrevendo o arquivo: relê e volta a buscar.
  FileView {
    path: Quickshell.env("HOME") + "/" + AiCore.CREDENTIAL_FILES[provider.providerId].path.join("/")
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: provider.readCredential(text())
    onLoadFailed: provider.credential = null
  }

  // `watchChanges` não vê o arquivo nascer: a fonte chama isto quando o
  // coletor termina.
  function reloadRecord() {
    recordFile.reload();
  }

  FileView {
    id: recordFile

    path: (Quickshell.env("XDG_STATE_HOME") || Quickshell.env("HOME") + "/.local/state") + "/omarchy/agents/usage/" + provider.providerId + ".json"
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: provider.record = AgentCore.parseAgentRecord(text())
    onLoadFailed: provider.record = null
  }

  HttpGet {
    id: http
  }

  Timer {
    interval: provider.schedule.intervalS * 1000
    repeat: true
    running: provider.polling && provider.loggedIn
    triggeredOnStart: true
    onTriggered: provider.refresh()
  }
}
