pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Wayland
import "../core/environments.mjs" as EnvironmentsCore

// Widget de outro plugin numa pílula (specs/16-widgets.md "Widgets de
// plugins"). Este item só reserva o lugar; o widget é desenhado numa faixa
// própria do topo, da altura da barra, por cima dele. O painel do Omarchy
// (`qs.Ui/KeyboardPanel.qml`, Omarchy 4) abre a `anchorWindow.height` do
// topo, e na camada de tela cheia da Island isso seria o pé da tela.
Item {
  id: place

  required property string widgetId
  required property PluginWidgetHost host
  // Edição (spec 17): a faixa deixa o clique passar para a seleção na pílula.
  property bool editing: false
  // Deslocamento e opacidade do conteúdo da pílula na troca de ambiente. O
  // deslocamento é um `Translate`, que o `TransformWatcher` não acompanha.
  property real shift: 0
  property real fade: 1

  readonly property string pluginId: EnvironmentsCore.pluginIdOf(widgetId)
  readonly property Component widgetComponent: host.componentFor(widgetId)
  readonly property Item widget: loader.item as Item
  // Janela da pílula (a camada de tela cheia da ScreenBar).
  readonly property QsWindow overlay: place.QsWindow.window as QsWindow
  // Zoom do monitor (spec 02 "Tamanho"): a faixa é outra janela, fora do
  // `scale` da barra, então o widget recebe o mesmo zoom aqui.
  readonly property real zoom: overlay && overlay.screen ? Tokens.zoomFor(overlay.screen.width, overlay.screen.height) : 1
  // O item já some quando a destruição chega: guarda o que foi registrado.
  property Item registered: null
  // `transform` e `shift` só entram como dependências do binding.
  readonly property point origin: {
    // qmllint disable confusing-expression-statement
    watcher.transform;
    shift;
    // qmllint enable confusing-expression-statement
    return place.mapToItem(null, 0, 0);
  }

  implicitWidth: widget && widget.visible ? widget.implicitWidth : 0
  implicitHeight: 22

  TransformWatcher {
    id: watcher

    a: place.overlay ? place.overlay.contentItem : null
    b: place
  }

  PanelWindow {
    id: strip

    screen: place.overlay ? place.overlay.screen : null
    visible: place.visible && place.widgetComponent !== null
    anchors {
      top: true
      left: true
      right: true
    }
    implicitHeight: Math.ceil(Tokens.barReserved * place.zoom)
    exclusionMode: ExclusionMode.Ignore
    color: "transparent"
    WlrLayershell.namespace: "island-plugin-widget"
    WlrLayershell.layer: WlrLayer.Top
    mask: place.editing ? noInput : widgetInput

    Region {
      id: noInput
    }

    Region {
      id: widgetInput

      item: frame
    }

    Item {
      id: frame

      x: place.origin.x
      y: place.origin.y + (place.height - height) * place.zoom / 2
      width: place.widget ? place.widget.implicitWidth : 0
      height: place.widget ? place.widget.implicitHeight : 0
      opacity: place.fade
      scale: place.zoom
      transformOrigin: Item.TopLeft

      Loader {
        id: loader

        anchors.fill: parent
        sourceComponent: place.widgetComponent
        onLoaded: {
          place.inject();
          if (place.registered) place.host.unregisterInstance(place.registered);
          place.registered = item;
          place.host.registerInstance(place.pluginId, item);
        }
      }
    }
  }

  // Como plugins/bar/Bar.qml `injectProps`: só o que o widget declara. O
  // tipo do widget vem do plugin, e o qmllint não o conhece.
  // qmllint disable missing-property
  function inject() {
    const target = loader.item;
    if (!target) return;
    if ("bar" in target) target.bar = host.facadeFor(pluginId);
    if ("moduleName" in target) target.moduleName = pluginId;
    if ("settings" in target) target.settings = host.settingsFor(pluginId);
  }
  // qmllint enable missing-property

  Connections {
    target: place.host
    function onLayoutChanged() {
      place.inject();
    }
  }

  Component.onDestruction: if (registered) host.unregisterInstance(registered)
}
