pragma ComponentBehavior: Bound

import QtQuick

// Visual comum dos widgets (specs/16-widgets.md "Visual comum"): 24px, gap
// 6px, 12px/500. Cada parte aparece só se o widget usar: anel · ícone ·
// rótulo · barra · sub · ícone final.
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
  property string endGlyph: ""

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
    text: widget.label
    px: 12
    color: widget.labelColor
    elide: Text.ElideRight
    width: Math.min(implicitWidth, widget.labelMaxWidth)
  }

  Rectangle {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.bar >= 0
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
    text: widget.sub
    px: 12
    font.weight: Tokens.weightBody
    color: Tokens.neutral400
  }

  PhIcon {
    anchors.verticalCenter: parent.verticalCenter
    visible: widget.endGlyph !== ""
    glyph: widget.endGlyph || "info"
    size: 13
    color: Tokens.neutral300
  }
}
