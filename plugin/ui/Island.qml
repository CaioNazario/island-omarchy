import QtQuick
import "../core/island.mjs" as IslandCore

// Ilha central (specs/03-ilha.md). Só renderiza: o estado é o `IslandState`
// do core, dono do Bar.qml. Fundo, anel e corte do conteúdo (`overflow:
// hidden` no design) ficam na `surface`.
Item {
  id: island

  required property string mode
  property var sizeContext: ({})

  signal clicked

  readonly property var size: IslandCore.getSize(mode, sizeContext)

  width: size.width
  height: size.height

  Behavior on width {
    NumberAnimation {
      duration: Tokens.springMs
      easing.type: Easing.BezierSpline
      easing.bezierCurve: Tokens.springCurve
    }
  }
  Behavior on height {
    NumberAnimation {
      duration: Tokens.springMs
      easing.type: Easing.BezierSpline
      easing.bezierCurve: Tokens.springCurve
    }
  }

  Rectangle {
    id: surface

    anchors.fill: parent
    radius: island.size.radius
    color: Tokens.bg
    border.width: 1
    border.color: Tokens.neutral800
    clip: true

    // "Raio: 460ms ease" (specs/03-ilha.md "Animação").
    Behavior on radius {
      NumberAnimation {
        duration: Tokens.springMs
        easing.type: Easing.InOutQuad
      }
    }

    CompactContent {
      anchors.centerIn: parent
      visible: island.mode === "compact"
    }
  }

  // Linha de acento 36×2 no topo central, visível fora de `compact`.
  Rectangle {
    anchors.top: parent.top
    anchors.horizontalCenter: parent.horizontalCenter
    width: 36
    height: 2
    color: Tokens.accent
    opacity: island.mode === "compact" ? 0 : 1

    Behavior on opacity {
      NumberAnimation {
        duration: Tokens.chromeMs
      }
    }
  }

  MouseArea {
    anchors.fill: parent
    // "Cursor de mão só em `compact` e `notif`": nos outros modos os cliques
    // são do conteúdo.
    enabled: island.mode === "compact" || island.mode === "notif"
    cursorShape: Qt.PointingHandCursor
    onClicked: island.clicked()
  }
}
