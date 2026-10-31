pragma Singleton

import QtQuick
import "../core/i18n.mjs" as I18nCore

// Idioma da interface (specs/13-preferencias.md "Idioma"). O Bar.qml liga
// `language` ao `settings.json`, como o tema no `Tokens`. Um binding que chama
// `tr` passa a depender de `language` e se refaz na troca.
QtObject {
  property string language: "en"

  function tr(text, params) {
    return I18nCore.tr(language, text, params || {});
  }

  // `one` com n = 1, `other` no resto; `{n}` vira o número.
  function count(n, one, other, params) {
    return I18nCore.trCount(language, n, one, other, params || {});
  }
}
