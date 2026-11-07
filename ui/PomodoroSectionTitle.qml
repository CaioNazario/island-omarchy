pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Título de seção das configurações do Pomodoro (specs/20 "Painel de
// configurações"): 12.5px `neutral-500`, `padding 8 12 6`, com um item opcional
// à direita ("Testar pausa").
RowLayout {
  id: title

  required property string text
  default property alias trailing: slot.data

  implicitHeight: 28
  spacing: 8

  IslandText {
    Layout.fillWidth: true
    Layout.leftMargin: 12
    Layout.topMargin: 8
    Layout.bottomMargin: 6
    text: title.text
    px: 12.5
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
  }

  RowLayout {
    id: slot

    Layout.rightMargin: 12
    Layout.topMargin: 8
    Layout.bottomMargin: 6
  }
}
