pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Rótulo de seção dos painéis do v5 (`display`, `battery`, `wifi`, `ai`): 18px,
// 11px maiúsculo `letter-spacing .08em` `neutral-500`; valor opcional à direita,
// sem maiúsculas, `neutral-400` (ou `valueColor`).
RowLayout {
  id: label

  required property string text
  property string value: ""
  property color valueColor: Tokens.neutral400

  implicitHeight: 18
  spacing: 8

  IslandText {
    Layout.fillWidth: true
    text: label.text
    px: 11
    font.weight: Tokens.weightBody
    font.capitalization: Font.AllUppercase
    font.letterSpacing: 0.88
    color: Tokens.neutral500
  }

  IslandText {
    visible: label.value !== ""
    text: label.value
    px: 11
    font.weight: Tokens.weightBody
    color: label.valueColor
  }
}
