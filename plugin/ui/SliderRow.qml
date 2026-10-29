pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// `SettingRow` com slider de `from` a `to`. O `IslandSlider` vai de 0 a 100:
// esta linha converte para a faixa da opção, e o core arredonda ao passo
// (`sanitizeAppearance`). `unit` "%" mostra frações como porcentagem.
SettingRow {
  id: row

  property real value: 0
  property real from: 0
  property real to: 1
  property string unit: "%"

  signal moved(real value)

  IslandSlider {
    Layout.preferredWidth: 150
    value: Math.round((row.value - row.from) / (row.to - row.from) * 100)
    onMoved: position => row.moved(row.from + position / 100 * (row.to - row.from))
  }

  IslandText {
    Layout.preferredWidth: 42
    horizontalAlignment: Text.AlignRight
    text: row.unit === "%" ? Math.round(row.value * 100) + "%" : row.value + " " + row.unit
    px: 12
    font.weight: Tokens.weightBody
    color: Tokens.neutral300
  }
}
