pragma ComponentBehavior: Bound

import QtQuick

// Uma rede da lista do `wifi` com o painel de senha logo abaixo quando ela é
// a escolhida (specs/08 "Painel de senha").
Column {
  id: entry

  required property var modelData
  required property var bar
  property bool known: false
  readonly property bool passwordOpen: bar.wifiPasswordFor === modelData.ssid

  signal networkClicked(var network)
  signal passwordSubmitted(string ssid, string password)

  NetworkRow {
    width: parent.width
    network: entry.modelData
    known: entry.known
    onClicked: entry.networkClicked(entry.modelData)
  }

  Loader {
    width: parent.width
    active: entry.passwordOpen
    sourceComponent: PasswordPanel {
      ssid: entry.modelData.ssid
      error: entry.bar.wifiPasswordError
      onSubmitted: password => entry.passwordSubmitted(entry.modelData.ssid, password)
      onCanceled: entry.bar.closePassword()
      onTyped: entry.bar.wifiPasswordError = ""
      Component.onCompleted: focusField()
    }
  }
}
