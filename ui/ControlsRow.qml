pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/osd.mjs" as OsdCore

// Linha de controles comum a `quick`, `wifi` e `bt` (specs/08-controles-rapidos.md):
// 46px, padding 0 7px, gap 6px, com a ilha em 660px. Tile de rádio sem
// hardware some, como os de serviço que faltam (Omarchy, voxtype); sem
// backlight, o volume ocupa o espaço do brilho.
Item {
  id: row

  required property var bar
  readonly property var system: bar.system

  implicitHeight: 46

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 7
    anchors.rightMargin: 7
    spacing: 6

    SliderPill {
      visible: row.system.brightness.available
      glyph: "sun"
      value: row.system.brightness.percent
      onMoved: value => row.system.brightness.setPercent(value)
      onDragStarted: row.bar.islandState.dragStart()
      onDragEnded: row.bar.islandState.dragEnd()
    }

    SliderPill {
      glyph: OsdCore.volumeGlyph(row.system.audio.percent, row.system.audio.muted)
      glyphAction: true
      onGlyphClicked: row.bar.openFromBar(row.bar.targetScreen, "mixer")
      value: row.system.audio.percent
      onMoved: value => row.system.audio.setPercent(value)
      onDragStarted: row.bar.islandState.dragStart()
      onDragEnded: row.bar.islandState.dragEnd()
    }

    // "abre wifi; em wifi, volta a quick": o tile vive dentro de quick/wifi/bt,
    // não é a regra 2 da spec 03.
    Tile {
      visible: row.system.wifi.available
      glyph: "wifi-high-bold"
      on: row.system.wifi.radioOn
      onClicked: row.bar.openFromBar(row.bar.targetScreen, row.bar.mode === "wifi" ? "quick" : "wifi")
    }

    Tile {
      visible: row.system.bluetooth.available
      glyph: "bluetooth-bold"
      on: row.system.bluetooth.radioOn
      onClicked: row.bar.openFromBar(row.bar.targetScreen, row.bar.mode === "bt" ? "quick" : "bt")
    }

    Tile {
      visible: row.system.nightLight.available
      glyph: "moon-fill"
      on: row.system.nightLight.on
      onClicked: row.system.nightLight.toggle()
    }

    Tile {
      glyph: "bell-slash-fill"
      on: row.bar.service !== null && row.bar.service.doNotDisturb
      onClicked: if (row.bar.service) row.bar.service.setDoNotDisturb(!row.bar.service.doNotDisturb)
    }

    // Abre o modo `display` (brilho, tamanho do texto, escala).
    Tile {
      glyph: "monitor"
      onClicked: row.bar.openFromBar(row.bar.targetScreen, "display")
    }

    Tile {
      visible: row.system.idle.available
      glyph: "coffee-fill"
      on: row.system.idle.stayAwake
      onClicked: row.system.idle.toggle()
    }

    // Começar abre o menu de captura do Omarchy: fecha a ilha antes, como
    // Configurações, para o menu pegar o foco.
    Tile {
      glyph: row.system.screenRecord.recording ? "stop-fill" : "record-fill"
      on: row.system.screenRecord.recording
      onColor: Tokens.recordOnBg
      onIconColor: Tokens.neutral100
      onClicked: {
        if (!row.system.screenRecord.recording) row.bar.closeAll();
        row.system.screenRecord.toggle();
      }
    }

    Tile {
      visible: row.system.dictation.available
      glyph: row.system.dictation.recording ? "microphone-fill" : "microphone"
      on: row.system.dictation.recording
      onClicked: row.system.dictation.toggle()
    }

    Rectangle {
      Layout.leftMargin: 2
      Layout.rightMargin: 2
      implicitWidth: 1
      implicitHeight: 22
      color: Tokens.neutral800
    }

    RoundButton {
      glyph: "gear-six"
      // Fecha antes de abrir: com o foco exclusivo da ilha, o menu não o pegaria.
      onClicked: {
        row.bar.closeAll();
        row.system.session.openSettings();
      }
    }

    RoundButton {
      glyph: "power-bold"
      restingColor: row.bar.powerOpen ? Tokens.powerOpenBg : Tokens.tileOff
      restingIconColor: row.bar.powerOpen ? Tokens.neutral100 : Tokens.tileOffIcon
      onClicked: row.bar.islandState.togglePower()
    }
  }
}
