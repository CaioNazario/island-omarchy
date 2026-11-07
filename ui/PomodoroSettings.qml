pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Lista de configurações do Pomodoro (specs/20 "Painel de configurações"):
// rola por dentro, com a barra oculta, e junta as seções.
Flickable {
  id: settings

  required property var pomodoro
  required property int session

  signal pickRequested
  signal testRequested

  contentWidth: width
  contentHeight: column.implicitHeight + 6
  clip: true
  boundsBehavior: Flickable.StopAtBounds
  flickableDirection: Flickable.VerticalFlick

  ColumnLayout {
    id: column

    width: settings.width
    spacing: 0

    PomodoroSessionsSettings {
      Layout.fillWidth: true
      pomodoro: settings.pomodoro
      session: settings.session
    }

    Rectangle {
      Layout.fillWidth: true
      Layout.leftMargin: 10
      Layout.rightMargin: 10
      Layout.topMargin: 7
      Layout.bottomMargin: 7
      implicitHeight: 1
      color: Qt.alpha(Tokens.text, 0.08)
    }

    PomodoroSoundSettings {
      Layout.fillWidth: true
      pomodoro: settings.pomodoro
    }

    Rectangle {
      Layout.fillWidth: true
      Layout.leftMargin: 10
      Layout.rightMargin: 10
      Layout.topMargin: 7
      Layout.bottomMargin: 7
      implicitHeight: 1
      color: Qt.alpha(Tokens.text, 0.08)
    }

    PomodoroWallpaperSettings {
      Layout.fillWidth: true
      pomodoro: settings.pomodoro
      onPickRequested: settings.pickRequested()
      onTestRequested: settings.testRequested()
    }
  }
}
