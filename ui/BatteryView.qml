pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/batteryPanel.mjs" as PanelCore

// Modo `battery` (specs/11-bateria.md "Modo `battery`"; design v5): padding
// 14px 16px, cabeçalho com o nível · barra · estatísticas · perfil de energia.
Item {
  id: view

  required property var bar
  readonly property var battery: bar.system.battery
  readonly property color tone: battery.saver ? Tokens.batterySaver : battery.display.tone === "good" ? Tokens.batteryGreen
    : battery.display.tone === "low" ? Tokens.batteryRed : Tokens.neutral300

  ColumnLayout {
    anchors.fill: parent
    anchors.leftMargin: 16
    anchors.rightMargin: 16
    anchors.topMargin: 14
    anchors.bottomMargin: 14
    spacing: 0

    PanelHeader {
      Layout.fillWidth: true
      glyph: PanelCore.batteryGlyph(view.battery.percent, view.battery.charging)
      glyphColor: view.tone
      title: "Bateria"
      subtitle: view.battery.panel.status

      IslandText {
        text: view.battery.percent + "%"
        px: 32
        font.letterSpacing: -0.64
      }
    }

    // Barra 6px raio 3: vermelha até 20%, verde acima.
    Rectangle {
      Layout.fillWidth: true
      Layout.topMargin: 10
      implicitHeight: 6
      radius: 3
      color: Tokens.neutral800

      Rectangle {
        width: parent.width * view.battery.percent / 100
        height: parent.height
        radius: 3
        color: view.battery.percent <= 20 ? Tokens.batteryRed : Tokens.batteryGreen

        Behavior on width {
          NumberAnimation {
            duration: 600
          }
        }
      }
    }

    GridLayout {
      Layout.fillWidth: true
      Layout.topMargin: 14
      columns: 2
      columnSpacing: 28
      rowSpacing: 0

      Repeater {
        model: view.battery.panel.stats

        RowLayout {
          id: stat

          required property var modelData

          Layout.fillWidth: true
          Layout.preferredWidth: 1
          implicitHeight: 20
          spacing: 8

          IslandText {
            Layout.fillWidth: true
            text: stat.modelData.label
            px: 12
            font.weight: Tokens.weightBody
            color: Tokens.neutral500
          }

          IslandText {
            text: stat.modelData.value
            px: 12
            font.weight: Tokens.weightBody
            color: Tokens.neutral200
          }
        }
      }
    }

    ColumnLayout {
      Layout.fillWidth: true
      visible: view.battery.profiles.length > 0
      spacing: 0

      FadeDivider {
        Layout.fillWidth: true
        Layout.topMargin: 12
        Layout.bottomMargin: 10
      }

      PanelLabel {
        Layout.fillWidth: true
        Layout.bottomMargin: 6
        text: "Perfil de energia"
      }

      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        Repeater {
          model: view.battery.profiles

          ChoiceButton {
            required property var modelData

            Layout.fillWidth: true
            implicitHeight: 36
            radius: 10
            label: modelData.label
            glyph: modelData.glyph
            active: modelData.active
            onClicked: view.battery.setProfile(modelData.id)
          }
        }
      }
    }

    Item {
      Layout.fillHeight: true
    }
  }
}
