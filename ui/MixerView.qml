pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/mixer.mjs" as MixerCore
import "../core/osd.mjs" as OsdCore

// Modo `mixer` (specs/08 "Modo `mixer`"; design v4): volume geral, saídas,
// apps e microfone. Padding 12px 12px 10px; acima de 560px a lista rola.
Flickable {
  id: view

  required property var bar
  readonly property var audio: bar.system.audio
  readonly property var current: MixerCore.outputDevice(nodeInfo(audio.defaultSink), I18n.language)

  contentHeight: column.implicitHeight + 22
  boundsBehavior: Flickable.StopAtBounds
  clip: true

  function nodeInfo(node) {
    if (!node) return {};
    return { name: String(node.name || ""), description: String(node.description || ""), nickname: String(node.nickname || "") };
  }

  function streamInfo(node) {
    // `properties` só vale depois do nó vincular (o tracker do AudioSource).
    const props = node && node.ready && node.properties ? node.properties : {};
    return {
      appName: props["application.name"] || "",
      binary: props["application.process.binary"] || "",
      mediaName: props["media.name"] || "",
      description: String(node ? node.description || "" : "")
    };
  }

  ColumnLayout {
    id: column

    x: 12
    y: 12
    width: view.width - 24
    spacing: 0

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 26
      Layout.leftMargin: 6
      Layout.rightMargin: 6
      Layout.bottomMargin: 8
      spacing: 8

      PhIcon {
        glyph: "sliders-horizontal"
        size: 14
        color: Tokens.neutral300
      }

      IslandText {
        Layout.fillWidth: true
        text: I18n.tr("Volume")
      }

      PhIcon {
        glyph: view.current.glyph
        size: 12
        color: Tokens.neutral500
      }

      IslandText {
        text: view.current.label
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
      }
    }

    // Volume geral: 42px, raio 14, `neutral-900`, padding 0 12px 0 6px.
    Rectangle {
      Layout.fillWidth: true
      implicitHeight: 42
      radius: 14
      color: Tokens.neutral900

      RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 6
        anchors.rightMargin: 12
        spacing: 10

        MuteButton {
          implicitWidth: 30
          implicitHeight: 30
          iconSize: 16
          glyph: OsdCore.volumeGlyph(view.audio.percent, view.audio.muted)
          muted: view.audio.muted
          restingIconColor: Tokens.text
          onClicked: view.audio.toggleMute(view.audio.sink)
        }

        IslandSlider {
          Layout.fillWidth: true
          value: view.audio.muted ? 0 : view.audio.percent
          glow: true
          onMoved: value => view.audio.setPercent(value)
        }

        IslandText {
          Layout.preferredWidth: 38
          horizontalAlignment: Text.AlignRight
          text: view.audio.muted ? I18n.tr("Muted") : view.audio.percent + "%"
          px: 12
          font.weight: Tokens.weightBody
          color: Tokens.neutral300
        }
      }
    }

    SectionLabel {
      text: I18n.tr("Output")
    }

    Repeater {
      model: view.audio.outputs

      ListRow {
        id: output

        required property var modelData
        readonly property var look: MixerCore.outputDevice(view.nodeInfo(modelData), I18n.language)

        Layout.fillWidth: true
        implicitHeight: 36
        active: modelData === view.audio.defaultSink
        onClicked: view.audio.setDefaultSink(modelData)

        RowLayout {
          anchors.fill: parent
          spacing: 10

          PhIcon {
            glyph: output.look.glyph
            color: output.active ? Tokens.accent : Tokens.neutral300
          }

          IslandText {
            text: output.look.label
            px: 12.5
            font.weight: Tokens.weightBody
            elide: Text.ElideRight
            Layout.maximumWidth: 240
          }

          IslandText {
            Layout.fillWidth: true
            text: output.look.sub
            px: 11
            font.weight: Tokens.weightBody
            color: Tokens.neutral500
          }

          PhIcon {
            glyph: "check-bold"
            size: 13
            color: Tokens.accent300
            opacity: output.active ? 1 : 0
          }
        }
      }
    }

    SectionLabel {
      visible: view.audio.streams.length > 0
      text: I18n.tr("Apps")
    }

    Repeater {
      model: view.audio.streams

      MixerLevelRow {
        id: app

        required property var modelData
        readonly property var look: MixerCore.streamApp(view.streamInfo(modelData), I18n.language)

        Layout.fillWidth: true
        // Com o volume geral no mudo, os apps esmaecem (design: opacidade .45).
        opacity: view.audio.muted ? 0.45 : 1
        node: modelData
        label: look.label
        sub: look.sub
        glyph: look.glyph
        onMoved: value => view.audio.setNodePercent(modelData, value)
        onMuteToggled: view.audio.toggleMute(modelData)
      }
    }

    SectionLabel {
      visible: view.audio.micAvailable
      text: I18n.tr("Input")
    }

    MixerLevelRow {
      id: mic

      Layout.fillWidth: true
      visible: view.audio.micAvailable
      node: view.audio.source
      label: I18n.tr("Microphone")
      sub: mic.muted ? I18n.tr("Silenced") : MixerCore.outputDevice(view.nodeInfo(view.audio.source), I18n.language).label
      glyph: mic.muted ? "microphone-slash-fill" : "microphone-fill"
      muteGlyph: "microphone-slash-fill"
      unmuteGlyph: "microphone"
      onMoved: value => view.audio.setNodePercent(view.audio.source, value)
      onMuteToggled: view.audio.toggleMute(view.audio.source)
    }
  }

  // 10.5px maiúsculo, `letter-spacing .06em`, `neutral-500`, padding 12px 8px 4px.
  component SectionLabel: IslandText {
    Layout.fillWidth: true
    Layout.preferredHeight: 29
    topPadding: 12
    bottomPadding: 4
    leftPadding: 8
    px: 10.5
    font.capitalization: Font.AllUppercase
    font.letterSpacing: 0.63
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
  }
}
