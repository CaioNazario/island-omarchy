pragma ComponentBehavior: Bound

import QtQuick
import "../core/hardware.mjs" as HardwareCore

// Widget `hw` (specs/10-hardware.md "Blocos"): blocos de duas linhas, gap 2px,
// largura fixa pelo valor mais largo possível (a barra não pula). Sem espaço,
// somem NET → GPU → TEMP (`fittingBlocks`); `budget` é a largura que sobra.
WidgetFrame {
  id: widget

  required property var hardware
  property real budget: 100000

  readonly property var all: hardware.blocks
  readonly property var shownIds: HardwareCore.fittingBlocks(all.map(block => block.id), id => blockWidth(id), budget - 18, 2)
  // Largura com todos os blocos: a natural. Não pode vir da largura atual,
  // que depende do `budget` dado a partir dela.
  readonly property real fullWidth: all.reduce((sum, block) => sum + blockWidth(block.id), 0) + 2 * Math.max(0, all.length - 1) + 18
  // Largura com só CPU e RAM: o mínimo antes de o widget inteiro sumir.
  readonly property real minWidth: blockWidth("cpu") + blockWidth("ram") + 2 + 18

  clickable: true
  spacing: 2

  // Medidas uma vez: mudar o texto do TextMetrics dentro de um binding
  // criaria um laço de binding.
  property var widths: ({})

  function blockWidth(id) {
    return widths[id] || 32;
  }

  // O bloco tem a largura do mais largo entre o valor máximo e o rótulo
  // ("TEMP" é mais largo que "100°").
  Component.onCompleted: {
    const measured = {};
    Object.keys(HardwareCore.WIDEST_VALUE).forEach(id => {
      widest.text = HardwareCore.WIDEST_VALUE[id];
      label.text = id.toUpperCase();
      measured[id] = Math.ceil(Math.max(widest.advanceWidth, label.advanceWidth)) + 2;
    });
    widths = measured;
  }

  TextMetrics {
    id: label

    font.family: Tokens.fontFamily
    font.pointSize: 8.5 * 0.75
    font.weight: Tokens.weightLabel
    font.letterSpacing: 0.68
  }

  TextMetrics {
    id: widest

    font.family: Tokens.fontFamily
    font.pointSize: 11.5 * 0.75
    font.weight: Tokens.weightLabel
    font.features: { "tnum": 1 }
  }

  Repeater {
    model: widget.all.filter(block => widget.shownIds.includes(block.id))

    delegate: Column {
      id: block

      required property var modelData

      width: widget.blockWidth(modelData.id)
      spacing: -1

      IslandText {
        text: block.modelData.label
        px: 8.5
        font.letterSpacing: 0.68
        color: Tokens.neutral500
      }

      IslandText {
        text: block.modelData.value
        px: 11.5
        color: block.modelData.tone === "hot" ? Tokens.alertRed : block.modelData.tone === "busy" ? Tokens.accent300 : Tokens.text
      }
    }
  }
}
