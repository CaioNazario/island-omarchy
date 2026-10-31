pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/wifi.mjs" as WifiCore
import "../core/shellQuote.mjs" as ShellQuote

// Modo `wifi` (specs/08-controles-rapidos.md "Modo `wifi`"; design v5): linha
// de controles · linha de energia · divisor · cabeçalho da rede · estatísticas,
// QR ou velocidade · DNS · redes conhecidas e outras, com o painel de senha
// abaixo da rede escolhida. O estado do painel de senha, da vista e do DNS
// personalizado mora no Bar.qml: é um só para todos os monitores e muda a
// altura da ilha.
ColumnLayout {
  id: view

  required property var bar
  readonly property var wifi: bar.system.wifi
  readonly property var groups: WifiCore.splitNetworks(wifi.list)

  spacing: 0

  ControlsRow {
    Layout.fillWidth: true
    bar: view.bar
  }

  PowerRow {
    Layout.fillWidth: true
    bar: view.bar
  }

  FadeDivider {
    Layout.fillWidth: true
    Layout.bottomMargin: 8
  }

  WifiHeader {
    Layout.fillWidth: true
    Layout.leftMargin: 18
    Layout.rightMargin: 18
    Layout.bottomMargin: 8
    bar: view.bar
  }

  RadioOffArea {
    Layout.fillWidth: true
    Layout.preferredHeight: 150
    visible: !view.wifi.radioOn
    glyph: "wifi-slash"
    text: I18n.tr("Wi‑Fi off")
  }

  ColumnLayout {
    Layout.fillWidth: true
    Layout.fillHeight: true
    Layout.leftMargin: 12
    Layout.rightMargin: 12
    visible: view.wifi.radioOn
    spacing: 0

    WifiInfoArea {
      Layout.fillWidth: true
      Layout.leftMargin: 6
      Layout.rightMargin: 6
      Layout.bottomMargin: 8
      bar: view.bar
    }

    FadeDivider {
      Layout.fillWidth: true
      Layout.bottomMargin: 10
    }

    WifiDns {
      Layout.fillWidth: true
      Layout.leftMargin: 6
      Layout.rightMargin: 6
      Layout.bottomMargin: 10
      bar: view.bar
    }

    FadeDivider {
      Layout.fillWidth: true
      Layout.bottomMargin: 10
    }

    Flickable {
      Layout.fillWidth: true
      Layout.fillHeight: true
      clip: true
      boundsBehavior: Flickable.StopAtBounds
      contentHeight: lists.implicitHeight

      Column {
        id: lists

        width: parent.width

        GroupLabel {
          visible: view.groups.known.length > 0
          text: I18n.tr("Known networks")
        }

        Repeater {
          model: view.groups.known

          WifiNetworkEntry {
            width: lists.width
            bar: view.bar
            known: true
            onNetworkClicked: network => view.clickNetwork(network)
            onPasswordSubmitted: (ssid, password) => view.submit(ssid, password)
          }
        }

        GroupLabel {
          visible: view.groups.other.length > 0
          text: I18n.tr("Other networks")
        }

        Repeater {
          model: view.groups.other

          WifiNetworkEntry {
            width: lists.width
            bar: view.bar
            onNetworkClicked: network => view.clickNetwork(network)
            onPasswordSubmitted: (ssid, password) => view.submit(ssid, password)
          }
        }
      }
    }
  }

  // Rótulo de 20px, padding 0 6px, 11px maiúsculo `letter-spacing .08em`.
  component GroupLabel: Item {
    id: groupLabel

    property string text: ""

    implicitWidth: lists.width
    implicitHeight: 20

    IslandText {
      anchors.verticalCenter: parent.verticalCenter
      x: 6
      text: groupLabel.text
      px: 11
      font.weight: Tokens.weightBody
      font.capitalization: Font.AllUppercase
      font.letterSpacing: 0.88
      color: Tokens.neutral500
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
      bar.wifiPasswordError = WifiCore.PASSWORD_TOO_SHORT;
      return;
    }
    bar.closePassword();
    wifi.connectWithPassword(ssid, password);
  }
}
