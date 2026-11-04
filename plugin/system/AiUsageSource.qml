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

  readonly property alias claude: claudeProvider
  readonly property alias codex: codexProvider
  readonly property var providers: [claudeProvider, codexProvider].filter(provider => provider.enabled)
  readonly property var withLimits: providers.filter(provider => provider.hasLimits)
  // Aba escolhida no modo `ai`; sem escolha válida, o primeiro provedor.
  property string selectedId: ""
  readonly property var current: providers.find(provider => provider.providerId === selectedId) ?? providers[0] ?? null

  readonly property int recordsIntervalMs: 900 * 1000
  // Só os limites (barato: o coletor reaproveita a varredura das transcrições
  // dos últimos 900s), enquanto o widget `ai` está visível.
  readonly property int limitsIntervalMs: 180 * 1000
  readonly property int retryMs: 30 * 1000

  // `normal`: tudo; `limits`: `--limits-only`; `force`: `--force` (o botão de
  // atualizar). Como no `agents` do Omarchy, um pedido durante uma rodada vira
  // uma só rodada depois, e a forçada vale mais que as outras.
  property string pendingKind: ""

  // Abrir o modo `ai` re-sonda os limites, sem a regra de cache velho.
  function refreshOnOpen() {
    runUpdate("limits", []);
  }

  function refresh() {
    runUpdate("force", []);
  }

  function updateRecords() {
    runUpdate("normal", []);
  }

  function updateCommand(kind, ids) {
    const flag = kind === "force" ? ["--force"] : kind === "limits" ? ["--limits-only"] : [];
    return ["omarchy-agent-usage-update"].concat(flag, ids.length > 0 ? ids : providers.map(provider => provider.providerId));
  }

  function runUpdate(kind, ids) {
    if (providers.length === 0) return;
    if (updateProc.running) {
      if (kind === "force" || pendingKind === "") pendingKind = kind;
      return;
    }
    updateProc.command = updateCommand(kind, ids);
    updateProc.running = true;
  }

  function scheduleRetry() {
    if (providers.some(provider => provider.retryAdvised)) retryTimer.restart();
    else retryTimer.stop();
  }

  Process {
    id: updateProc

    onExited: {
      ai.providers.forEach(provider => provider.reloadRecord());
      retryCheck.restart();
      if (ai.pendingKind === "") return;
      const kind = ai.pendingKind;
      ai.pendingKind = "";
      ai.runUpdate(kind, []);
    }
  }

  readonly property bool running: updateProc.running

  // O registro recarrega de forma assíncrona: confere o aviso logo depois.
  Timer {
    id: retryCheck

    interval: 500
    onTriggered: ai.scheduleRetry()
  }

  // O coletor avisa (`retryAdvised`) que não alcançou os limites: um retorno
  // mais cedo só dos provedores que avisaram, em vez de esperar 900s.
  Timer {
    id: retryTimer

    interval: ai.retryMs
    onTriggered: ai.runUpdate("limits", ai.providers.filter(provider => provider.retryAdvised).map(provider => provider.providerId))
  }

  Timer {
    interval: ai.recordsIntervalMs
    repeat: true
    running: ai.polling
    triggeredOnStart: true
    onTriggered: ai.updateRecords()
  }

  Timer {
    interval: ai.limitsIntervalMs
    repeat: true
    running: ai.polling
    onTriggered: ai.runUpdate("limits", [])
  }

  AiProvider {
    id: claudeProvider

    providerId: "claude"
    enabled: ai.claudeEnabled
  }

  AiProvider {
    id: codexProvider

    providerId: "codex"
    enabled: ai.codexEnabled
  }
}
