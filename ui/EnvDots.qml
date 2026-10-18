pragma ComponentBehavior: Bound

import QtQuick

// Pontos dos ambientes (specs/15-ambientes.md "Botão de ambiente"): 4px de
// altura, raio 2, gap 3px; o ativo tem 12px e é `accent`, os outros 4px e
// `neutral-700`, animando em 250ms. Clicar num ponto troca de ambiente.
Row {
  id: dots

  required property int count
  required property int active
  property bool interactive: true

  signal picked(int index)

  spacing: 3

  Repeater {
    model: dots.count

    delegate: Rectangle {
      id: dot

      required property int index
      readonly property bool current: index === dots.active

      anchors.verticalCenter: parent ? parent.verticalCenter : undefined
      width: current ? 12 : 4
      height: 4
      radius: 2
      color: current ? Tokens.accent : Tokens.neutral700

      Behavior on width {
        NumberAnimation {
          duration: 250
        }
      }
      Behavior on color {
        ColorAnimation {
          duration: 250
        }
      }

      MouseArea {
        anchors.centerIn: parent
        width: parent.width + 3
        height: 16
        enabled: dots.interactive
        cursorShape: Qt.PointingHandCursor
        onClicked: dots.picked(dot.index)
      }
    }
  }
}
