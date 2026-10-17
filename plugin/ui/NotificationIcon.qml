pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Effects
import QtQuick.Window
import Quickshell

// Bloco do ícone de notificação (specs/04-notificacoes.md): fundo
// `accent-900` e ícone `accent-300`. Site da tabela → glifo Phosphor dele;
// app nativo → ícone simbólico do tema (`<ícone>-symbolic`) tingido; sem
// simbólico → `ph-fill ph-bell`.
Rectangle {
  id: block

  required property var entry
  property int iconSize: 20

  // `check`: devolve vazio quando o tema não tem o ícone.
  readonly property string themeIcon: entry.glyph || entry.appIcon === "" ? ""
    : entry.appIcon.startsWith("/") || entry.appIcon.startsWith("file:") ? ""
    : Quickshell.iconPath(entry.appIcon.endsWith("-symbolic") ? entry.appIcon : entry.appIcon + "-symbolic", true)

  color: Tokens.accent900

  PhIcon {
    anchors.centerIn: parent
    visible: block.themeIcon === ""
    glyph: block.entry.glyph || "bell-fill"
    size: block.iconSize
    color: Tokens.accent300
  }

  Image {
    id: themed

    anchors.centerIn: parent
    width: block.iconSize
    height: block.iconSize
    visible: false
    source: block.themeIcon
    sourceSize: Qt.size(Math.ceil(block.iconSize * Screen.devicePixelRatio), Math.ceil(block.iconSize * Screen.devicePixelRatio))
    layer.enabled: true
  }

  // Simbólicos do tema vêm escuros (Adwaita: #222): o brilho os leva ao
  // branco antes de tingir, senão a colorização mantém o escuro.
  MultiEffect {
    anchors.fill: themed
    source: themed
    visible: block.themeIcon !== ""
    brightness: 1
    colorization: 1
    colorizationColor: Tokens.accent300
  }
}
