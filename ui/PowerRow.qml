pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Linha de energia (specs/09-sessao-energia.md): 48px (40 de linha + 8 de
// respiro), padding 0 7px, cinco botões de mesma largura. O contêiner corta
// a linha enquanto a altura anima na mola: em `quick` a ilha cresce junto; em
// `wifi`/`bt` a lista ancorada embaixo desliza os 48px.
Item {
  id: power

  required property var bar
  readonly property var session: bar.system.session
  readonly property var actions: [
    { action: "suspend", label: I18n.tr("Suspend"), glyph: "moon-stars" },
    { action: "reboot", label: I18n.tr("Restart"), glyph: "arrow-clockwise" },
    { action: "shutdown", label: I18n.tr("Shut down"), glyph: "power-bold" },
    { action: "logout", label: I18n.tr("Log out"), glyph: "sign-out" },
    { action: "lock", label: I18n.tr("Lock"), glyph: "lock-simple" }
  ]

  implicitHeight: bar.powerOpen ? 48 : 0
  clip: true

  Behavior on implicitHeight {
    NumberAnimation {
      duration: Tokens.springMs
      easing.type: Easing.BezierSpline
      easing.bezierCurve: Tokens.springCurve
    }
  }

  RowLayout {
    anchors.left: parent.left
    anchors.right: parent.right
    anchors.top: parent.top
    anchors.leftMargin: 7
    anchors.rightMargin: 7
    height: 40
    spacing: 6

    Repeater {
      model: power.actions

      delegate: Rectangle {
        id: button

        required property var modelData

        Layout.fillWidth: true
        Layout.preferredWidth: 1
        Layout.fillHeight: true
        // Ação indisponível (suspender desligado pelo Omarchy) → o botão some.
        visible: modelData.action !== "suspend" || power.session.canSuspend
        radius: 12
        color: pointer.containsMouse ? Tokens.neutral800 : Tokens.neutral900

        Row {
          anchors.centerIn: parent
          spacing: 6

          PhIcon {
            anchors.verticalCenter: parent.verticalCenter
            glyph: button.modelData.glyph
            size: 14
            color: label.color
          }

          IslandText {
            id: label

            anchors.verticalCenter: parent.verticalCenter
            text: button.modelData.label
            px: 12
            font.weight: Tokens.weightBody
            color: button.modelData.action === "shutdown" ? Tokens.powerOffText : Tokens.text
          }
        }

        MouseArea {
          id: pointer

          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          // Qualquer ação fecha a ilha antes de executar.
          onClicked: {
            power.bar.closeAll();
            power.session.run(button.modelData.action);
          }
        }
      }
    }
  }
}
