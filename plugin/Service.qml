import QtQuick
import Quickshell

// Entrada `service` do plugin (keepLoaded: specs/14-spikes.md, S6). Vive até
// o shell reiniciar: guarda o estado visível que não pode se perder quando a
// barra é recriada pelo hot-reload.
Item {
  id: root

  // Injetados pelo host quando existem aqui.
  property string omarchyPath: Quickshell.env("OMARCHY_PATH")
  property var shell: null
  property var manifest: null

  readonly property string pluginId: "caionazario.island"
}
