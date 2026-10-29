pragma Singleton

import QtQuick
import "../core/themes.mjs" as ThemeCore
import "../core/appearance.mjs" as AppearanceCore
import "../core/gradients.mjs" as GradientCore
import "../core/surfaceStyle.mjs" as SurfaceCore

// Tokens Nocturne (design/tokens.css, bloco `:root`) e as cores que o design
// calcula em oklch()/color-mix(), já convertidas. specs/01-design-tokens.md
// documenta a origem de cada valor; nenhuma cor da UI fica fora daqui. As
// cores base, os neutros, o acento e as superfícies vêm do tema escolhido
// (`themes.ts`); o Bar.qml liga `theme` e `accentName` às preferências do
// `settings.json`.
QtObject {
  property string theme: "Nocturne"
  // Cor de realce (spec 01 "Realce"): `accent` já é a cor, daí o nome.
  property string accentName: "Roxo"
  readonly property var palette: ThemeCore.themeColors(theme, accentName)
  // Opções de aparência (specs/19-aparencia.md), ligadas pelo Bar.qml ao
  // `settings.json`. O padrão é o visual do design.
  property var appearance: AppearanceCore.DEFAULT_APPEARANCE
  // A `Binding` do Bar.qml pode entregar `null` enquanto o serviço sobe.
  readonly property var look: appearance || AppearanceCore.DEFAULT_APPEARANCE
  // Cores nomeadas do `colors.toml` do tema do Omarchy (spec 19 "Gradiente");
  // vazio sem o arquivo.
  property var omarchyColors: ({})
  // `decoration:blur:enabled` do Hyprland (spec 14, S9).
  property bool blurAvailable: false
  // Sem paleta do Omarchy, os tons do realce: `accent-300/500/700`.
  readonly property var gradientColors: GradientCore.gradientColors(look.gradient, omarchyColors, [palette.accents[2], palette.accents[4], palette.accents[6]])
  // Estilo de cada superfície (spec 19 "Superfície"). A ilha aberta também
  // protege os rótulos `neutral-500` do gradiente.
  readonly property var pillStyle: surfaceStyleFor(palette.lane, false)
  readonly property var islandStyle: surfaceStyleFor(palette.island, false)
  readonly property var islandOpenStyle: surfaceStyleFor(palette.island, true)

  function surfaceStyleFor(base, open) {
    const inks = [{ color: palette.text, min: 4.5 }];
    if (open) inks.push({ color: palette.neutrals[4], min: 3 });
    return SurfaceCore.surfaceStyle({ look: look, base: base, gradientColors: gradientColors, inks: inks, blurAvailable: blurAvailable });
  }

  readonly property color bg: palette.bg
  readonly property color surface: palette.surface
  readonly property color text: palette.text
  // Fundos das pílulas, da ilha e do editor (`--isl-lane`, `--isl-surface`,
  // `--isl-panel` do design).
  readonly property color laneBg: palette.lane
  readonly property color islandBg: palette.island
  readonly property color panelBg: palette.panel
  // Botões redondos da linha de controles (`Tile`, `RoundButton`): cada tema
  // garante o contraste (themes.ts).
  readonly property color tileOn: palette.tileOn
  readonly property color tileOnIcon: palette.tileOnIcon
  readonly property color tileOff: palette.tileOff
  readonly property color tileOffIcon: palette.tileOffIcon

  readonly property color neutral100: palette.neutrals[0]
  readonly property color neutral200: palette.neutrals[1]
  readonly property color neutral300: palette.neutrals[2]
  readonly property color neutral400: palette.neutrals[3]
  readonly property color neutral500: palette.neutrals[4]
  readonly property color neutral600: palette.neutrals[5]
  readonly property color neutral700: palette.neutrals[6]
  readonly property color neutral800: palette.neutrals[7]
  readonly property color neutral900: palette.neutrals[8]

  // `acRamp(289, 1)` de design/logic.js no Roxo: a escala que o
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
  readonly property color batterySaver: "#e0b122"
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
