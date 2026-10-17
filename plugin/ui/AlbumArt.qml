pragma ComponentBehavior: Bound

import QtQuick
import Quickshell.Widgets

// Capa (specs/05-musica.md): recortada no raio; sem capa, bloco `accent-900`
// com `ph-fill ph-music-note` `accent-300`. `file://` e `http(s)://` carregam
// direto pela `Image` (rede pelo QNetworkAccessManager), sem cache próprio.
ClippingRectangle {
  id: art

  required property string url
  property int glyphSize: 24

  radius: 12
  color: Tokens.accent900

  PhIcon {
    anchors.centerIn: parent
    visible: cover.status !== Image.Ready
    glyph: "music-note-fill"
    size: art.glyphSize
    color: Tokens.accent300
  }

  Image {
    id: cover

    anchors.fill: parent
    source: art.url
    fillMode: Image.PreserveAspectCrop
    asynchronous: true
    visible: status === Image.Ready
  }
}
