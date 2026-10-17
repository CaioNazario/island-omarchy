pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Services.UPower
import "../core/battery.mjs" as BatteryCore

// Bateria (specs/11-bateria.md): o dispositivo de exibição do UPower. Sem
// bateria (desktop), o botão some.
Scope {
  readonly property UPowerDevice device: UPower.displayDevice
  readonly property bool available: device !== null && device.ready && device.isLaptopBattery
  readonly property int percent: available ? Math.round(device.percentage * 100) : 0
  // "Carregando" inclui na tomada parado pelo limite de carga (PendingCharge).
  readonly property bool charging: available && (device.state === UPowerDeviceState.Charging
    || device.state === UPowerDeviceState.FullyCharged
    || device.state === UPowerDeviceState.PendingCharge)
  readonly property var display: BatteryCore.batteryDisplay(percent, charging)
}
