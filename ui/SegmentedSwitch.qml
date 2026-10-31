pragma ComponentBehavior: Bound

import QtQuick

// Trilho `neutral-900` raio 13 com opções de 22px; a escolhida em
// `accent-800` com texto `accent-100` (o "Adicionar em" do catálogo do
// editor, specs/17). `options`: `[{id, label}]`.
Rectangle {
  id: segmented

  property var options: []
  property string current: ""

  signal chosen(string id)

  implicitWidth: optionRow.implicitWidth + 4
  implicitHeight: 26
  radius: 13
  color: Tokens.neutral900

  Row {
    id: optionRow

    anchors.centerIn: parent

    Repeater {
      model: segmented.options

      Rectangle {
        id: option

        required property var modelData
        readonly property bool picked: segmented.current === modelData.id

        implicitWidth: optionLabel.implicitWidth + 20
        implicitHeight: 22
        radius: 11
        color: picked ? Tokens.accent800 : "transparent"

        IslandText {
          id: optionLabel

          anchors.centerIn: parent
          text: option.modelData.label
          px: 11.5
          color: option.picked ? Tokens.accent100 : Tokens.neutral400
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
