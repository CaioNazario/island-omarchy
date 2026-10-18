pragma ComponentBehavior: Bound

import QtQuick

// Modo `env` (specs/15-ambientes.md, 260×32): centralizado, gap 9px: ícone
// do ambiente 16px `accent-300` · nome 13px/500 · pontos. Sem clique.
Item {
  id: view

  required property var bar

  Row {
    anchors.centerIn: parent
    spacing: 9

    PhIcon {
      anchors.verticalCenter: parent.verticalCenter
      glyph: view.bar.environment.icon
      color: Tokens.accent300
    }

    IslandText {
      anchors.verticalCenter: parent.verticalCenter
      text: view.bar.environment.name
    }

    EnvDots {
      anchors.verticalCenter: parent.verticalCenter
      count: view.bar.environments.length
      active: view.bar.environmentIndex
      interactive: false
    }
  }
}
