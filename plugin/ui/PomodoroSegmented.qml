pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Segmentado Global/Individual (specs/20 "Modo de duração"): trilho rebaixado
// de ponta a ponta, duas opções de largura igual, a ativa mais clara.
// `options`: `[{id, label}]`.
Rectangle {
  id: segmented

  property var options: []
  property string current: ""

  signal chosen(string id)

  implicitHeight: 36
  radius: height / 2
  color: Qt.alpha("#000000", 0.28)
  border.width: 1
  border.color: Qt.alpha(Tokens.text, 0.04)

  RowLayout {
    anchors.fill: parent
    anchors.margins: 4
    spacing: 4

    Repeater {
      model: segmented.options

      Rectangle {
        id: option

        required property var modelData
        readonly property bool picked: segmented.current === modelData.id

        Layout.fillWidth: true
        Layout.fillHeight: true
        radius: height / 2
        color: picked ? Qt.alpha(Tokens.text, 0.12) : "transparent"
        Accessible.role: Accessible.RadioButton
        Accessible.name: modelData.label
        Accessible.checked: picked

        Behavior on color {
          ColorAnimation {
            duration: 160
          }
        }

        IslandText {
          anchors.centerIn: parent
          text: option.modelData.label
          px: 12.5
          color: option.picked ? Tokens.neutral100 : Tokens.neutral500
        }

        MouseArea {
          anchors.fill: parent
          cursorShape: Qt.PointingHandCursor
          onClicked: segmented.chosen(option.modelData.id)
        }
      }
    }
  }
}
