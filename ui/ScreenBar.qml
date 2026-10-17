pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Wayland

// Barra de um monitor (specs/02-barra.md). Duas superfícies: uma faixa
// invisível que reserva os 28px do topo, e uma camada transparente de tela
// cheia onde a ilha cresce para baixo. Uma superfície só não serve: ancorada
// nas quatro bordas, o layer-shell ignora a zona exclusiva.
Scope {
  id: screenBar

  required property ShellScreen screen
  required property var bar

  readonly property string screenName: screen ? screen.name : ""
  readonly property bool isTarget: bar.targetScreen === screenName
  // Modo aberto neste monitor: os demais ficam em `compact`.
  // O cartão central é a ilha expandida (specs/05): também só no alvo.
  readonly property string mode: !isTarget ? "compact" : bar.cardOpen ? "card" : bar.mode
  readonly property bool holdsFocus: isTarget && bar.fixed

  PanelWindow {
    screen: screenBar.screen
    anchors {
      top: true
      left: true
      right: true
    }
    implicitHeight: Tokens.barReserved
    exclusiveZone: Tokens.barReserved
    color: "transparent"
    WlrLayershell.namespace: "island-strut"
    WlrLayershell.layer: WlrLayer.Bottom
    mask: Region {}
  }

  PanelWindow {
    id: overlay

    screen: screenBar.screen
    anchors {
      top: true
      bottom: true
      left: true
      right: true
    }
    exclusionMode: ExclusionMode.Ignore
    color: "transparent"
    WlrLayershell.namespace: "island"
    WlrLayershell.layer: WlrLayer.Top
    WlrLayershell.keyboardFocus: screenBar.holdsFocus ? WlrKeyboardFocus.Exclusive : WlrKeyboardFocus.None
    // Com modo fixo aberto, a camada inteira recebe o clique fora e o consome
    // (specs/02-barra.md "Clique fora"); senão, só pílulas e ilha.
    mask: screenBar.holdsFocus ? null : barRegion

    Region {
      id: barRegion

      Region {
        item: barRow.leftPill
      }
      Region {
        item: barRow.island
      }
      Region {
        item: barRow.rightPill
      }
      Region {
        item: barRow.banner.visible ? barRow.banner : null
      }
    }

    MouseArea {
      anchors.fill: parent
      enabled: screenBar.holdsFocus
      onPressed: screenBar.bar.closeAll()
    }

    BarRow {
      id: barRow

      anchors.top: parent.top
      anchors.left: parent.left
      anchors.right: parent.right
      anchors.topMargin: Tokens.barTopMargin
      anchors.leftMargin: Tokens.sideMargin
      anchors.rightMargin: Tokens.sideMargin
      bar: screenBar.bar
      mode: screenBar.mode
      screenName: screenBar.screenName
    }

    Shortcut {
      sequence: "Escape"
      enabled: screenBar.holdsFocus
      onActivated: screenBar.bar.pressEscape()
    }
  }
}
