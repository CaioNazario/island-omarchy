import QtQuick
import Quickshell
import Quickshell.Io

// Uso de IA (specs/12-uso-ia.md): Claude e Codex, cada um ligado ou não nas
// preferências. Só busca com o widget `ai` no ambiente ativo (spec 16). Os
// registros de tokens são regenerados por `omarchy-agent-usage-update`, como
// faz o widget de agentes do Omarchy: com a Island no lugar da barra, ninguém
// mais roda o coletor.
Scope {
  id: ai

  property bool polling: false
  property bool claudeEnabled: true
  property bool codexEnabled: true

  readonly property alias claude: claude
  readonly property alias codex: codex
  readonly property var providers: [claude, codex].filter(provider => provider.enabled)
  readonly property var withLimits: providers.filter(provider => provider.hasLimits)
  // Aba escolhida no modo `ai`; sem escolha válida, o primeiro provedor.
  property string selectedId: ""
  readonly property var current: providers.find(provider => provider.providerId === selectedId) ?? providers[0] ?? null

  readonly property int recordsIntervalMs: 900 * 1000
  readonly property int recordsStaleMs: 5 * 60 * 1000

  function refreshIfStale() {
    const newest = Math.max(0, ...providers.map(provider => provider.record ? provider.record.updatedAt : 0));
    if (Date.now() - newest > recordsStaleMs) updateRecords();
  }

  function updateRecords() {
    if (updateProc.running || providers.length === 0) return;
    updateProc.command = ["omarchy-agent-usage-update"].concat(providers.map(provider => provider.providerId));
    updateProc.running = true;
  }

  Process {
    id: updateProc

    onExited: ai.providers.forEach(provider => provider.reloadRecord())
  }

  Timer {
    interval: ai.recordsIntervalMs
    repeat: true
    running: ai.polling
    triggeredOnStart: true
    onTriggered: ai.updateRecords()
  }

  AiProvider {
    id: claude

    providerId: "claude"
    enabled: ai.claudeEnabled
  }

  AiProvider {
    id: codex

    providerId: "codex"
    enabled: ai.codexEnabled
  }
}
