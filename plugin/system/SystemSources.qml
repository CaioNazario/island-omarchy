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
  readonly property alias music: music
  readonly property alias calendar: calendar
  readonly property alias weather: weather
  readonly property alias hardware: hardware
  readonly property alias ai: ai
  readonly property alias github: github
  readonly property alias idle: idle
  readonly property alias screenRecord: screenRecord
  readonly property alias dictation: dictation
  readonly property alias display: display
  readonly property alias wifiDetails: wifiDetails
  readonly property alias wifiShare: wifiShare
  readonly property alias speedTest: speedTest
  readonly property alias hyprOptions: hyprOptions

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
  MusicSource {
    id: music
  }
  CalendarEvents {
    id: calendar
  }
  WeatherSource {
    id: weather
  }
  HardwareSource {
    id: hardware
  }
  AiUsageSource {
    id: ai
  }
  GithubSource {
    id: github
  }
  IdleSource {
    id: idle

    shell: sources.shell
  }
  ScreenRecordSource {
    id: screenRecord
  }
  DictationSource {
    id: dictation
  }
  DisplaySource {
    id: display
  }
  WifiDetailsSource {
    id: wifiDetails
  }
  WifiShareSource {
    id: wifiShare
  }
  SpeedTestSource {
    id: speedTest
  }
  HyprOptionsSource {
    id: hyprOptions
  }
}
