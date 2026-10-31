pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Services.UPower
import "../core/battery.mjs" as BatteryCore
import "../core/batteryPanel.mjs" as PanelCore

// Bateria (specs/11-bateria.md): o dispositivo de exibição do UPower. Sem
// bateria (desktop), o botão some. Com o modo `battery` aberto, os detalhes
// e os perfis vêm dos comandos do painel de energia do Omarchy.
Scope {
  id: battery

  property bool watching: false

  readonly property UPowerDevice device: UPower.displayDevice
  readonly property bool available: device !== null && device.ready && device.isLaptopBattery
  readonly property int percent: available ? Math.round(device.percentage * 100) : 0
  // "Carregando" inclui na tomada parado pelo limite de carga (PendingCharge).
  readonly property bool charging: available && (device.state === UPowerDeviceState.Charging
    || device.state === UPowerDeviceState.FullyCharged
    || device.state === UPowerDeviceState.PendingCharge)
  // Economia de bateria ligada (perfil power-saver); vem do serviço, então vale
  // também com o painel fechado.
  readonly property bool saver: PowerProfiles.profile === PowerProfile.PowerSaver
  readonly property var display: BatteryCore.batteryDisplay(percent, charging)

  property var status: ({})
  property var profiles: []

  onWatchingChanged: if (watching) refresh()
  onChargingChanged: if (watching) refresh()

  function refresh() {
    if (!statusProc.running) statusProc.running = true;
    if (!profilesProc.running) profilesProc.running = true;
  }

  /** Guarda o perfil para a fonte atual (tomada ou bateria), como o Omarchy. */
  function setProfile(id) {
    if (profileProc.running) return;
    profileProc.command = ["omarchy-powerprofiles-set", charging ? "ac" : "battery", id];
    profileProc.running = true;
  }

  Process {
    id: statusProc

    command: ["omarchy-battery-status", "--shell"]
    stdout: StdioCollector {
      onStreamFinished: {
        // Na troca da tomada a saída vem vazia por um instante: mantém a última.
        const next = PanelCore.parseBatteryStatus(text);
        if (Object.keys(next).length > 0) battery.status = next;
      }
    }
  }

  Process {
    id: profilesProc

    command: ["omarchy-powerprofiles-list", "--active-state"]
    stdout: StdioCollector {
      onStreamFinished: {
        const next = PanelCore.parsePowerProfiles(text);
        if (next.length > 0) battery.profiles = next;
      }
    }
  }

  Process {
    id: profileProc

    onExited: battery.refresh()
  }

  Timer {
    interval: 5000
    repeat: true
    running: battery.watching
    onTriggered: battery.refresh()
  }
}
