pragma ComponentBehavior: Bound

import QtQuick

// Banner (specs/04-notificacoes.md "Banner"): 380×58, raio 22, `bg` com anel
// `neutral-800`, 8px abaixo da ilha (acompanha a mola dela). Entra de
// `translateY(-16px)`; fica 2600ms (o timer é do Bar.qml). Clique abre
// `stack`; × dispensa só o banner.
Item {
  id: banner

  required property var bar
  required property var entry
  readonly property bool shown: entry !== null

  signal opened

  width: 380
  height: 58
  opacity: shown ? 1 : 0
  visible: opacity > 0
  transform: Translate {
    y: banner.shown ? 0 : -16

    Behavior on y {
      NumberAnimation {
        duration: Tokens.cardMs
        easing.type: Easing.BezierSpline
        easing.bezierCurve: Tokens.cardCurve
      }
    }
  }

  Behavior on opacity {
    NumberAnimation {
      duration: Tokens.fadeMs
    }
  }

  // Guarda a última notificação para o conteúdo não sumir durante o fade.
  property var shownEntry: null
  onEntryChanged: if (entry) shownEntry = entry

  Rectangle {
    anchors.fill: parent
    radius: 22
    color: Tokens.islandBg
    border.width: 1
    border.color: Tokens.neutral800

    MouseArea {
      anchors.fill: parent
      cursorShape: Qt.PointingHandCursor
      onClicked: banner.opened()
    }

    Loader {
      anchors.fill: parent
      active: banner.shownEntry !== null
      sourceComponent: NotificationCard {
        entry: banner.shownEntry
        nowMs: banner.bar.nowMs
        blockSize: 34
        blockRadius: 10
        iconSize: 19
        closeSize: 24
        leftPadding: 12
        rightPadding: 12
        gap: 12
        onClosed: banner.bar.hideBanner()
      }
    }
  }
}
