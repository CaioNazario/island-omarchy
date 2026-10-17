pragma ComponentBehavior: Bound

import QtQuick
import Quickshell

// Todas as fontes de sistema da barra num lugar só. Vivem no Bar.qml: uma
// instância para todos os monitores, recriada no hot-reload.
Scope {
  id: sources

  property var shell: null

  readonly property alias audio: audio
  readonly property alias brightness: brightness
  readonly property alias nightLight: nightLight
  readonly property alias wifi: wifi
  readonly property alias bluetooth: bluetooth
  readonly property alias battery: battery
  readonly property alias session: session

  AudioSource {
    id: audio
  }
  BrightnessSource {
    id: brightness
  }
  NightLightSource {
    id: nightLight

    shell: sources.shell
  }
  WifiSource {
    id: wifi
  }
  BluetoothSource {
    id: bluetooth
  }
  BatterySource {
    id: battery
  }
  SessionActions {
    id: session
  }
}
