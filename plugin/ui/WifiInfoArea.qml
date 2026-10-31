pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/wifiPanel.mjs" as PanelCore

// Área de 80px abaixo do cabeçalho do `wifi` (specs/08 "Modo `wifi`"; design
// v5): estatísticas da conexão, QR para compartilhar ou teste de velocidade,
// conforme `bar.wifiView`.
Item {
  id: area

  required property var bar
  readonly property var details: bar.system.wifiDetails
  readonly property var share: bar.system.wifiShare
  readonly property var speed: bar.system.speedTest

  implicitHeight: 80

  // Estatísticas: duas colunas (gap 28) de linhas de 20px.
  GridLayout {
    anchors.fill: parent
    visible: area.bar.wifiView === "stats"
    columns: 2
    columnSpacing: 28
    rowSpacing: 0

    Repeater {
      model: area.details.stats

      RowLayout {
        id: stat

        required property var modelData

        Layout.fillWidth: true
        Layout.preferredWidth: 1
        Layout.preferredHeight: 20
        spacing: 8

        IslandText {
          Layout.fillWidth: true
          text: I18n.tr(stat.modelData.label)
          px: 12
          font.weight: Tokens.weightBody
          color: Tokens.neutral500
        }

        IslandText {
          text: stat.modelData.value
          px: 12
          font.weight: Tokens.weightBody
          color: Tokens.neutral200
        }
      }
    }
  }

  RowLayout {
    anchors.fill: parent
    visible: area.bar.wifiView === "qr"
    spacing: 14

    // Matriz já com a margem branca do `qrencode`: só os módulos escuros são pintados.
    Rectangle {
      implicitWidth: 80
      implicitHeight: 80
      radius: 8
      color: Tokens.neutral100

      Canvas {
        id: qrCanvas

        anchors.fill: parent
        anchors.margins: 2
        visible: area.share.qr.rows.length > 0
        onPaint: {
          const ctx = getContext("2d");
          const rows = area.share.qr.rows;
          ctx.reset();
          if (rows.length === 0) return;
          const cell = width / rows.length;
          ctx.fillStyle = Tokens.bg;
          rows.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
              if (row[x] === "1") ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
            }
          });
        }

        Connections {
          target: area.share
          function onQrChanged() {
            qrCanvas.requestPaint();
          }
        }
      }
    }

    ColumnLayout {
      Layout.fillWidth: true
      spacing: 6

      IslandText {
        Layout.fillWidth: true
        text: area.share.error !== "" ? area.share.error : I18n.tr("Share {ssid}", { ssid: area.share.qr.ssid })
        px: area.share.error !== "" ? 12 : 13
        elide: Text.ElideRight
      }

      Rectangle {
        Layout.fillWidth: true
        visible: area.share.error === ""
        implicitHeight: 26
        radius: 8
        color: Tokens.neutral900

        RowLayout {
          anchors.fill: parent
          anchors.leftMargin: 10
          anchors.rightMargin: 4
          spacing: 6

          PhIcon {
            glyph: "key"
            size: 13
            color: Tokens.neutral400
          }

          IslandText {
            Layout.fillWidth: true
            text: !area.share.qr.secured ? I18n.tr("Open network · no password")
              : area.share.revealed && area.share.password !== "" ? area.share.password : "••••••••••"
            px: 12
            font.weight: Tokens.weightBody
            color: Tokens.neutral200
            elide: Text.ElideRight
          }

          SmallButton {
            visible: area.share.qr.secured
            glyph: area.share.revealed ? "eye-slash" : "eye"
            onClicked: area.share.toggleReveal()
          }

          SmallButton {
            visible: area.share.qr.secured
            glyph: area.share.copied ? "check-bold" : "copy"
            restingColor: area.share.copied ? Tokens.accent300 : Tokens.neutral400
            onClicked: area.share.copyPassword()
          }
        }
      }

      IslandText {
        visible: area.share.error === ""
        text: I18n.tr("Point your phone camera here to join the network")
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
      }
    }
  }

  ColumnLayout {
    anchors.fill: parent
    visible: area.bar.wifiView === "speed"
    spacing: 0

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 20
      spacing: 8

      PanelLabel {
        Layout.fillWidth: true
        text: I18n.tr("Speed test")
        value: PanelCore.speedStatus(area.speed.phase, area.details.current ? area.details.current.internetPingMs : null, I18n.language)
      }

      SmallButton {
        implicitWidth: 20
        implicitHeight: 20
        glyph: "arrow-clockwise"
        iconSize: 12
        opacity: area.speed.running ? 0.3 : 1
        onClicked: if (!area.speed.running) area.speed.run()
      }
    }

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 44
      spacing: 28

      SpeedValue {
        glyph: "arrow-down-bold"
        value: area.speed.down
        measuring: area.speed.phase === "down"
      }

      SpeedValue {
        glyph: "arrow-up-bold"
        value: area.speed.up
        measuring: area.speed.phase === "up"
      }
    }

    Rectangle {
      Layout.fillWidth: true
      Layout.topMargin: 6
      implicitHeight: 3
      radius: 2
      color: Tokens.neutral800

      Rectangle {
        width: parent.width * area.speed.progress
        height: parent.height
        radius: 2
        color: Tokens.accent
      }
    }
  }

  // 22×22 redondo, ícone 13px, hover `neutral-800`/`text`.
  component SmallButton: Rectangle {
    id: small

    required property string glyph
    property color restingColor: Tokens.neutral400
    property int iconSize: 13

    signal clicked

    implicitWidth: 22
    implicitHeight: 22
    radius: width / 2
    color: smallPointer.containsMouse ? Tokens.neutral800 : "transparent"

    PhIcon {
      anchors.centerIn: parent
      glyph: small.glyph
      size: small.iconSize
      color: smallPointer.containsMouse ? Tokens.text : small.restingColor
    }

    MouseArea {
      id: smallPointer

      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: small.clicked()
    }
  }

  // Seta 15px (`accent` medindo) · valor 24px/500 · "Mbps" 11px.
  component SpeedValue: RowLayout {
    id: speedValue

    required property string glyph
    required property real value
    required property bool measuring

    Layout.fillWidth: true
    Layout.preferredWidth: 1
    spacing: 8

    PhIcon {
      glyph: speedValue.glyph
      size: 15
      color: speedValue.measuring ? Tokens.accent : Tokens.neutral400
    }

    IslandText {
      text: Math.round(speedValue.value)
      px: 24
      font.letterSpacing: -0.24
      color: speedValue.value > 0 ? Tokens.text : Tokens.neutral600
    }

    IslandText {
      Layout.fillWidth: true
      text: "Mbps"
      px: 11
      font.weight: Tokens.weightBody
      color: Tokens.neutral500
    }
  }
}
