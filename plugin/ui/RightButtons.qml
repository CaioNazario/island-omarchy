pragma ComponentBehavior: Bound

import QtQuick
import "../core/osd.mjs" as OsdCore
import "../core/mixer.mjs" as MixerCore

// Botões fixos da pílula direita (specs/02-barra.md "Pílula direita"), gap 2px:
// sino · Wi‑Fi · volume · bateria · seta. Clicar no gatilho do modo aberto fecha.
Row {
  id: buttons

  required property var bar
  required property string screenName
  readonly property var system: bar.system

  spacing: 2

  BarButton {
    onClicked: buttons.bar.openFromBar(buttons.screenName, "stack")

    PhIcon {
      anchors.centerIn: parent
      glyph: "bell-fill"
    }

    // Ponto de não lido 7×7 `accent` com anel 2px `bg`, em top 5 / right 8.
    Rectangle {
      x: 13
      y: 3
      width: 11
      height: 11
      radius: 5.5
      color: Tokens.accent
      border.width: 2
      border.color: Tokens.bg
      visible: buttons.bar.service !== null && buttons.bar.service.hasUnread === true
    }
  }

  BarButton {
    visible: buttons.system.wifi.available
    onClicked: buttons.bar.openFromBar(buttons.screenName, "wifi")

    PhIcon {
      anchors.centerIn: parent
      glyph: buttons.system.wifi.radioOn ? "wifi-high-bold" : "wifi-slash-bold"
    }
  }

  // Clique abre o `mixer`; a rolagem muda o volume em passos de 5% e mostra
  // `volume` como uma tecla de volume (specs/08 "Modo `mixer`").
  BarButton {
    id: volumeButton

    property real wheelRemainder: 0

    onClicked: buttons.bar.openFromBar(buttons.screenName, "mixer")

    PhIcon {
      anchors.centerIn: parent
      glyph: OsdCore.volumeGlyph(buttons.system.audio.percent, buttons.system.audio.muted)
    }

    WheelHandler {
      acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
      onWheel: event => {
        const delta = Math.abs(event.angleDelta.y) >= Math.abs(event.angleDelta.x) ? event.angleDelta.y : event.angleDelta.x;
        const wheel = MixerCore.wheelVolumeSteps(volumeButton.wheelRemainder, delta);
        volumeButton.wheelRemainder = wheel.remainder;
        if (wheel.steps === 0) return;
        const audio = buttons.system.audio;
        audio.setPercent(audio.percent + wheel.steps * MixerCore.WHEEL_VOLUME_STEP);
        buttons.bar.targetScreen = buttons.screenName;
        buttons.bar.islandState.volumeKey();
      }
    }
  }

  BatteryButton {
    battery: buttons.system.battery
    onClicked: buttons.bar.openFromBar(buttons.screenName, "quick")
  }

  BarButton {
    onClicked: buttons.bar.openFromBar(buttons.screenName, "quick")

    PhIcon {
      anchors.centerIn: parent
      glyph: "caret-down"
      size: 12
      color: Tokens.neutral300
    }
  }
}
