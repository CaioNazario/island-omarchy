pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Networking
import "../core/wifi.mjs" as WifiCore

// Wi‑Fi (specs/08-controles-rapidos.md "Modo `wifi`") pelo Quickshell.Networking
// (NetworkManager). As regras da lista e do clique vivem em src/core/wifi.ts.
Scope {
  id: wifi

  readonly property var device: findDevice()
  readonly property bool available: device !== null
  readonly property bool radioOn: Networking.wifiEnabled
  readonly property var networks: device ? device.networks.values : []
  // `buildNetworkList` com status; recalculado quando a lista ou um estado muda.
  property var list: []
  property var active: null
  // Rede que esta ilha mandou conectar com senha: só ela volta ao painel.
  property string pendingSsid: ""

  signal connectFailed(string ssid, string message)

  function findDevice() {
    const devices = Networking.devices.values;
    for (let i = 0; i < devices.length; i++)
      if (devices[i].type === DeviceType.Wifi) return devices[i];
    return null;
  }

  function setRadio(on) {
    Networking.wifiEnabled = on;
  }

  /** A busca só roda com `wifi` aberto, como a do Bluetooth. */
  function setScanning(on) {
    if (device) device.scannerEnabled = on;
  }

  function networkFor(ssid) {
    for (let i = 0; i < networks.length; i++)
      if (networks[i].name === ssid) return networks[i];
    return null;
  }

  function activate(ssid) {
    const network = networkFor(ssid);
    if (network) network.connect();
  }

  function connectWithPassword(ssid, password) {
    const network = networkFor(ssid);
    if (!network) return;
    pendingSsid = ssid;
    network.connectWithPsk(password);
    watchdog.restart();
  }

  function rebuild() {
    const infos = [];
    let current = null;
    for (let i = 0; i < networks.length; i++) {
      const network = networks[i];
      infos.push(accessPointInfo(network));
      if (network.connected) current = { ssid: network.name, status: "connected" };
      else if (network.state === ConnectionState.Connecting && !current) current = { ssid: network.name, status: "connecting" };
    }
    active = current;
    list = WifiCore.buildNetworkList(infos, current);
  }

  function accessPointInfo(network) {
    return {
      ssid: network.name,
      strength: Math.round((network.signalStrength || 0) * 100),
      security: WifiCore.securityFromQuickshell(WifiSecurityType.toString(network.security)),
      hasProfile: network.known
    };
  }

  // Falha numa rede que a ilha conectou com senha: o perfil recém-criado sai
  // (specs/08 "Painel de senha") e o painel reabre com a mensagem.
  function handleFailure(network, reason) {
    if (network.name !== pendingSsid) return;
    fail(network, WifiCore.connectFailureMessage(ConnectionFailReason.toString(reason)));
  }

  function fail(network, message) {
    watchdog.stop();
    pendingSsid = "";
    network.forget();
    connectFailed(network.name, message);
  }

  // "Sem ativação em 30s: Não foi possível conectar" (specs/08).
  Timer {
    id: watchdog

    interval: 30000
    onTriggered: {
      const network = wifi.networkFor(wifi.pendingSsid);
      if (network && !network.connected) wifi.fail(network, WifiCore.CONNECT_FAILED);
    }
  }

  onNetworksChanged: rebuild()
  Component.onCompleted: rebuild()

  Instantiator {
    model: wifi.networks

    delegate: Connections {
      required property var modelData

      target: modelData
      function onStateChanged() {
        wifi.rebuild();
        if (!modelData.connected || modelData.name !== wifi.pendingSsid) return;
        wifi.pendingSsid = "";
        watchdog.stop();
      }
      function onSignalStrengthChanged() {
        wifi.rebuild();
      }
      function onKnownChanged() {
        wifi.rebuild();
      }
      function onConnectionFailed(reason) {
        wifi.handleFailure(modelData, reason);
      }
    }
  }
}
