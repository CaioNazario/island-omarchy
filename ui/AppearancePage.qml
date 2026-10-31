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
      name: "Theme",
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
      title: I18n.tr("Theme")

      // Tema (spec 01 "Temas"): vale para a barra inteira, não por ambiente.
      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        // Mesma largura do rótulo "Realce": as opções das duas linhas alinham.
        IslandText {
          Layout.rightMargin: 8
          Layout.preferredWidth: accentLabel.implicitWidth
          text: I18n.tr("Theme")
          px: 12.5
        }

        Repeater {
          model: ThemeCore.THEME_IDS

          ChoiceButton {
            required property string modelData

            Layout.fillWidth: true
            label: I18n.tr(ThemeCore.THEME_NAMES[modelData])
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
          text: I18n.tr("Accent")
          px: 12.5
        }

        Repeater {
          model: ThemeCore.ACCENT_IDS

          ChoiceButton {
            required property string modelData

            Layout.fillWidth: true
            label: I18n.tr(ThemeCore.ACCENT_NAMES[modelData])
            active: Tokens.accentName === modelData
            onClicked: page.bar.setAccent(modelData)
          }
        }
      }
    }

    SettingsSection {
      Layout.fillWidth: true
      title: I18n.tr("Background")

      SwitchRow {
        Layout.fillWidth: true
        label: I18n.tr("Background")
        hint: I18n.tr("Off leaves only the icons and the text.")
        on: page.look.background
        onToggled: on => page.set("background", on)
      }

      ChoiceRow {
        Layout.fillWidth: true
        visible: page.look.background
        label: I18n.tr("Fill")
        hint: I18n.tr("One color, or colors that blend, like the Zen and Arc themes.")
        options: [{ id: "solid", label: I18n.tr("Solid") }, { id: "gradient", label: I18n.tr("Gradient") }]
        current: page.look.fill
        onChosen: id => page.set("fill", id)
      }

      SettingRow {
        Layout.fillWidth: true
        visible: page.solid
        label: I18n.tr("Color")
        hint: I18n.tr("The theme's, none or a fixed color.")

        ChoiceButton {
          Layout.preferredWidth: 72
          label: I18n.tr("Theme")
          active: page.look.color === "theme"
          onClicked: page.set("color", "theme")
        }

        ChoiceButton {
          Layout.preferredWidth: 72
          label: I18n.tr("None")
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
        label: I18n.tr("Palette")
        hint: I18n.tr("Theme comes from the accent and the Omarchy theme colors.")
      }

      Flow {
        Layout.fillWidth: true
        visible: page.gradient
        spacing: 8

        Repeater {
          model: page.palettes

          GradientTile {
            required property var modelData

            name: I18n.tr(modelData.name)
            colors: modelData.colors
            chosen: page.look.gradient === modelData.id
            onClicked: page.set("gradient", modelData.id)
          }
        }
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.gradient
        label: I18n.tr("Strength")
        hint: I18n.tr("How much the colors cover the background. Backs off as needed to keep text readable.")
        value: page.look.gradientStrength
        onMoved: value => page.set("gradientStrength", value)
      }

      SwitchRow {
        Layout.fillWidth: true
        visible: page.look.background && page.look.color !== "none"
        label: I18n.tr("Theme opacity")
        hint: I18n.tr("Opaque, or 82% with blur on, as in the design.")
        on: page.look.opacityFromTheme
        onToggled: on => page.set("opacityFromTheme", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.background && page.look.color !== "none" && !page.look.opacityFromTheme
        label: I18n.tr("Opacity")
        value: page.look.opacity
        onMoved: value => page.set("opacity", value)
      }
    }
    SettingsSection {
      Layout.fillWidth: true
      title: I18n.tr("Shadow")

      SwitchRow {
        Layout.fillWidth: true
        label: I18n.tr("Shadow")
        hint: I18n.tr("Under the pills and the island. No background, no shadow.")
        on: page.look.shadow
        onToggled: on => page.set("shadow", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.shadow
        label: I18n.tr("Strength")
        hint: I18n.tr("On the open island, 1.2× this strength.")
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
      title: I18n.tr("Size")

      SettingRow {
        Layout.fillWidth: true
        label: I18n.tr("Bar size")
        hint: I18n.tr("Scales the bar, the island and the panels. Automatic picks by the size of each monitor.")
      }

      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        Repeater {
          model: [{ id: "auto", label: I18n.tr("Automatic") }, { id: "small", label: I18n.tr("Small") }, { id: "medium", label: I18n.tr("Medium") }, { id: "large", label: I18n.tr("Large") }]

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
      title: I18n.tr("Style")

      // Preset igual à aparência atual; ajustar qualquer opção sai dele.
      ChoiceRow {
        Layout.fillWidth: true
        label: I18n.tr("Style")
        hint: I18n.tr("Default undoes every tweak. Glass: Aurora with grain.")
        options: AppearanceCore.APPEARANCE_PRESETS.map(preset => ({ id: preset.id, label: I18n.tr(preset.name) }))
        current: AppearanceCore.matchingPreset(page.look)
        onChosen: id => page.applyPreset(id)
      }
    }

    SettingsSection {
      Layout.fillWidth: true
      title: I18n.tr("Shape")

      SettingRow {
        Layout.fillWidth: true
        label: I18n.tr("Corners")
        hint: I18n.tr("Default uses the design's; Theme follows the Hyprland window rounding.")
      }

      // Quatro opções não cabem ao lado do rótulo na meia coluna.
      RowLayout {
        Layout.fillWidth: true
        spacing: 6

        Repeater {
          model: [{ id: "default", label: I18n.tr("Default") }, { id: "rounded", label: I18n.tr("Rounded") }, { id: "square", label: I18n.tr("Square") }, { id: "theme", label: I18n.tr("Theme") }]

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
        label: I18n.tr("Radius")
        hint: I18n.tr("On the pills, up to 9px: more than that is already a pill.")
        from: 2
        to: 24
        unit: "px"
        value: page.look.cornerRadius
        onMoved: value => page.set("cornerRadius", value)
      }
    }

    SettingsSection {
      Layout.fillWidth: true
      title: I18n.tr("Border")

      SwitchRow {
        Layout.fillWidth: true
        label: I18n.tr("Border")
        hint: I18n.tr("Thin outline around the pills and the island.")
        on: page.look.border
        onToggled: on => page.set("border", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.border
        label: I18n.tr("Width")
        from: 1
        to: 6
        unit: "px"
        value: page.look.borderWidth
        onMoved: value => page.set("borderWidth", value)
      }

      SwitchRow {
        Layout.fillWidth: true
        visible: page.look.border
        label: I18n.tr("Automatic opacity")
        hint: I18n.tr("Subtle as in the design, and stronger when the background nearly fades.")
        on: page.look.borderOpacityAuto
        onToggled: on => page.set("borderOpacityAuto", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.border && !page.look.borderOpacityAuto
        label: I18n.tr("Border opacity")
        value: page.look.borderOpacity
        onMoved: value => page.set("borderOpacity", value)
      }
    }

    SettingsSection {
      Layout.fillWidth: true
      title: I18n.tr("Effects")

      SwitchRow {
        Layout.fillWidth: true
        visible: page.look.background
        label: I18n.tr("Blur")
        hint: Tokens.blurAvailable ? I18n.tr("Frosted glass behind the bar. The strength is Hyprland's blur.") : I18n.tr("Hyprland blur is off (decoration:blur:enabled): no effect.")
        on: page.look.blur
        onToggled: on => page.set("blur", on)
      }

      SliderRow {
        Layout.fillWidth: true
        visible: page.look.background
        label: I18n.tr("Grain")
        hint: I18n.tr("Film grain over the background, solid, translucent or blurred.")
        value: page.look.grain
        onMoved: value => page.set("grain", value)
      }
    }
  }
}
