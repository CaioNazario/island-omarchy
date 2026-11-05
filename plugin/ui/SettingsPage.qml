pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Aba Ajustes do editor (specs/04-notificacoes.md "Quem cuida das
// notificações"): liga e desliga a Island como dona das notificações e do OSD.
// É o caminho de volta quando a pergunta da primeira vez foi apagada sem
// querer, e o de saída para quem quer o Omarchy de novo.
SettingsSection {
  id: page

  required property var bar
  // Sem o serviço (harness mínimo) não há o que ligar.
  readonly property var takeover: bar.service ? bar.service.takeover : null
  readonly property bool known: takeover !== null && takeover.status !== "unknown"

  title: I18n.tr("Notifications and OSD")

  // O Omarchy pode ter mudado por fora (`omarchy plugin enable`): relê ao abrir.
  onVisibleChanged: if (visible && takeover) takeover.refresh()
  Component.onCompleted: if (takeover) takeover.refresh()

  SwitchRow {
    Layout.fillWidth: true
    enabled: page.known && !page.takeover.busy
    opacity: enabled ? 1 : 0.5
    label: I18n.tr("Island handles notifications and OSD")
    hint: I18n.tr("Turns off Omarchy's notifications and OSD plugins and shows them in the Island. Turn it off to give them back to Omarchy. Music and the other widgets don't depend on it.")
    on: page.known && page.takeover.status === "island"
    onToggled: on => on ? page.takeover.takeOver() : page.takeover.handBack()
  }

  IslandText {
    Layout.fillWidth: true
    visible: page.takeover !== null && page.takeover.busy
    text: I18n.tr("Switching… the shell can freeze for a few seconds while Omarchy reloads its plugins.")
    px: 11
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
    wrapMode: Text.WordWrap
  }

  IslandText {
    Layout.fillWidth: true
    visible: page.takeover !== null && !page.known
    text: I18n.tr("Checking…")
    px: 11
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
  }

  IslandText {
    Layout.fillWidth: true
    visible: page.takeover !== null && page.takeover.failed
    text: I18n.tr("Couldn't change the Omarchy plugins. Try again.")
    px: 11
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
    wrapMode: Text.WordWrap
  }
}
