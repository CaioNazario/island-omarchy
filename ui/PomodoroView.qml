pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/pomodoro.mjs" as PomodoroCore
import "../core/pomodoroConfig.mjs" as ConfigCore

// Modo `pomodoro` da ilha (specs/20-pomodoro.md "Modo da ilha"): o card do
// protótipo v7. Cabeçalho com etapa e posição no ciclo, relógio e controles,
// barra de progresso e, abaixo, a lista de configurações que a engrenagem
// abre. O motor e a configuração vivem no `PomodoroSource` do Service.
Item {
  id: view

  required property var bar
  readonly property var pomodoro: bar.service ? bar.service.pomodoro : null
  readonly property var config: pomodoro ? pomodoro.applied : ConfigCore.defaultPomodoroConfig()
  readonly property var snapshot: pomodoro ? pomodoro.current : PomodoroCore.initialPomodoro(config, Date.now())
  readonly property bool settingsOpen: bar.pomodoroSettingsOpen
  readonly property color accent: snapshot.phase === "focus" ? Tokens.pomodoroFocus : Tokens.pomodoroBreak
  // Relógio da tela: o motor conta por horário, aqui só se repinta.
  property real now: Date.now()
  readonly property real remaining: PomodoroCore.remainingAt(snapshot, now)

  onSnapshotChanged: now = Date.now()

  // Atalhos do protótipo (spec 02): a ilha já tem o teclado enquanto o modo está aberto.
  Shortcut {
    sequence: "Space"
    enabled: view.pomodoro !== null
    onActivated: view.pomodoro.toggle()
  }
  Shortcut {
    sequence: "R"
    enabled: view.pomodoro !== null
    onActivated: view.pomodoro.restart()
  }
  Shortcut {
    sequence: "S"
    enabled: view.pomodoro !== null
    onActivated: view.pomodoro.skip()
  }
  Shortcut {
    sequence: "M"
    onActivated: view.bar.togglePomodoroSettings()
  }

  Timer {
    interval: 250
    repeat: true
    running: view.pomodoro !== null && view.pomodoro.running
    onTriggered: view.now = Date.now()
  }

  ColumnLayout {
    id: card

    anchors.top: parent.top
    anchors.left: parent.left
    anchors.right: parent.right
    anchors.topMargin: 14
    anchors.leftMargin: 17
    anchors.rightMargin: 17
    spacing: 0

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 20

      IslandText {
        Layout.fillWidth: true
        text: PomodoroCore.cycleLabel(view.snapshot, view.config, I18n.language)
        px: 12.5
        font.weight: Tokens.weightBody
        color: Tokens.neutral400
      }

      // Engrenagem: gira 60° ao abrir as configurações.
      Rectangle {
        id: gear

        Layout.preferredWidth: 20
        Layout.preferredHeight: 20
        radius: 10
        color: view.settingsOpen ? Qt.alpha(Tokens.text, 0.18) : gearPointer.containsMouse ? Qt.alpha(Tokens.text, 0.16) : Qt.alpha(Tokens.text, 0.08)
        Accessible.role: Accessible.Button
        Accessible.name: I18n.tr("Settings")

        Behavior on color {
          ColorAnimation {
            duration: 160
          }
        }

        PhIcon {
          anchors.centerIn: parent
          glyph: "gear-six"
          size: 12
          color: view.settingsOpen || gearPointer.containsMouse ? Tokens.text : Tokens.neutral300
          rotation: view.settingsOpen ? 60 : 0

          Behavior on rotation {
            NumberAnimation {
              duration: 300
              easing.type: Easing.OutCubic
            }
          }
        }

        MouseArea {
          id: gearPointer

          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: view.bar.togglePomodoroSettings()
        }
      }
    }

    RowLayout {
      Layout.fillWidth: true
      Layout.topMargin: 10
      Layout.preferredHeight: 44
      spacing: 14

      PomodoroClock {
        text: PomodoroCore.formatRemaining(view.remaining)
        px: 44
        weight: Font.ExtraLight
        color: "#ffffff"
      }

      Item {
        Layout.fillWidth: true
      }

      RowLayout {
        spacing: 6

        PomodoroRoundButton {
          glyph: "arrow-counter-clockwise"
          label: I18n.tr("Restart")
          onClicked: view.pomodoro.restart()
        }

        PomodoroRoundButton {
          glyph: "skip-forward-fill"
          iconSize: 12
          label: PomodoroCore.skipLabel(view.snapshot, I18n.language)
          onClicked: view.pomodoro.skip()
        }

        PomodoroRoundButton {
          glyph: view.snapshot.endsAt !== null ? "pause-fill" : "play-fill"
          diameter: 44
          iconSize: 15
          primary: true
          accent: view.accent
          label: view.snapshot.endsAt !== null ? I18n.tr("Pause") : I18n.tr("Start")
          onClicked: view.pomodoro.toggle()
        }
      }
    }

    // Trilho rebaixado de 5px com o progresso na cor da etapa.
    Rectangle {
      Layout.fillWidth: true
      Layout.topMargin: 16
      Layout.preferredHeight: 5
      radius: 3
      color: Qt.alpha("#000000", 0.35)

      Rectangle {
        width: parent.width * PomodoroCore.elapsedFraction(view.snapshot, view.config, view.now)
        height: parent.height
        radius: 3
        color: view.accent

        Behavior on width {
          NumberAnimation {
            duration: 250
          }
        }
      }
    }
  }

  // Configurações: abrem para baixo com a ilha, a lista rola por dentro.
  Item {
    id: panel

    anchors.top: card.bottom
    anchors.topMargin: 17
    anchors.left: parent.left
    anchors.leftMargin: 5
    anchors.right: parent.right
    anchors.rightMargin: 5
    anchors.bottom: parent.bottom
    anchors.bottomMargin: 8
    opacity: view.settingsOpen ? 1 : 0
    visible: opacity > 0

    Behavior on opacity {
      NumberAnimation {
        duration: 200
      }
    }

    Rectangle {
      id: divider

      anchors.top: parent.top
      anchors.left: parent.left
      anchors.right: parent.right
      anchors.leftMargin: 12
      anchors.rightMargin: 12
      height: 1
      color: Qt.alpha(Tokens.text, 0.07)
    }

    Loader {
      anchors.top: divider.bottom
      anchors.topMargin: 6
      anchors.left: parent.left
      anchors.right: parent.right
      anchors.bottom: parent.bottom
      // Só existe com o painel aberto: a lista tem muitos itens (24 sessões).
      active: view.settingsOpen && view.pomodoro !== null

      sourceComponent: PomodoroSettings {
        pomodoro: view.pomodoro
        session: view.snapshot.session
        // A ilha acompanha o conteúdo da lista, até o teto (`pomodoroPanelHeight`).
        onContentHeightChanged: view.bar.pomodoroListHeight = contentHeight
        Component.onCompleted: view.bar.pomodoroListHeight = contentHeight
        onPickRequested: view.bar.pomodoroPickWallpaper()
        onTestRequested: view.bar.pomodoroTestBreak()
      }
    }
  }
}
