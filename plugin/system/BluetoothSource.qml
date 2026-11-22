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
  // Depois de uma suspensão o adaptador USB é resetado e o BlueZ recria o
  // `hci0`; o `adapter.enabled` do Quickshell pode ficar preso em `false` com
  // o rádio ligado, e o switch passa a mandar só "on". O estado real vem de
  // `omarchy-bluetooth-power is-on` (`probedOn`); `null` = ainda sem leitura.
  property var probedOn: null
  // `adapter`, não `available`: quando o adaptador some na volta da suspensão,
  // este binding pode rodar antes do de `available` e lia `enabled` de null.
  readonly property bool radioOn: adapter !== null && (probedOn !== null ? probedOn : adapter.enabled)
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
    if (power.running) return;
    power.command = ["omarchy-bluetooth-power", on ? "on" : "off"];
    power.running = true;
  }

  /** Relê o estado real; uma leitura por vez, a pedida no meio roda depois. */
  function probe() {
    if (prober.running) prober.pending = true;
    else prober.running = true;
  }

  onAdapterChanged: {
    probedOn = null;
    probe();
  }
  onSearchingChanged: if (searching) probe()
  Component.onCompleted: probe()

  Process {
    id: power

    onExited: bluetooth.probe()
  }

  Process {
    id: prober

    property bool pending: false

    command: ["omarchy-bluetooth-power", "is-on"]
    onExited: exitCode => {
      bluetooth.probedOn = exitCode === 0;
      if (pending) {
        pending = false;
        running = true;
      }
    }
  }

  // A mudança notificada pelo BlueZ vale na hora; a leitura só confirma.
  Connections {
    target: bluetooth.adapter
    function onEnabledChanged() {
      bluetooth.probedOn = null;
      bluetooth.probe();
    }
  }

  // Volta da suspensão: um salto no relógio maior que o tique (como em
  // CalendarEvents.qml).
  Timer {
    property real lastTick: Date.now()

    interval: 30000
    repeat: true
    running: true
    onTriggered: {
      const now = Date.now();
      if (now - lastTick > 2 * interval) bluetooth.probe();
      lastTick = now;
    }
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
