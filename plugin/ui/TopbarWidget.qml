pragma ComponentBehavior: Bound

import QtQuick

// Visual comum dos widgets (specs/16-widgets.md "Visual comum"): 24px, gap
// 6px, 12px/500. Cada parte aparece só se o widget usar: anel · ícone ·
// rótulo · barra · sub · ondas · ícone final.
WidgetFrame {
  id: widget

  property real ring: -1
  property string glyph: ""
  property color glyphColor: Tokens.neutral300
  property string label: ""
  property color labelColor: Tokens.text
  property int labelMaxWidth: 140
  property real bar: -1
  property string sub: ""
  property bool waves: false
  property bool wavesPlaying: false
  property string endGlyph: ""
  // Colapsado (só o ring/ícone da frente): o resto fica invisível, no mesmo lugar,
  // para a largura natural não mudar e o corte do slot não mostrar sobras.
  property bool compact: false
  // Largura só com o ring/ícone da frente (padding 9+9): o que sobra quando o
  // widget colapsa (spec 16 "Quando não cabe"). 0 sem ring nem ícone: não colapsa.
  readonly property real compactWidth: ring >= 0 ? 18 + 13 : glyph !== "" ? 18 + 14 : 0

  ProgressRing {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.ring >= 0
    fraction: Math.max(0, widget.ring)
  }

  PhIcon {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.glyph !== ""
    glyph: widget.glyph || "info"
    size: 14
    color: widget.glyphColor
  }

  IslandText {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.label !== ""
    opacity: widget.compact ? 0 : 1
    text: widget.label
    px: 12
    color: widget.labelColor
    elide: Text.ElideRight
    width: Math.min(implicitWidth, widget.labelMaxWidth)
  }

  Rectangle {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.bar >= 0
    opacity: widget.compact ? 0 : 1
    width: 34
    height: 4
    radius: 2
    color: Tokens.neutral800

    Rectangle {
      width: parent.width * Math.max(0, widget.bar)
      height: parent.height
      radius: 2
      color: Tokens.accent
    }
  }

  IslandText {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.sub !== ""
    opacity: widget.compact ? 0 : 1
    text: widget.sub
    px: 12
    font.weight: Tokens.weightBody
    color: Tokens.neutral400
  }

  // `Waves` de 4 barras 2×13 com gap 2 (design/logic.js `widgetData` `music`).
  MusicWaves {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.waves
    opacity: widget.compact ? 0 : 1
    count: 4
    barHeight: 13
    barWidth: 2
    spacing: 2
    playing: widget.wavesPlaying
  }

  PhIcon {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.endGlyph !== ""
    opacity: widget.compact ? 0 : 1
    glyph: widget.endGlyph || "info"
    size: 13
    color: Tokens.neutral300
  }
}
