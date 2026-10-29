pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/appearance.mjs" as AppearanceCore
import "../core/gradients.mjs" as GradientCore

// Aba Aparência do editor (specs/19-aparencia.md "Aba Aparência"): seções em
// duas colunas. Cada troca grava em `settings.json` `appearance` pelo
// serviço e vale na hora.
RowLayout {
  id: page

  required property var bar
  readonly property var look: Tokens.look
  readonly property bool solid: look.background && look.fill === "solid"
  readonly property bool gradient: look.background && look.fill === "gradient"
  // A paleta Tema primeiro, com as cores que ela tem agora.
  readonly property var palettes: [{
      id: "theme",
      name: "Tema",
      colors: GradientCore.gradientColors("theme", Tokens.omarchyColors, [Tokens.accent300, Tokens.accent500, Tokens.accent700].map(String))
    }].concat(GradientCore.GRADIENT_PRESETS)

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

      ChoiceRow {
        Layout.fillWidth: true
        visible: page.look.background
        label: "Preenchimento"
        hint: "Uma cor, ou cores que se misturam, como nos temas do Zen e do Arc."
        options: [{ id: "solid", label: "Sólido" }, { id: "gradient", label: "Gradiente" }]
        current: page.look.fill
        onChosen: id => page.set("fill", id)
      }

      SettingRow {
        Layout.fillWidth: true
        visible: page.solid
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
        visible: page.solid
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

      SettingRow {
        Layout.fillWidth: true
        visible: page.gradient
        label: "Paleta"
        hint: "A Tema vem do acento e das cores do tema do Omarchy."
      }

      Flow {
        Layout.fillWidth: true
        visible: page.gradient
        spacing: 8

        Repeater {
          model: page.palettes

          GradientTile {
            required property var modelData

            name: modelData.name
            colors: modelData.colors
            chosen: page.look.gradient === modelData.id
            onClicked: page.set("gradient", modelData.id)
          }
        }
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.gradient
        label: "Força"
        hint: "Quanto as cores cobrem o fundo. Cede o necessário para os textos continuarem legíveis."
        value: page.look.gradientStrength
        onMoved: value => page.set("gradientStrength", value)
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

    SettingsSection {
      Layout.fillWidth: true
      title: "Efeitos"

      SwitchRow {
        Layout.fillWidth: true
        visible: page.look.background
        label: "Blur"
        hint: Tokens.blurAvailable ? "Vidro fosco atrás da barra. A força é a do blur do Hyprland." : "O blur do Hyprland está desligado (decoration:blur:enabled): não tem efeito."
        on: page.look.blur
        onToggled: on => page.set("blur", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.background
        label: "Grão"
        hint: "Granulado de filme sobre o fundo, sólido, translúcido ou com blur."
        value: page.look.grain
        onMoved: value => page.set("grain", value)
      }
    }
  }
}
