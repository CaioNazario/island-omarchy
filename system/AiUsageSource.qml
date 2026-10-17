import QtQuick
import Quickshell

// Uso de IA (specs/12-uso-ia.md): Claude e Codex, cada um ligado ou não nas
// preferências. Só busca com o widget `ai` no ambiente ativo (spec 16).
Scope {
  id: ai

  property bool polling: false
  property bool claudeEnabled: true
  property bool codexEnabled: true

  readonly property alias claude: claude
  readonly property alias codex: codex
  readonly property var providers: [claude, codex].filter(provider => provider.enabled)
  readonly property var loggedIn: providers.filter(provider => provider.loggedIn)

  function refreshIfStale() {
    providers.forEach(provider => provider.refreshIfStale());
  }

  AiProvider {
    id: claude

    providerId: "claude"
    enabled: ai.claudeEnabled
    polling: ai.polling
  }

  AiProvider {
    id: codex

    providerId: "codex"
    enabled: ai.codexEnabled
    polling: ai.polling
  }
}
