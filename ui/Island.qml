pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/island.mjs" as IslandCore
import "../core/osd.mjs" as OsdCore

// Ilha central (specs/03-ilha.md). Só renderiza: o estado é o `IslandState`
// do core, dono do Bar.qml. Fundo, anel e corte do conteúdo (`overflow:
// hidden` no design) ficam na `surface`; cada modo é uma `ModeLayer`.
Item {
  id: island

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
    enabled: island.displayMode === "compact" || island.displayMode === "notif"
    cursorShape: Qt.PointingHandCursor
    onClicked: island.clicked()
  }

  HoverHandler {
    onHoveredChanged: island.bar.islandHovered(hovered)
  }

  Rectangle {
    id: surface

    anchors.fill: parent
    radius: island.size.radius
    color: Tokens.bg
    border.width: 1
    border.color: Tokens.neutral800
    clip: true

    // "Raio: 460ms ease" (specs/03-ilha.md "Animação").
    Behavior on radius {
      NumberAnimation {
        duration: Tokens.springMs
        easing.type: Easing.InOutQuad
      }
    }

    component Layer: ModeLayer {
      anchors.top: parent.top
      anchors.horizontalCenter: parent.horizontalCenter
      // Cada camada tem o tamanho do seu modo, dentro do anel de 1px.
      width: island.sizeOf(layerId).width - 2
      height: island.sizeOf(layerId).height - 2
      anchors.topMargin: 1
      shownLayer: island.shownLayer
      instant: island.instantSwitch
    }

    Layer {
      layerId: "compact"

      // O Loader da camada estica o filho direto: o Item recebe o tamanho e
      // o conteúdo fica centralizado nele.
      Item {
        CompactContent {
          anchors.centerIn: parent
          weather: island.bar.system.weather
        }
      }
    }

    Layer {
      layerId: "notif"

      NotificationCard {
        entry: island.bar.notifEntry || ({ name: "", text: "", timeMs: 0, glyph: "bell-fill", appIcon: "" })
        nowMs: island.bar.nowMs
        // × fecha a ilha; a notificação continua na lista.
        onClosed: island.bar.closeAll()
      }
    }

    Layer {
      layerId: "stack"

      StackView {
        bar: island.bar
      }
    }

    Layer {
      layerId: "music"

      MusicRow {
        bar: island.bar
      }
    }

    Layer {
      layerId: "calendar"

      CalendarModeView {
        bar: island.bar
      }
    }

    Layer {
      layerId: "card"

      Item {
        CenterCard {
          width: parent.width
          bar: island.bar
          onImplicitHeightChanged: island.cardHeight = implicitHeight
          Component.onCompleted: island.cardHeight = implicitHeight
        }
      }
    }

    Layer {
      layerId: "env"

      EnvRow {
        bar: island.bar
      }
    }

    Layer {
      layerId: "note"

      NoteView {
        bar: island.bar
      }
    }

    Layer {
      layerId: "ai"

      AiView {
        bar: island.bar
      }
    }

    Layer {
      layerId: "volume"

      LevelRow {
        glyph: OsdCore.volumeGlyph(island.bar.system.audio.percent, island.bar.system.audio.muted)
        value: island.bar.system.audio.percent
        onMoved: value => island.bar.system.audio.setPercent(value)
        onDragStarted: island.bar.islandState.dragStart()
        onDragEnded: island.bar.islandState.dragEnd()
      }
    }

    Layer {
      layerId: "brightness"

      LevelRow {
        glyph: "sun"
        value: island.bar.system.brightness.percent
        onMoved: value => island.bar.system.brightness.setPercent(value)
        onDragStarted: island.bar.islandState.dragStart()
        onDragEnded: island.bar.islandState.dragEnd()
      }
    }

    Layer {
      layerId: "osd"

      LevelRow {
        glyph: island.bar.osd.glyph
        value: island.bar.osd.percent
        message: island.bar.osd.text
        interactive: false
      }
    }

    Layer {
      layerId: "quick"

      ColumnLayout {
        spacing: 0

        ControlsRow {
          Layout.fillWidth: true
          bar: island.bar
        }

        PowerRow {
          Layout.fillWidth: true
          bar: island.bar
        }

        Item {
          Layout.fillHeight: true
        }
      }
    }

    Layer {
      layerId: "wifi"

      WifiView {
        bar: island.bar
      }
    }

    Layer {
      layerId: "bt"

      BtView {
        bar: island.bar
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
    opacity: island.displayMode === "compact" ? 0 : 1

    Behavior on opacity {
      NumberAnimation {
        duration: Tokens.chromeMs
      }
    }
  }
}
