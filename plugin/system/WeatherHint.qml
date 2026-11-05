pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import "../core/weather.mjs" as WeatherCore

// Dica do clima (specs/07-clima.md "Critérios de aceite"): sem cidade em
// lugar nenhum e com a detecção automática falha, uma notificação avisa
// uma única vez (`weatherHintShown` no `state.json`); clicar nela abre o
// editor na aba Clima.
Scope {
  id: hint

  required property var weather
  // Sem o serviço (harness), não há onde guardar nem listar: a dica não roda.
  property var feed: null
  property var store: null
  property string language: "en"
  required property var bar

  Connections {
    target: hint.weather
    function onDetectionFailed() {
      // Estado ainda não lido: gravar agora perderia o resto do arquivo.
      if (!hint.store || !hint.feed || !hint.store.ready) return;
      if (!WeatherCore.shouldShowHint(hint.store.values.weatherHintShown, hint.weather.origin, true)) return;
      hint.store.values.weatherHintShown = true;
      const message = WeatherCore.hintMessage(hint.language);
      hint.feed.pushInternal(message.title, message.body, "cloud-fill", "weather");
    }
  }

  Connections {
    target: hint.feed
    function onActionRequested(action) {
      if (action === "weather") hint.bar.openEditorPage("weather");
    }
  }
}
