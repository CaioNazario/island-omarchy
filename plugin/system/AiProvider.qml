pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/agentUsage.mjs" as AgentCore

// Um provedor de uso de IA (specs/12-uso-ia.md): só o registro que
// `omarchy-agent-usage-update` grava em
// $XDG_STATE_HOME/omarchy/agents/usage/<id>.json, como o widget de agentes do
// Omarchy. A Island não lê credencial nem fala com as APIs.
Scope {
  id: provider

  required property string providerId
  property bool enabled: true

  // `parseAgentRecord`, ou null sem arquivo.
  property var record: null

  readonly property string name: providerId === "claude" ? "Claude" : "Codex"
  readonly property string glyph: providerId === "claude" ? "asterisk-fill" : "open-ai-logo-fill"
  readonly property var session: record ? record.session : null
  readonly property var weekly: record ? record.weekly : null
  readonly property bool hasLimits: enabled && (session !== null || weekly !== null)
  readonly property string plan: record ? record.plan : ""
  readonly property string status: record ? record.status : ""

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
}
