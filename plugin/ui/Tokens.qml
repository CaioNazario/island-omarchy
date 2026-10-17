pragma Singleton

import QtQuick

// Tokens Nocturne (design/tokens.css, bloco `:root`) e as cores que o design
// calcula em oklch()/color-mix(), já convertidas. specs/01-design-tokens.md
// documenta a origem de cada valor; nenhuma cor da UI fica fora daqui.
QtObject {
  readonly property color bg: "#161826"
  readonly property color surface: "#232532"
  readonly property color text: "#e9e9ed"

  readonly property color neutral100: "#f3f5fe"
  readonly property color neutral200: "#e4e7f5"
  readonly property color neutral300: "#cfd3e5"
  readonly property color neutral400: "#b2b6ca"
  readonly property color neutral500: "#9397ab"
  readonly property color neutral600: "#75798c"
  readonly property color neutral700: "#595d6c"
  readonly property color neutral800: "#3f424d"
  readonly property color neutral900: "#292b31"

  // `acRamp(289, 1)` de design/logic.js: a escala que o design calcula ao
  // carregar, não os valores fixos do tokens.css.
  readonly property color accent100: "#f4f3ff"
  readonly property color accent200: "#e6e4ff"
  readonly property color accent300: "#d2cdff"
  readonly property color accent400: "#b5acfa"
  readonly property color accent500: "#9387dd"
  readonly property color accent600: "#766ab9"
  readonly property color accent700: "#5a508f"
  readonly property color accent800: "#3f3865"
  readonly property color accent900: "#28253e"
  readonly property color accent: accent500

  readonly property color alertRed: "#f75d59" // oklch(0.68 0.19 25): IA ≥90%, TEMP ≥70°
  readonly property color alertText: "#fd736d" // oklch(0.72 0.17 25)
  readonly property color batteryRed: "#c62f2f"
  readonly property color batteryGreen: "#2e9e4f"
  readonly property color batteryInk: "#000000"
  readonly property color powerOpenBg: "#932b2a" // oklch(0.45 0.14 25)
  readonly property color powerOffText: "#ff958d" // oklch(0.78 0.13 25)
  readonly property color passwordErrorBorder: "#bd413f" // oklch(0.55 0.16 25)

  readonly property color volumeThumbGlow: Qt.alpha(accent, 0.60)
  readonly property color btnPrimaryHover: Qt.alpha(accent, 0.12)
  readonly property color btnPrimaryActive: Qt.alpha(accent, 0.22)
  readonly property color btnGhostHover: Qt.alpha(accent, 0.10)
  readonly property color btnGhostActive: Qt.alpha(accent, 0.18)
  readonly property color editorTargetGlow: Qt.alpha(accent, 0.22)
  readonly property color editorBg: Qt.alpha(bg, 0.94)
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
