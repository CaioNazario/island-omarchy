pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Modo `music` (specs/05-musica.md, 500×82): padding 0 14px, gap 14px: capa
// 56 · artista/título/progresso · controles · ícone da fonte 22px `accent-400`.
Item {
  id: row

  required property var bar
  readonly property var music: bar.system.music

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 14
    anchors.rightMargin: 14
    spacing: 14

    AlbumArt {
      implicitWidth: 56
      implicitHeight: 56
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
        Layout.topMargin: 6
        music: row.music
      }
    }

    MusicControls {
      music: row.music
      // Qualquer controle rearma o timer do modo.
      onUsed: row.bar.islandState.keepAlive()
    }

    PhIcon {
      glyph: row.music.sourceGlyph
      size: 22
      color: Tokens.accent400
    }
  }
}
