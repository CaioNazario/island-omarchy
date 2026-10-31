pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/display.mjs" as DisplayCore

// Modo `display` (specs/08 "Modo `display`"; design v5): padding 14px 16px,
// cabeçalho do monitor · brilho · tamanho do texto · escala, com divisores.
Item {
  id: view

  required property var bar
  readonly property var display: bar.system.display
  readonly property var brightness: bar.system.brightness

  ColumnLayout {
    anchors.fill: parent
    anchors.leftMargin: 16
    anchors.rightMargin: 16
    anchors.topMargin: 14
    anchors.bottomMargin: 14
    spacing: 0

    PanelHeader {
      Layout.fillWidth: true
      glyph: "monitor"
      title: I18n.tr("Display")
      subtitle: view.display.subtitle
    }

    Section {
      visible: view.brightness.available

      PanelLabel {
        Layout.fillWidth: true
        Layout.bottomMargin: 6
        text: I18n.tr("Brightness")
        value: view.brightness.percent + "%"
        valueColor: Tokens.neutral300
      }

      IslandSlider {
        Layout.fillWidth: true
        Layout.preferredHeight: 20
        value: view.brightness.percent
        onMoved: value => view.brightness.setPercent(value)
      }
    }

    Section {
      PanelLabel {
        Layout.fillWidth: true
        Layout.bottomMargin: 6
        text: I18n.tr("Text size")
        value: view.display.textSize + "px"
        valueColor: Tokens.neutral300
      }

      // Segmentos de 10 a 16px: preenchidos até o atual, puxador no atual.
      RowLayout {
        Layout.fillWidth: true
        Layout.preferredHeight: 20
        spacing: 3

        Repeater {
          model: DisplayCore.textSegments(view.display.textSize)

          Item {
            id: segment

            required property var modelData

            Layout.fillWidth: true
            Layout.preferredHeight: 20

            Rectangle {
              anchors.verticalCenter: parent.verticalCenter
              width: parent.width
              height: 4
              radius: 2
              color: segment.modelData.filled ? Tokens.accent : Tokens.neutral800

              Behavior on color {
                ColorAnimation {
                  duration: 150
                }
              }
            }

            Rectangle {
              visible: segment.modelData.knob
              anchors.verticalCenter: parent.verticalCenter
              x: parent.width - 6
              z: 1
              width: 12
              height: 12
              radius: 6
              color: Tokens.neutral100
            }

            MouseArea {
              anchors.fill: parent
              cursorShape: Qt.PointingHandCursor
              onClicked: view.display.setTextSize(segment.modelData.size)
            }
          }
        }
      }
    }

    Section {
      PanelLabel {
        Layout.fillWidth: true
        Layout.bottomMargin: 6
        text: I18n.tr("Scale")
      }

      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        Repeater {
          model: DisplayCore.DISPLAY_SCALES

          ChoiceButton {
            required property real modelData

            Layout.fillWidth: true
            label: modelData + "x"
            active: DisplayCore.activeScale(view.display.scale) === modelData
            onClicked: view.display.setScale(modelData)
          }
        }
      }
    }

    Item {
      Layout.fillHeight: true
    }
  }

  // Divisor (margin 10px 0) seguido do conteúdo da seção.
  component Section: ColumnLayout {
    Layout.fillWidth: true
    spacing: 0

    FadeDivider {
      Layout.fillWidth: true
      Layout.topMargin: 10
      Layout.bottomMargin: 10
    }
  }
}
