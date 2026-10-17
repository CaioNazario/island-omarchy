pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Bluetooth
import Quickshell.Io
import "../core/bluetooth.mjs" as BluetoothCore

// Bluetooth (specs/08-controles-rapidos.md "Modo `bt`"). Estado pelo
// Quickshell.Bluetooth; ações pelos mesmos scripts do painel do Omarchy
// (`omarchy-bluetooth-power`, `omarchy-bluetooth-device`), que lidam com
// rfkill, confiança e timeouts. Uma operação por vez.
Scope {
  id: bluetooth

  // qmllint disable unresolved-type
  readonly property var adapter: Bluetooth.defaultAdapter // o qmltypes do Quickshell 0.3.1 não resolve BluetoothAdapter
  // qmllint enable unresolved-type
  readonly property bool available: adapter !== null
  readonly property bool radioOn: available && adapter.enabled
  readonly property var devices: adapter ? adapter.devices.values : []
  property var operation: null
  property bool searching: false
  // A busca iniciada por esta ilha ainda não foi confirmada como parada.
  property bool owesDiscoveryStop: false
  property int revision: 0

  readonly property var lists: buildLists(revision, devices, operation)
  readonly property int connectedCount: lists.paired.filter(d => d.connected).length

  function buildLists(_revision, all, current) {
    return BluetoothCore.buildDeviceLists(all.map(deviceInfo), current);
  }

  function deviceInfo(device) {
    const hasName = device.deviceName !== "" && device.deviceName !== device.address;
    return {
      path: device.address,
      name: hasName ? device.deviceName : device.address,
      hasName: hasName,
      kind: BluetoothCore.kindFromBluezIcon(device.icon),
      paired: device.paired || device.bonded,
      connected: device.connected,
      battery: device.batteryAvailable ? Math.round(device.battery * 100) : null
    };
  }

  function setRadio(on) {
    Quickshell.execDetached(["omarchy-bluetooth-power", on ? "on" : "off"]);
  }

  /** Clique numa linha: `btClickAction` decide; ocupado, nada acontece. */
  function activate(device) {
    const action = BluetoothCore.btClickAction(device, operation !== null);
    if (action === "none") return;
    const kind = action === "pair" ? "pairing" : action === "connect" ? "connecting" : "disconnecting";
    operation = { path: device.path, kind: kind };
    runner.command = ["omarchy-bluetooth-device", action, device.path];
    runner.running = true;
  }

  Process {
    id: runner

    onExited: bluetooth.operation = null
  }

  // Busca só com `bt` aberto (specs/08). Plugins/panels/bluetooth/Panel.qml
  // (Omarchy 4.0.4): o Quickshell só repassa uma escrita em `discovering`
  // diferente do último estado confirmado pelo BlueZ, e a sessão de busca
  // não acaba sozinha; presa ligada, ela engasga o áudio A2DP. Por isso os
  // dois timers seguem o estado confirmado em vez de escrever uma vez.
  Timer {
    interval: 1000
    repeat: true
    triggeredOnStart: true
    running: bluetooth.searching && bluetooth.radioOn && !bluetooth.adapter.discovering
    onTriggered: {
      bluetooth.owesDiscoveryStop = true;
      bluetooth.adapter.discovering = true;
    }
  }

  Timer {
    property int attempts: 0

    interval: 1000
    repeat: true
    running: !bluetooth.searching && bluetooth.owesDiscoveryStop && bluetooth.available && bluetooth.adapter.discovering
    onRunningChanged: if (running) attempts = 0
    onTriggered: {
      attempts += 1;
      if (attempts > 3) bluetooth.owesDiscoveryStop = false;
      else bluetooth.adapter.discovering = false;
    }
  }

  Connections {
    target: bluetooth.adapter
    function onDiscoveringChanged() {
      if (!bluetooth.adapter.discovering) bluetooth.owesDiscoveryStop = false;
    }
  }

  // A lista depende de propriedades de cada dispositivo, que não notificam a
  // lista: um contador força o recálculo.
  Instantiator {
    model: bluetooth.devices

    delegate: Connections {
      required property var modelData

      target: modelData
      function onConnectedChanged() {
        bluetooth.revision++;
      }
      function onPairedChanged() {
        bluetooth.revision++;
      }
      function onDeviceNameChanged() {
        bluetooth.revision++;
      }
      function onBatteryChanged() {
        bluetooth.revision++;
      }
    }
  }

  // Recriada no hot-reload: sem a ilha, ninguém mais pararia a busca.
  Component.onDestruction: if (owesDiscoveryStop && available && adapter.discovering) adapter.discovering = false
}
