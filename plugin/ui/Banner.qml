pragma ComponentBehavior: Bound

import QtQuick

// Banner (specs/04-notificacoes.md "Banner"): 380×58, raio 22, `bg` com anel
// `neutral-800`, 8px abaixo da ilha (acompanha a mola dela). Entra de
// `translateY(-16px)`; fica 2600ms (o timer é do Bar.qml). Clique abre
// `stack`; × dispensa só o banner. Fundo, gradiente, grão, cantos e borda
// seguem a aparência da ilha (specs/19-aparencia.md "Banner"); no padrão,
// o design.
Item {
  id: banner

  required property var bar
  required property var entry
  readonly property bool shown: entry !== null

  readonly property var style: Tokens.islandStyle
  readonly property real surfaceRadius: Tokens.radiusFor(22, height)

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
    radius: banner.surfaceRadius
    color: banner.style.fill

    Loader {
      anchors.fill: parent
      active: banner.style.gradient !== null

      sourceComponent: SurfaceGradient {
        gradient: banner.style.gradient
        cornerRadius: banner.surfaceRadius
      }
    }

    Loader {
      anchors.fill: parent
      active: banner.style.grain > 0

      sourceComponent: SurfaceGrain {
        strength: banner.style.grain
        cornerRadius: banner.surfaceRadius
      }
    }

    // O anel do banner no design é `neutral-800`; com a opacidade da borda
    // manual, vale a cor das outras superfícies.
    Rectangle {
      anchors.fill: parent
      visible: banner.style.borderWidth > 0
      radius: banner.surfaceRadius
      color: "transparent"
      border.width: banner.style.borderWidth
      border.color: Tokens.look.borderOpacityAuto ? Tokens.neutral800 : banner.style.borderColor
    }

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
