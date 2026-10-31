pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/appearance.mjs" as AppearanceCore
import "../core/gradients.mjs" as GradientCore
import "../core/themes.mjs" as ThemeCore

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

  function applyPreset(id) {
    if (page.bar.service) page.bar.service.applyAppearancePreset(id);
  }

  spacing: 14

  ColumnLayout {
    Layout.fillWidth: true
    Layout.preferredWidth: 1
    Layout.alignment: Qt.AlignTop
    spacing: 14

    SettingsSection {
      Layout.fillWidth: true
      title: "Tema"

      // Tema (spec 01 "Temas"): vale para a barra inteira, não por ambiente.
      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        // Mesma largura do rótulo "Realce": as opções das duas linhas alinham.
        IslandText {
          Layout.rightMargin: 8
          Layout.preferredWidth: accentLabel.implicitWidth
          text: "Tema"
          px: 12.5
        }

        Repeater {
          model: ThemeCore.THEME_IDS

          ChoiceButton {
            required property string modelData

            Layout.fillWidth: true
            label: modelData
            active: Tokens.theme === modelData
            onClicked: page.bar.setTheme(modelData)
          }
        }
      }

      // Cor de realce (spec 01 "Realce"): global como o tema.
      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        IslandText {
          id: accentLabel

          Layout.rightMargin: 8
          text: "Realce"
          px: 12.5
        }

        Repeater {
          model: ThemeCore.ACCENT_IDS

          ChoiceButton {
            required property string modelData

            Layout.fillWidth: true
            label: modelData
            active: Tokens.accentName === modelData
            onClicked: page.bar.setAccent(modelData)
          }
        }
      }
    }

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
    SettingsSection {
      Layout.fillWidth: true
      title: "Sombra"

      SwitchRow {
        Layout.fillWidth: true
        label: "Sombra"
        hint: "Embaixo das pílulas e da ilha. Sem fundo, não há sombra."
        on: page.look.shadow
        onToggled: on => page.set("shadow", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.shadow
        label: "Força"
        hint: "Na ilha aberta, 1.2× esta força."
        value: page.look.shadowStrength
        onMoved: value => page.set("shadowStrength", value)
      }
    }
  }

  ColumnLayout {
    Layout.fillWidth: true
    Layout.preferredWidth: 1
    Layout.alignment: Qt.AlignTop
    spacing: 14

    // Zoom de toda a UI (spec 02 "Tamanho"); Automático escolhe por monitor.
    SettingsSection {
      Layout.fillWidth: true
      title: "Tamanho"

      SettingRow {
        Layout.fillWidth: true
        label: "Tamanho da barra"
        hint: "Aumenta ou reduz a barra, a ilha e os painéis. Automático escolhe pelo tamanho de cada monitor."
      }

      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        Repeater {
          model: [{ id: "auto", label: "Automático" }, { id: "small", label: "Pequena" }, { id: "medium", label: "Média" }, { id: "large", label: "Grande" }]

          ChoiceButton {
            required property var modelData

            Layout.fillWidth: true
            label: modelData.label
            active: Tokens.barSize === modelData.id
            onClicked: page.bar.setBarSize(modelData.id)
          }
        }
      }
    }

    SettingsSection {
      Layout.fillWidth: true
      title: "Estilo"

      // Preset igual à aparência atual; ajustar qualquer opção sai dele.
      ChoiceRow {
        Layout.fillWidth: true
        label: "Estilo"
        hint: "Padrão desfaz todos os ajustes. Vidro: Aurora com grão."
        options: AppearanceCore.APPEARANCE_PRESETS.map(preset => ({ id: preset.id, label: preset.name }))
        current: AppearanceCore.matchingPreset(page.look)
        onChosen: id => page.applyPreset(id)
      }
    }

    SettingsSection {
      Layout.fillWidth: true
      title: "Forma"

      SettingRow {
        Layout.fillWidth: true
        label: "Cantos"
        hint: "Padrão são os do design; Tema segue o arredondamento das janelas do Hyprland."
      }

      // Quatro opções não cabem ao lado do rótulo na meia coluna.
      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        Repeater {
          model: [{ id: "default", label: "Padrão" }, { id: "rounded", label: "Arredondado" }, { id: "square", label: "Quadrado" }, { id: "theme", label: "Tema" }]

          ChoiceButton {
            required property var modelData

            Layout.fillWidth: true
            label: modelData.label
            active: page.look.shape === modelData.id
            onClicked: page.set("shape", modelData.id)
          }
        }
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.shape === "rounded"
        label: "Raio"
        hint: "Nas pílulas, até 9px: mais que isso já é uma pílula."
        from: 2
        to: 24
        unit: "px"
        value: page.look.cornerRadius
        onMoved: value => page.set("cornerRadius", value)
      }
    }

    SettingsSection {
      Layout.fillWidth: true
      title: "Borda"

      SwitchRow {
        Layout.fillWidth: true
        label: "Borda"
        hint: "Contorno fino em volta das pílulas e da ilha."
        on: page.look.border
        onToggled: on => page.set("border", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.border
        label: "Largura"
        from: 1
        to: 6
        unit: "px"
        value: page.look.borderWidth
        onMoved: value => page.set("borderWidth", value)
      }

      SwitchRow {
        Layout.fillWidth: true
        visible: page.look.border
        label: "Opacidade automática"
        hint: "Discreta como no design, e mais forte quando o fundo quase some."
        on: page.look.borderOpacityAuto
        onToggled: on => page.set("borderOpacityAuto", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.border && !page.look.borderOpacityAuto
        label: "Opacidade da borda"
        value: page.look.borderOpacity
        onMoved: value => page.set("borderOpacity", value)
      }
    }

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
