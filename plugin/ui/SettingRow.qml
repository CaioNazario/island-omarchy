pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Linha da aba Aparência do editor (specs/19-aparencia.md "Aba Aparência"):
// rótulo 12.5px/500 com dica opcional 11px `neutral-500` embaixo, controle à
// direita. `SwitchRow`, `SliderRow` e `ChoiceRow` põem o controle no `slot`.
RowLayout {
  id: row

  required property string label
  property string hint: ""
  default property alias control: slot.data

  spacing: 12

  ColumnLayout {
    Layout.fillWidth: true
    spacing: 2

    IslandText {
      Layout.fillWidth: true
      text: row.label
      px: 12.5
    }

    IslandText {
      Layout.fillWidth: true
      visible: row.hint !== ""
      text: row.hint
      px: 11
      font.weight: Tokens.weightBody
      color: Tokens.neutral500
      wrapMode: Text.WordWrap
    }
  }

  RowLayout {
    id: slot

    Layout.alignment: Qt.AlignVCenter
    spacing: 6
  }
}
