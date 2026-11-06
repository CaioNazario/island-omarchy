pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import Quickshell.Widgets
import "../core/pomodoroConfig.mjs" as ConfigCore
import "../core/pomodoroWallpapers.mjs" as WallpaperCore

// Seção "Wallpaper da pausa" (specs/20 "Wallpaper da pausa"): grade de seis
// colunas com os presets, a imagem própria e o "+" que abre o seletor de
// arquivos. "Testar pausa" mostra a tela de pausa sem mexer no ciclo.
ColumnLayout {
  id: section

  required property var pomodoro
  // Fecha a ilha antes de abrir o seletor: o diálogo precisa do teclado.
  signal pickRequested
  signal testRequested

  readonly property var config: pomodoro.config
  // Presets, mais a imagem própria quando há uma guardada.
  readonly property var choices: {
    const presets = WallpaperCore.WALLPAPER_PRESETS.map(preset => preset.id);
    return config.wallpaperPath !== "" ? presets.concat(["custom"]) : presets;
  }

  spacing: 0

  PomodoroSectionTitle {
    Layout.fillWidth: true
    text: I18n.tr("Break wallpaper")

    Rectangle {
      id: testLink

      implicitWidth: testLabel.implicitWidth
      implicitHeight: testLabel.implicitHeight
      color: "transparent"

      IslandText {
        id: testLabel

        text: I18n.tr("Test break")
        px: 11.5
        font.weight: Tokens.weightBody
        color: testPointer.containsMouse ? Tokens.neutral100 : Tokens.neutral400
      }

      MouseArea {
        id: testPointer

        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: section.testRequested()
      }
    }
  }

  GridLayout {
    Layout.fillWidth: true
    Layout.leftMargin: 12
    Layout.rightMargin: 12
    Layout.topMargin: 2
    Layout.bottomMargin: 10
    columns: 6
    columnSpacing: 6
    rowSpacing: 6

    Repeater {
      model: section.choices

      ClippingRectangle {
        id: thumb

        required property string modelData
        readonly property bool picked: section.config.wallpaper === modelData

        Layout.fillWidth: true
        Layout.preferredHeight: width
        radius: 14
        color: Tokens.neutral900
        // `ClippingRectangle.border.width` é inteiro: 2px no lugar dos 1.5px do protótipo.
        border.width: 2
        border.color: picked ? Qt.alpha(Tokens.text, 0.75) : Qt.alpha(Tokens.text, 0.06)
        Accessible.role: Accessible.RadioButton
        Accessible.name: WallpaperCore.wallpaperName(modelData, I18n.language)
        Accessible.checked: picked

        PomodoroWallpaper {
          anchors.fill: parent
          wallpaperId: thumb.modelData
          customPath: section.config.wallpaperPath
        }

        MouseArea {
          anchors.fill: parent
          cursorShape: Qt.PointingHandCursor
          onClicked: section.pomodoro.setConfig(ConfigCore.withWallpaper(section.config, thumb.modelData, section.config.wallpaperPath))
        }
      }
    }

    // Último item: tracejado, abre o seletor de arquivos.
    Rectangle {
      id: addTile

      Layout.fillWidth: true
      Layout.preferredHeight: width
      radius: 14
      color: "transparent"
      border.width: 1
      border.color: addPointer.containsMouse ? Qt.alpha(Tokens.text, 0.4) : Qt.alpha(Tokens.text, 0.18)
      Accessible.role: Accessible.Button
      Accessible.name: I18n.tr("Use an image")

      IslandText {
        anchors.centerIn: parent
        text: "+"
        px: 16
        font.weight: Font.Light
        color: addPointer.containsMouse ? Tokens.neutral100 : Tokens.neutral400
      }

      MouseArea {
        id: addPointer

        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: section.pickRequested()
      }
    }
  }
}
