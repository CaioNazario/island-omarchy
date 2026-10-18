pragma ComponentBehavior: Bound

import QtQuick

// Anterior · tocar/pausar · próxima (specs/05-musica.md). `small`/`big` dão o
// tamanho dos botões e `smallIcon`/`bigIcon` dos ícones; hover `neutral-900`.
// Botão desabilitado quando o player não pode ir naquela direção.
Row {
  id: controls

  required property var music
  property int small: 34
  property int big: 38
  property int smallIcon: 17
  property int bigIcon: 22

  signal used

  component Control: Rectangle {
    id: control

    required property string glyph
    required property int iconSize
    property bool enabledControl: true

    signal pressed

    width: height
    radius: height / 2
    anchors.verticalCenter: parent ? parent.verticalCenter : undefined
    color: pointer.containsMouse && enabledControl ? Tokens.neutral900 : "transparent"
    opacity: enabledControl ? 1 : 0.4

    PhIcon {
      anchors.centerIn: parent
      glyph: control.glyph
      size: control.iconSize
      color: Tokens.text
    }

    MouseArea {
      id: pointer

      anchors.fill: parent
      enabled: control.enabledControl
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: control.pressed()
    }
  }

  Control {
    height: controls.small
    glyph: "skip-back-fill"
    iconSize: controls.smallIcon
    enabledControl: controls.music.player !== null && controls.music.player.canGoPrevious
    onPressed: {
      controls.music.previous();
      controls.used();
    }
  }

  Control {
    height: controls.big
    glyph: controls.music.playing ? "pause-fill" : "play-fill"
    iconSize: controls.bigIcon
    onPressed: {
      controls.music.togglePlaying();
      controls.used();
    }
  }

  Control {
    height: controls.small
    glyph: "skip-forward-fill"
    iconSize: controls.smallIcon
    enabledControl: controls.music.player !== null && controls.music.player.canGoNext
    onPressed: {
      controls.music.next();
      controls.used();
    }
  }
}
