pragma ComponentBehavior: Bound

import QtQuick

// Zona de Urgência da tela de pausa (specs/20 "Urgência"): uma área invisível
// de 320×74 no topo, centralizada. O mouse sobre ela revela "Pular pausa" e
// "Urgência"; `forceShown` os revela também pelo teclado (segurar Esc). Com
// os botões ocultos, nada recebe clique.
Item {
  id: zone

  // Revelada pelo teclado (segurar Esc), além do mouse.
  property bool forceShown: false
  readonly property bool shown: hover.hovered || forceShown

  signal skipRequested
  signal emergencyRequested

  width: 320
  height: 74

  HoverHandler {
    id: hover
  }

  Row {
    anchors.top: parent.top
    anchors.topMargin: 8
    anchors.horizontalCenter: parent.horizontalCenter
    spacing: 8

    component ZoneButton: Rectangle {
      id: zoneButton

      required property string text

      signal clicked

      implicitWidth: label.implicitWidth + 32
      implicitHeight: label.implicitHeight + 16
      radius: height / 2
      color: Qt.alpha("#18181b", 0.94)
      border.width: 1
      border.color: Qt.alpha("#ffffff", zonePointer.containsMouse || activeFocus ? 0.32 : 0.16)
      opacity: zone.shown ? 1 : 0
      visible: opacity > 0
      enabled: zone.shown
      activeFocusOnTab: true
      transform: Translate {
        y: zone.shown ? 0 : -10

        Behavior on y {
          NumberAnimation {
            duration: 200
            easing.type: Easing.OutCubic
          }
        }
      }
      Accessible.role: Accessible.Button
      Accessible.name: text

      Behavior on opacity {
        NumberAnimation {
          duration: 180
        }
      }

      IslandText {
        id: label

        anchors.centerIn: parent
        text: zoneButton.text
        color: "#e7e6e1"
      }

      MouseArea {
        id: zonePointer

        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: zoneButton.clicked()
      }

      Keys.onReturnPressed: clicked()
      Keys.onEnterPressed: clicked()
      Keys.onSpacePressed: clicked()
    }

    ZoneButton {
      text: I18n.tr("Skip break")
      onClicked: zone.skipRequested()
    }

    ZoneButton {
      text: I18n.tr("Emergency")
      onClicked: zone.emergencyRequested()
    }
  }
}
