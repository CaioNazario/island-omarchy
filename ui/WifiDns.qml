pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/wifiPanel.mjs" as PanelCore

// Servidor DNS do `wifi` (specs/08 "Modo `wifi`"; design v5): rótulo com os
// servidores atuais, quatro opções do `omarchy-dns` e, em Personalizado, um
// campo de 32px para os servidores (Enter aplica, Esc desiste).
ColumnLayout {
  id: dns

  required property var bar
  readonly property var details: bar.system.wifiDetails

  spacing: 0

  function choose(id) {
    if (id === "Custom") {
      bar.wifiDnsEditing = true;
      field.text = details.customServers.join(" ");
      field.forceActiveFocus();
      return;
    }
    bar.wifiDnsEditing = false;
    details.setDns(id);
  }

  PanelLabel {
    Layout.fillWidth: true
    text: I18n.tr("DNS server")
    value: dns.details.dnsBusy ? I18n.tr("Applying…") : PanelCore.dnsDetail(dns.details.dnsProvider, dns.details.current ? dns.details.current.gateway : "", dns.details.customServers, I18n.language)
  }

  RowLayout {
    Layout.fillWidth: true
    spacing: 6

    Repeater {
      model: PanelCore.DNS_OPTIONS

      ChoiceButton {
        required property var modelData

        Layout.fillWidth: true
        label: I18n.tr(modelData.label)
        active: dns.bar.wifiDnsEditing ? modelData.id === "Custom" : modelData.id === dns.details.dnsProvider
        onClicked: dns.choose(modelData.id)
      }
    }
  }

  Rectangle {
    Layout.fillWidth: true
    Layout.topMargin: 6
    visible: dns.bar.wifiDnsEditing
    implicitHeight: 32
    radius: 9
    color: Tokens.bg
    border.width: 1
    border.color: Tokens.neutral800

    RowLayout {
      anchors.fill: parent
      anchors.leftMargin: 10
      anchors.rightMargin: 10
      spacing: 8

      PhIcon {
        glyph: "globe-simple"
        size: 14
        color: Tokens.neutral400
      }

      TextInput {
        id: field

        Layout.fillWidth: true
        color: Tokens.text
        font.family: Tokens.fontFamily
        font.pointSize: 12.5 * 0.75
        clip: true
        onAccepted: {
          dns.details.setCustomDns(text);
          dns.bar.wifiDnsEditing = false;
        }
        Keys.onEscapePressed: dns.bar.wifiDnsEditing = false

        IslandText {
          visible: field.text === ""
          text: "ex.: 9.9.9.9, 149.112.112.112"
          px: 12.5
          font.weight: Tokens.weightBody
          color: Tokens.neutral500
          width: field.width
          elide: Text.ElideRight
        }
      }
    }
  }
}
