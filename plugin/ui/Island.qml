pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/island.mjs" as IslandCore
import "../core/osd.mjs" as OsdCore

// Ilha central (specs/03-ilha.md). Só renderiza: o estado é o `IslandState`
// do core, dono do Bar.qml. Fundo e sombras ficam na `SoftSurface`, o corte
// do conteúdo (`overflow: hidden` no design) na `surface`; cada modo é uma
// `ModeLayer`.
Item {
  id: root

  required property var bar
  // O que este monitor mostra: o modo do alvo, ou `compact` nos demais.
  required property string displayMode

  signal clicked

  readonly property var size: sizeOf(displayMode)
  // Altura do cartão central: a do conteúdo (specs/05 "Cartão central").
  property real cardHeight: 0

  function sizeOf(id) {
    if (id === "card") return { width: 440, height: cardHeight + 2, radius: 26 };
    return IslandCore.getSize(id, bar.sizeContext);
  }
  // Entre `quick`, `wifi` e `bt` a troca de camada é instantânea: os três
  // repetem a fileira de tiles no topo e só a ilha anima a altura.
  property string shownLayer: displayMode
  property bool instantSwitch: false
  readonly property var tileModes: ["quick", "wifi", "bt"]

  onDisplayModeChanged: {
    instantSwitch = tileModes.includes(shownLayer) && tileModes.includes(displayMode);
    shownLayer = displayMode;
  }

  width: size.width
  height: size.height

  Behavior on width {
    NumberAnimation {
      duration: Tokens.springMs
      easing.type: Easing.BezierSpline
      easing.bezierCurve: Tokens.springCurve
    }
  }
  Behavior on height {
    NumberAnimation {
      duration: Tokens.springMs
      easing.type: Easing.BezierSpline
      easing.bezierCurve: Tokens.springCurve
    }
  }

  // Dentro da ilha o cursor é de mão só em `compact` e `notif`; nos outros
  // modos os cliques são do conteúdo.
  MouseArea {
    anchors.fill: parent
    enabled: root.displayMode === "compact" || root.displayMode === "notif"
    cursorShape: Qt.PointingHandCursor
    onClicked: root.clicked()
  }

  HoverHandler {
    onHoveredChanged: root.bar.islandHovered(hovered)
  }

  SoftSurface {
    anchors.fill: parent
    radius: IslandCore.displayRadius(root.size)
    island: true
    expanded: root.displayMode !== "compact"

    // "Raio: 460ms ease" (specs/03-ilha.md "Animação").
    Behavior on radius {
      NumberAnimation {
        duration: Tokens.springMs
        easing.type: Easing.InOutQuad
      }
    }
  }

  Item {
    id: surface

    anchors.fill: parent
    clip: true

    component Layer: ModeLayer {
      anchors.top: parent.top
      anchors.horizontalCenter: parent.horizontalCenter
      // Cada camada tem o tamanho do seu modo, dentro do anel de 1px.
      width: root.sizeOf(layerId).width - 2
      height: root.sizeOf(layerId).height - 2
      anchors.topMargin: 1
      shownLayer: root.shownLayer
      instant: root.instantSwitch
    }

    Layer {
      layerId: "compact"

      // O Loader da camada estica o filho direto: o Item recebe o tamanho e
      // o conteúdo fica centralizado nele.
      Item {
        CompactContent {
          anchors.centerIn: parent
          weather: root.bar.system.weather
        }
      }
    }

    Layer {
      layerId: "notif"

      NotificationCard {
        entry: root.bar.notifEntry || ({ name: "", text: "", timeMs: 0, glyph: "bell-fill", appIcon: "" })
        nowMs: root.bar.nowMs
        // × fecha a ilha; a notificação continua na lista.
        onClosed: root.bar.closeAll()
      }
    }

    Layer {
      layerId: "stack"

      StackView {
        bar: root.bar
      }
    }

    Layer {
      layerId: "music"

      MusicRow {
        bar: root.bar
      }
    }

    Layer {
      layerId: "calendar"

      CalendarModeView {
        bar: root.bar
      }
    }

    Layer {
      layerId: "card"

      Item {
        CenterCard {
          width: parent.width
          bar: root.bar
          onImplicitHeightChanged: root.cardHeight = implicitHeight
          Component.onCompleted: root.cardHeight = implicitHeight
        }
      }
    }

    Layer {
      layerId: "env"

      EnvRow {
        bar: root.bar
      }
    }

    Layer {
      layerId: "note"

      NoteView {
        bar: root.bar
      }
    }

    Layer {
      layerId: "ai"

      AiView {
        bar: root.bar
      }
    }

    Layer {
      layerId: "volume"

      // Clicar fora do slider abre o gerenciador de volume (design v4 `openMixer`).
      Item {
        MouseArea {
          anchors.fill: parent
          cursorShape: Qt.PointingHandCursor
          onClicked: root.bar.openFromBar(root.bar.targetScreen, "mixer")
        }

        LevelRow {
          anchors.fill: parent
          glyph: OsdCore.volumeGlyph(root.bar.system.audio.percent, root.bar.system.audio.muted)
          value: root.bar.system.audio.percent
          onMoved: value => root.bar.system.audio.setPercent(value)
          onDragStarted: root.bar.islandState.dragStart()
          onDragEnded: root.bar.islandState.dragEnd()
        }
      }
    }

    Layer {
      layerId: "mixer"

      MixerView {
        bar: root.bar
      }
    }

    Layer {
      layerId: "display"

      DisplayView {
        bar: root.bar
      }
    }

    Layer {
      layerId: "battery"

      BatteryView {
        bar: root.bar
      }
    }

    Layer {
      layerId: "brightness"

      LevelRow {
        glyph: "sun"
        value: root.bar.system.brightness.percent
        onMoved: value => root.bar.system.brightness.setPercent(value)
        onDragStarted: root.bar.islandState.dragStart()
        onDragEnded: root.bar.islandState.dragEnd()
      }
    }

    Layer {
      layerId: "osd"

      LevelRow {
        glyph: root.bar.osd.glyph
        value: root.bar.osd.percent
        message: root.bar.osd.text
        interactive: false
      }
    }

    Layer {
      layerId: "quick"

      ColumnLayout {
        spacing: 0

        ControlsRow {
          Layout.fillWidth: true
          bar: root.bar
        }

        PowerRow {
          Layout.fillWidth: true
          bar: root.bar
        }

        Item {
          Layout.fillHeight: true
        }
      }
    }

    Layer {
      layerId: "wifi"

      WifiView {
        bar: root.bar
      }
    }

    Layer {
      layerId: "bt"

      BtView {
        bar: root.bar
      }
    }
  }

  // Linha de acento 36×2 no topo central, visível fora de `compact`.
  Rectangle {
    anchors.top: parent.top
    anchors.horizontalCenter: parent.horizontalCenter
    width: 36
    height: 2
    bottomLeftRadius: 2
    bottomRightRadius: 2
    color: Tokens.accent
    opacity: root.displayMode === "compact" ? 0 : 1

    Behavior on opacity {
      NumberAnimation {
        duration: Tokens.chromeMs
      }
    }
  }
}
