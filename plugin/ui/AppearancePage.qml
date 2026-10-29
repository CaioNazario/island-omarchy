pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/appearance.mjs" as AppearanceCore

// Aba Aparência do editor (specs/19-aparencia.md "Aba Aparência"): seções em
// duas colunas. Cada troca grava em `settings.json` `appearance` pelo
// serviço e vale na hora.
RowLayout {
  id: page

  required property var bar
  readonly property var look: Tokens.look

  function set(key, value) {
    if (page.bar.service) page.bar.service.setAppearanceOption(key, value);
  }

  spacing: 14

  ColumnLayout {
    Layout.fillWidth: true
    Layout.preferredWidth: 1
    Layout.alignment: Qt.AlignTop
    spacing: 14

    SettingsSection {
      Layout.fillWidth: true
      title: "Fundo"

      SwitchRow {
        Layout.fillWidth: true
        label: "Fundo"
        hint: "Desligado, sobram só os ícones e o texto."
        on: page.look.background
        onToggled: on => page.set("background", on)
      }

      SettingRow {
        Layout.fillWidth: true
        visible: page.look.background
        label: "Cor"
        hint: "A do tema, nenhuma ou uma cor fixa."

        ChoiceButton {
          Layout.preferredWidth: 72
          label: "Tema"
          active: page.look.color === "theme"
          onClicked: page.set("color", "theme")
        }

        ChoiceButton {
          Layout.preferredWidth: 72
          label: "Nenhuma"
          active: page.look.color === "none"
          onClicked: page.set("color", "none")
        }
      }

      Flow {
        Layout.fillWidth: true
        visible: page.look.background
        spacing: 6

        Repeater {
          model: AppearanceCore.SOLID_SWATCHES

          ColorSwatch {
            required property string modelData

            color: modelData
            chosen: page.look.color === modelData
            onClicked: page.set("color", modelData)
          }
        }
      }

      SwitchRow {
        Layout.fillWidth: true
        visible: page.look.background && page.look.color !== "none"
        label: "Opacidade do tema"
        hint: "Opaca, ou 82% com o blur ligado, como no design."
        on: page.look.opacityFromTheme
        onToggled: on => page.set("opacityFromTheme", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.background && page.look.color !== "none" && !page.look.opacityFromTheme
        label: "Opacidade"
        value: page.look.opacity
        onMoved: value => page.set("opacity", value)
      }
    }
  }

  ColumnLayout {
    Layout.fillWidth: true
    Layout.preferredWidth: 1
    Layout.alignment: Qt.AlignTop
    spacing: 14
  }
}
