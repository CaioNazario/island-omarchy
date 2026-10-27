pragma ComponentBehavior: Bound

import QtQuick

// Bateria (specs/11-bateria.md): corpo 26×12 com borda 1px preta e raio 3,
// fundo `neutral-600` na parte vazia; preenchimento sólido na cor do nível;
// número 8px/600 preto centralizado; polo 2×4; raio de carga 11px.
BarButton {
  id: button

  required property var battery
  readonly property var display: battery.display
  readonly property color tone: battery.saver ? Tokens.batterySaver : display.tone === "good" ? Tokens.batteryGreen
    : display.tone === "low" ? Tokens.batteryRed : Tokens.neutral300

  visible: battery.available
  horizontalPadding: 10

  Row {
    anchors.verticalCenter: parent.verticalCenter
    spacing: 4

    Row {
      anchors.verticalCenter: parent.verticalCenter
      spacing: 1

      Rectangle {
        id: body

        width: 26
        height: 12
        radius: 3
        color: Tokens.neutral600
        border.width: 1
        border.color: Tokens.batteryInk

        Rectangle {
          x: 1
          y: 1
          height: parent.height - 2
          width: Math.round(24 * button.display.fill)
          color: button.tone
          // Raio interno = raio do corpo − borda; a ponta direita só cheia.
          topLeftRadius: 2
          bottomLeftRadius: 2
          topRightRadius: width >= 24 ? 2 : 0
          bottomRightRadius: width >= 24 ? 2 : 0

          Behavior on width {
            NumberAnimation {
              duration: 300
            }
          }
        }

        IslandText {
          anchors.centerIn: parent
          text: button.display.number
          px: 8
          font.weight: Font.DemiBold
          font.letterSpacing: -0.16
          color: Tokens.batteryInk
        }
      }

      // Na cor da parte vazia: preto sumiria no fundo da pílula.
      Rectangle {
        anchors.verticalCenter: parent.verticalCenter
        width: 2
        height: 4
        topRightRadius: 1
        bottomRightRadius: 1
        color: Tokens.neutral600
      }
    }

    PhIcon {
      anchors.verticalCenter: parent.verticalCenter
      visible: button.display.bolt
      glyph: "lightning-fill"
      size: 11
      color: button.tone
    }
  }
}
