pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Modo `music` (specs/05-musica.md, 500×58): padding 0 14px 0 9px, gap 12px:
// capa redonda 40 · artista/título/progresso · controles 30/34 · ícone da
// fonte 19px `accent-400`.
Item {
  id: row

  required property var bar
  readonly property var music: bar.system.music

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 9
    anchors.rightMargin: 14
    spacing: 12

    AlbumArt {
      implicitWidth: 40
      implicitHeight: 40
      radius: 20
      glyphSize: 18
      url: row.music.artUrl
    }

    ColumnLayout {
      Layout.fillWidth: true
      spacing: 0

      IslandText {
        Layout.fillWidth: true
        text: row.music.artist
        elide: Text.ElideRight
      }

      IslandText {
        Layout.fillWidth: true
        text: row.music.title
        px: 12
        font.weight: Tokens.weightBody
        color: Tokens.neutral400
        elide: Text.ElideRight
      }

      MusicProgress {
        Layout.fillWidth: true
        Layout.topMargin: 3
        music: row.music
      }
    }

    MusicControls {
      music: row.music
      small: 30
      big: 34
      // Qualquer controle rearma o timer do modo.
      onUsed: row.bar.islandState.keepAlive()
    }

    PhIcon {
      glyph: row.music.sourceGlyph
      size: 19
      color: Tokens.accent400
    }
  }
}
