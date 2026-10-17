pragma Singleton

import QtQuick
import "../core/themes.mjs" as ThemeCore

// Tokens Nocturne (design/tokens.css, bloco `:root`) e as cores que o design
// calcula em oklch()/color-mix(), já convertidas. specs/01-design-tokens.md
// documenta a origem de cada valor; nenhuma cor da UI fica fora daqui. As
// cores base, os neutros, o acento e as superfícies vêm do tema escolhido
// (`themes.ts`); o Bar.qml liga `theme` à preferência do `settings.json`.
QtObject {
  property string theme: "Nocturne"
  readonly property var palette: ThemeCore.themeColors(theme)

  readonly property color bg: palette.bg
  readonly property color surface: palette.surface
  readonly property color text: palette.text
  // Fundos das pílulas, da ilha e do editor (`--isl-lane`, `--isl-surface`,
  // `--isl-panel` do design).
  readonly property color laneBg: palette.lane
  readonly property color islandBg: palette.island
  readonly property color panelBg: palette.panel
  readonly property bool lightTheme: palette.light

  readonly property color neutral100: palette.neutrals[0]
  readonly property color neutral200: palette.neutrals[1]
  readonly property color neutral300: palette.neutrals[2]
  readonly property color neutral400: palette.neutrals[3]
  readonly property color neutral500: palette.neutrals[4]
  readonly property color neutral600: palette.neutrals[5]
  readonly property color neutral700: palette.neutrals[6]
  readonly property color neutral800: palette.neutrals[7]
  readonly property color neutral900: palette.neutrals[8]

  // `acRamp(289, 1)` de design/logic.js (invertida no Claro): a escala que o
  // design calcula ao carregar, não os valores fixos do tokens.css.
  readonly property color accent100: palette.accents[0]
  readonly property color accent200: palette.accents[1]
  readonly property color accent300: palette.accents[2]
  readonly property color accent400: palette.accents[3]
  readonly property color accent500: palette.accents[4]
  readonly property color accent600: palette.accents[5]
  readonly property color accent700: palette.accents[6]
  readonly property color accent800: palette.accents[7]
  readonly property color accent900: palette.accents[8]
  readonly property color accent: palette.accent

  readonly property color alertRed: "#f75d59" // oklch(0.68 0.19 25): IA ≥90%, TEMP ≥70°
  readonly property color alertText: "#fd736d" // oklch(0.72 0.17 25)
  readonly property color batteryRed: "#c62f2f"
  readonly property color batteryGreen: "#2e9e4f"
  readonly property color batteryInk: "#000000"
  readonly property color powerOpenBg: "#932b2a" // oklch(0.45 0.14 25)
  readonly property color powerOffText: "#ff958d" // oklch(0.78 0.13 25)
  readonly property color recordOnBg: "#d73337" // oklch(0.58 0.2 25)
  readonly property color passwordErrorBorder: "#bd413f" // oklch(0.55 0.16 25)

  readonly property color volumeThumbGlow: Qt.alpha(accent, 0.60)
  readonly property color btnPrimaryHover: Qt.alpha(accent, 0.12)
  readonly property color btnPrimaryActive: Qt.alpha(accent, 0.22)
  readonly property color btnGhostHover: Qt.alpha(accent, 0.10)
  readonly property color btnGhostActive: Qt.alpha(accent, 0.18)
  readonly property color editorTargetGlow: Qt.alpha(accent, 0.22)
  readonly property color editorBg: panelBg
  readonly property color editorDim: Qt.alpha(bg, 0.50)
  readonly property color divider: Qt.alpha(text, 0.16)
  readonly property color dividerFadeEnd: Qt.alpha(neutral800, 0)

  readonly property string fontFamily: "Inter"
  readonly property int weightLabel: Font.Medium
  readonly property int weightBody: Font.Normal

  readonly property int barHeight: 26
  readonly property int barTopMargin: 2
  // 2px de margem + 26px de barra (specs/02-barra.md "Espaço reservado").
  readonly property int barReserved: barTopMargin + barHeight
  readonly property int sideMargin: 12
  readonly property int pillGap: 6
  readonly property int pillRadius: 13
  readonly property int pillPaddingH: 6

  // Mola da ilha `cubic-bezier(.3,1.2,.4,1)` .46s. O par final (1,1) fecha a
  // curva no formato de `Easing.BezierSpline`.
  readonly property int springMs: 460
  readonly property var springCurve: [0.3, 1.2, 0.4, 1, 1, 1]
  // Cartões `cubic-bezier(.3,1.15,.4,1)` .4s.
  readonly property int cardMs: 400
  readonly property var cardCurve: [0.3, 1.15, 0.4, 1, 1, 1]
  readonly property int chromeMs: 300
  readonly property int fadeMs: 220
  readonly property int fadeDelayMs: 80
  readonly property int scaleMs: 300
  readonly property real hiddenScale: 0.94
}
