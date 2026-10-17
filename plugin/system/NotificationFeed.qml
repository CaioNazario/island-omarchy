pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Services.Notifications
import "../core/notifications.mjs" as NotificationsCore
import "../core/notificationSource.mjs" as SourceCore

// Servidor de notificações da Island (specs/04-notificacoes.md "Fonte"). Com
// `omarchy.notifications` desligado, este `NotificationServer` é dono de
// `org.freedesktop.Notifications` (specs/14-spikes.md, S7). Vive no
// Service.qml: a lista sobrevive ao hot-reload da barra.
Scope {
  id: feed

  // As 8 mais recentes primeiro (specs/04 "Modo `stack`").
  property var entries: []
  property bool hasUnread: false
  property int nextKey: 1

  // A barra decide o roteamento: o feed só avisa e guarda.
  signal arrived(var entry)

  NotificationServer {
    keepOnReload: false
    bodySupported: true
    bodyMarkupSupported: true
    actionsSupported: true
    imageSupported: true
    persistenceSupported: true

    onNotification: notification => feed.receive(notification)
  }

  function receive(notification) {
    // Sem `tracked`, o objeto morre quando este handler retorna (o mesmo
    // cuidado do plugins/notifications/Service.qml do Omarchy 4.0.4).
    notification.tracked = true;
    const entry = makeEntry(notification);
    notification.closed.connect(() => feed.forget(entry.key));
    // Atualização por `replaces_id` chega no mesmo objeto, sem novo sinal.
    notification.summaryChanged.connect(() => feed.refresh(entry.key));
    notification.bodyChanged.connect(() => feed.refresh(entry.key));
    if (!entry.transient) entries = [entry].concat(entries).slice(0, 8);
    hasUnread = true;
    arrived(entry);
  }

  function makeEntry(notification) {
    const key = nextKey++;
    const appName = notification.appName || "";
    const source = SourceCore.identifySource(appName, notification.body || "");
    return {
      key: key,
      ref: notification,
      name: source.name || appName,
      glyph: source.glyph,
      appIcon: notification.appIcon || "",
      text: NotificationsCore.notificationText(source.name, notification.summary || "", source.body, true),
      timeMs: Date.now(),
      critical: notification.urgency === NotificationUrgency.Critical,
      low: notification.urgency === NotificationUrgency.Low,
      fromBrowser: SourceCore.isBrowserApp(appName),
      // Hint `transient` do protocolo: só aparece, não fica na lista.
      transient: !!(notification.hints && notification.hints["transient"])
    };
  }

  function refresh(key) {
    entries = entries.map(entry => {
      if (entry.key !== key) return entry;
      const updated = makeEntry(entry.ref);
      updated.key = key;
      updated.timeMs = entry.timeMs;
      return updated;
    });
  }

  function find(key) {
    return entries.find(entry => entry.key === key) || null;
  }

  // O app fechou a notificação, ou ela saiu da lista por aqui.
  function forget(key) {
    entries = entries.filter(entry => entry.key !== key);
  }

  /** × no item da lista. */
  function dismiss(key) {
    const entry = find(key);
    forget(key);
    if (entry && entry.ref) entry.ref.dismiss();
  }

  /** Clique num item: ação padrão (abre/foca o app ou site) e sai da lista. */
  function activate(key) {
    const entry = find(key);
    if (!entry || !entry.ref) return forget(key);
    const actions = entry.ref.actions || [];
    const defaultAction = actions.find(action => action.identifier === "default");
    if (defaultAction) defaultAction.invoke();
    dismiss(key);
  }

  function clearAll() {
    const all = entries;
    entries = [];
    all.forEach(entry => entry.ref && entry.ref.dismiss());
  }

  function markAllRead() {
    hasUnread = false;
  }
}
