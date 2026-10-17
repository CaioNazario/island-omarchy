pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Linha de app e de microfone do `mixer` (specs/08 "Modo `mixer`"): 42px,
// padding 0 6px 0 8px, raio 12, hover `neutral-900`: ícone 28 raio 8
// `accent-900` · nome 12.5px/500 + sub 11px (124px) · slider · `NN%` · mudo.
Rectangle {
  id: row

  required property var node
  required property string label
  required property string sub
  required property string glyph
  property string muteGlyph: "speaker-x-fill"
  property string unmuteGlyph: "speaker-simple-high"
  property string muteTitle: ""

  readonly property bool muted: node !== null && node.audio !== null && node.audio.muted
  readonly property int percent: node !== null && node.audio !== null ? Math.round(Math.min(1, node.audio.volume) * 100) : 0

  signal moved(int value)
  signal muteToggled

  implicitHeight: 42
  radius: 12
  color: hover.hovered ? Tokens.neutral900 : "transparent"

  HoverHandler {
    id: hover
  }

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 8
    anchors.rightMargin: 6
    spacing: 10

    Rectangle {
      implicitWidth: 28
      implicitHeight: 28
      radius: 8
      color: Tokens.accent900

      PhIcon {
        anchors.centerIn: parent
        glyph: row.glyph
        color: Tokens.accent300
      }
    }

    Column {
      Layout.preferredWidth: 124

      IslandText {
        width: parent.width
        text: row.label
        px: 12.5
        elide: Text.ElideRight
      }

      IslandText {
        width: parent.width
        visible: row.sub !== ""
        text: row.sub
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
        elide: Text.ElideRight
      }
    }

    IslandSlider {
      Layout.fillWidth: true
      value: row.muted ? 0 : row.percent
      thumbSize: 10
      onMoved: value => row.moved(value)
    }

    IslandText {
      Layout.preferredWidth: 34
      horizontalAlignment: Text.AlignRight
      text: row.muted ? "Mudo" : row.percent + "%"
      px: 11.5
      font.weight: Tokens.weightBody
      color: Tokens.neutral300
    }

    MuteButton {
      glyph: row.muted ? row.muteGlyph : row.unmuteGlyph
      muted: row.muted
      onClicked: row.muteToggled()
    }
  }
}
