pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "system"
import "core/environments.mjs" as EnvironmentsCore
import "core/appearance.mjs" as AppearanceCore
import "core/i18n.mjs" as I18nCore

// Entrada `service` do plugin (keepLoaded: specs/14-spikes.md, S6). Vive até
// o shell reiniciar: guarda o estado visível que não pode se perder quando a
// barra é recriada pelo hot-reload, e responde pelos alvos IPC que os
// scripts do Omarchy chamam (S7). A barra escuta os sinais.
Item {
  id: root

  // Injetados pelo host quando existem aqui.
  property string omarchyPath: Quickshell.env("OMARCHY_PATH")
  property var shell: null
  property var manifest: null

  readonly property string pluginId: "caionazario.island"

  readonly property alias notifications: notificationFeed
  readonly property alias settings: settingsStore
  readonly property alias stateStore: persistedState
  readonly property alias pomodoro: pomodoro
  // Idioma da interface (specs/13 "Idioma"), saneado. A barra o passa ao
  // `I18n`; o que vive aqui (pomodoro, ambientes iniciais) lê direto.
  readonly property string language: I18nCore.sanitizeLanguage(settingsStore.values.language)
  // Ambientes (spec 15): saneados a cada leitura, um ativo para todos os monitores.
  readonly property var environments: EnvironmentsCore.environmentsFromJson(settingsStore.values.environments, language)
  readonly property int environmentIndex: EnvironmentsCore.sanitizeIndex(settingsStore.values.environmentIndex, environments.length)
  // Aparência (spec 19), saneada a cada leitura como os ambientes.
  readonly property var appearance: AppearanceCore.sanitizeAppearance(settingsStore.values.appearance)
  readonly property bool doNotDisturb: persistedState.values.doNotDisturb
  readonly property bool hasUnread: notificationFeed.hasUnread

  signal osdRequested(string payload)
  signal osdCloseRequested
  signal quickToggleRequested
  signal stackRequested
  signal stackCloseRequested
  signal environmentStepRequested(int direction)

  function setDoNotDisturb(on) {
    persistedState.values.doNotDisturb = on;
  }

  /** Troca de ambiente; a barra anima e abre `env` (spec 15). */
  function setEnvironmentIndex(index) {
    settingsStore.values.environmentIndex = EnvironmentsCore.sanitizeIndex(index, environments.length);
  }

  function setLanguage(id) {
    settingsStore.values.language = I18nCore.sanitizeLanguage(id);
  }

  function setEnvironments(list) {
    settingsStore.values.environments = EnvironmentsCore.toStored(list);
  }

  /** Uma opção da aparência; o arquivo guarda o objeto inteiro já saneado. */
  function setAppearanceOption(key, value) {
    settingsStore.values.appearance = AppearanceCore.withAppearanceOption(appearance, key, value);
  }

  function applyAppearancePreset(id) {
    settingsStore.values.appearance = AppearanceCore.appearancePreset(id);
  }

  StateStore {
    id: persistedState
  }

  SettingsStore {
    id: settingsStore
  }

  PomodoroSource {
    id: pomodoro

    store: persistedState
    feed: notificationFeed
    language: root.language
  }

  NotificationFeed {
    id: notificationFeed
  }

  // Mesmo contrato do `plugins/notifications/Service.qml` do Omarchy 4.0.4:
  // os scripts `omarchy-*` e os atalhos `SUPER + vírgula` chamam estes nomes.
  IpcHandler {
    target: "notifications"

    function dndState(): string {
      return root.doNotDisturb ? "on" : "off";
    }
    function toggleDnd(): string {
      root.setDoNotDisturb(!root.doNotDisturb);
      return dndState();
    }
    function setDnd(value: string): string {
      root.setDoNotDisturb(["true", "1", "on", "yes"].includes(String(value).toLowerCase()));
      return dndState();
    }
    function isDnd(): string {
      return dndState();
    }
    // O histórico da Island é a lista do `stack`.
    function showHistory(): string {
      root.stackRequested();
      return "ok";
    }
    function clear(): string {
      notificationFeed.clearAll();
      return "ok";
    }
    function dismissAll(): string {
      notificationFeed.clearAll();
      return "ok";
    }
    function dismissOne(): string {
      if (notificationFeed.entries.length === 0) return "none";
      notificationFeed.dismiss(notificationFeed.entries[0].key);
      return "ok";
    }
    function invokeLast(): string {
      if (notificationFeed.entries.length === 0) return "none";
      notificationFeed.activate(notificationFeed.entries[0].key);
      return "ok";
    }
    function dismiss(summary: string): string {
      const match = notificationFeed.entries.find(entry => entry.ref && String(entry.ref.summary).includes(summary));
      if (!match) return "none";
      notificationFeed.dismiss(match.key);
      return "ok";
    }
    function ping(): string {
      return "ok";
    }
  }

  // Mesmo contrato do `plugins/osd/Osd.qml` do Omarchy 4.0.4.
  IpcHandler {
    target: "osd"

    function show(payloadJson: string): string {
      root.osdRequested(payloadJson);
      return "ok";
    }
    function close(): string {
      root.osdCloseRequested();
      return "ok";
    }
    function state(): string {
      return "closed";
    }
    function ping(): string {
      return "ok";
    }
  }

  // Atalhos da Island, para amarrar no Hyprland (`omarchy-shell island toggleQuick`).
  IpcHandler {
    target: "island"

    function toggleQuick(): string {
      root.quickToggleRequested();
      return "ok";
    }
    // Gestos de três dedos (spec 04): para baixo só abre `stack`, para cima só
    // fecha. Repetir o gesto não alterna.
    function openStack(): string {
      root.stackRequested();
      return "ok";
    }
    function closeStack(): string {
      root.stackCloseRequested();
      return "ok";
    }
    // `Super+Ctrl+Alt+→`/`←` (spec 15), amarrados no Hyprland.
    function nextEnvironment(): string {
      root.environmentStepRequested(1);
      return "ok";
    }
    function previousEnvironment(): string {
      root.environmentStepRequested(-1);
      return "ok";
    }
    function ping(): string {
      return "ok";
    }
  }
}
