pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import "../core/notifications.mjs" as NotificationsCore

// Roteamento de notificação nova (specs/04-notificacoes.md "Roteamento"): a
// regra é do core; aqui só se aplica o resultado ao estado da barra.
Scope {
  id: router

  required property var bar

  property var notifEntry: null
  property var bannerEntry: null
  property int flashKey: 0

  function routeNotification(entry) {
    const incoming = {
      critical: entry.critical,
      low: entry.low,
      acknowledged: false,
      bannersAllowed: !bar.service.doNotDisturb,
      fromBrowser: entry.fromBrowser
    };
    const route = NotificationsCore.routeNotification(incoming, { mode: bar.mode, cardOpen: bar.cardOpen });
    if (route === "notif") return showNotif(entry);
    if (route === "stack") return flash(entry);
    if (route === "banner") return showBanner(entry);
  }

  function showNotif(entry) {
    bar.targetForAutomatic();
    notifEntry = entry;
    bar.islandState.openNotification(entry.critical, entry.fromBrowser);
  }

  function flash(entry) {
    flashKey = entry.key;
    flashTimer.restart();
  }

  function showBanner(entry) {
    bannerEntry = entry;
    bannerTimer.restart();
  }

  function hideBanner() {
    bannerEntry = null;
  }

  Timer {
    id: flashTimer

    interval: 2500
    onTriggered: router.flashKey = 0
  }

  Timer {
    id: bannerTimer

    interval: 2600
    onTriggered: router.hideBanner()
  }

  Connections {
    target: router.bar.service ? router.bar.service.notifications : null
    function onArrived(entry) {
      router.bar.nowMs = Date.now();
      router.routeNotification(entry);
    }
  }
}
