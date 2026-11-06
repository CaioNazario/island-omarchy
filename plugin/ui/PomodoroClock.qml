pragma ComponentBehavior: Bound

import QtQuick

// Relógio `MM:SS` de largura fixa (specs/20-pomodoro.md "Relógio"): cada
// caractere num bloco centralizado, dígito `0.58em` e dois-pontos `0.3em`,
// como no protótipo. A fonte já tem dígitos tabulares, mas a largura própria
// garante que o relógio nunca "trema", seja qual for a fonte que o Qt achar.
Row {
  id: clock

  property string text: "00:00"
  property real px: 44
  property int weight: Font.Light
  property color color: Tokens.text

  Repeater {
    // O modelo é só a quantidade: os blocos ficam e trocam o caractere.
    model: clock.text.length

    Item {
      id: cell

      required property int index
      readonly property string character: clock.text.charAt(index)

      width: Math.round(clock.px * (character === ":" ? 0.3 : 0.58))
      height: glyph.implicitHeight

      IslandText {
        id: glyph

        anchors.horizontalCenter: parent.horizontalCenter
        text: cell.character
        px: clock.px
        font.weight: clock.weight
        color: clock.color
      }
    }
  }
}
