pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/wifi.mjs" as WifiCore
import "../core/shellQuote.mjs" as ShellQuote

// Modo `wifi` (specs/08-controles-rapidos.md): linha de controles · linha de
// energia · divisor · seção de redes com cabeçalho + switch, lista rolável e
// painel de senha abaixo da rede escolhida. O estado do painel mora no
// Bar.qml: é um só para todos os monitores e muda a altura da ilha.
ColumnLayout {
  id: view

  required property var bar
  readonly property var wifi: bar.system.wifi

  spacing: 0

  ControlsRow {
    Layout.fillWidth: true
    bar: view.bar
  }

  PowerRow {
    Layout.fillWidth: true
    bar: view.bar
  }

  Rectangle {
    Layout.fillWidth: true
    Layout.bottomMargin: 8
    implicitHeight: 1
    color: Tokens.neutral800
  }

  RadioHeader {
    Layout.fillWidth: true
    Layout.leftMargin: 12
    Layout.rightMargin: 12
    Layout.bottomMargin: 4
    glyph: "wifi-high"
    title: "Redes Wi‑Fi"
    status: WifiCore.headerStatus(view.wifi.radioOn, view.wifi.active)
    radioOn: view.wifi.radioOn
    onToggled: view.wifi.setRadio(!view.wifi.radioOn)
  }

  RadioOffArea {
    Layout.fillWidth: true
    Layout.preferredHeight: 150
    visible: !view.wifi.radioOn
    glyph: "wifi-slash"
    text: "Wi‑Fi desligado"
  }

  ListView {
    Layout.fillWidth: true
    Layout.fillHeight: true
    Layout.leftMargin: 12
    Layout.rightMargin: 12
    visible: view.wifi.radioOn
    clip: true
    boundsBehavior: Flickable.StopAtBounds
    model: view.wifi.list

    delegate: Column {
      id: entry

      required property var modelData
      readonly property bool passwordOpen: view.bar.wifiPasswordFor === modelData.ssid

      width: ListView.view.width

      NetworkRow {
        width: parent.width
        network: entry.modelData
        onClicked: view.clickNetwork(entry.modelData)
      }

      Loader {
        width: parent.width
        active: entry.passwordOpen
        sourceComponent: PasswordPanel {
          ssid: entry.modelData.ssid
          error: view.bar.wifiPasswordError
          onSubmitted: password => view.submit(entry.modelData.ssid, password)
          onCanceled: view.bar.closePassword()
          onTyped: view.bar.wifiPasswordError = ""
          Component.onCompleted: focusField()
        }
      }
    }
  }

  function clickNetwork(network) {
    const action = WifiCore.clickAction(network);
    if (action === "activate") wifi.activate(network.ssid);
    else if (action === "password") bar.togglePassword(network.ssid);
    else if (action === "settings") openEnterprise(network.ssid);
  }

  // Rede 802.1X sem perfil: o Omarchy não tem app de rede, então o `nmtui`
  // num terminal flutuante pede as credenciais.
  function openEnterprise(ssid) {
    bar.closeAll();
    bar.system.session.openInTerminal("nmtui connect " + ShellQuote.shellQuote(ssid));
  }

  function submit(ssid, password) {
    if (WifiCore.validatePassword(password) === "too-short") {
      bar.wifiPasswordError = "Senha precisa ter pelo menos 8 caracteres";
      return;
    }
    bar.closePassword();
    wifi.connectWithPassword(ssid, password);
  }
}
