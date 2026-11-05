pragma ComponentBehavior: Bound

import QtQuick
import Quickshell

// Clique na pergunta "a Island cuida das notificações?" (specs/04): abre o
// editor na aba Ajustes, onde está o botão que liga. Ligar nunca acontece só
// pelo clique na notificação: mexe na configuração do Omarchy, então pede o
// toque no interruptor.
Scope {
  id: hint

  property var feed: null
  required property var bar

  Connections {
    target: hint.feed
    function onActionRequested(action) {
      if (action === "takeover") hint.bar.openEditorPage("settings");
    }
  }
}
