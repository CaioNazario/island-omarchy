pragma ComponentBehavior: Bound

import QtQuick
import "../core/pomodoro.mjs" as PomodoroCore
import "../core/pomodoroConfig.mjs" as ConfigCore

// Widget `pomodoro` da barra (specs/20-pomodoro.md "Widget da barra"), em dois
// estilos que a configuração `barControls` escolhe:
//
//  - pílula compacta (protótipo minimizado): ponto de status na cor da etapa,
//    `mm:ss` e uma mini barra de progresso; o clique abre o card na ilha;
//  - com controles (card do protótipo adaptado aos 22px da pílula): grip,
//    `Foco · 1/4`, relógio, Reiniciar, Pular, Iniciar/Pausar, engrenagem (abre
//    as configurações na ilha) e minimizar (volta à pílula compacta).
//
// Sem espaço, o estilo com controles cai para a pílula compacta e esta, para o
// ponto (specs/16 "Quando não cabe").
WidgetFrame {
  id: widget

  // `PomodoroSource` do Service; nulo enquanto a barra não achou o serviço.
  required property var source
  // O `WidgetSlot` liga quando a área deu menos que a largura natural.
  property bool compact: false

  signal openRequested
  signal settingsRequested

  readonly property var config: source ? source.applied : ConfigCore.defaultPomodoroConfig()
  readonly property var snapshot: source ? source.current : PomodoroCore.initialPomodoro(config, Date.now())
  readonly property bool running: snapshot.endsAt !== null
  readonly property bool controls: source ? source.config.barControls : false
  readonly property bool showControls: controls && !compact
  readonly property color accent: snapshot.phase === "focus" ? Tokens.pomodoroFocus : Tokens.pomodoroBreak
  property real now: Date.now()
  readonly property real fraction: PomodoroCore.elapsedFraction(snapshot, config, now)
  readonly property string clockText: PomodoroCore.formatRemaining(PomodoroCore.remainingAt(snapshot, now))

  // A largura natural não depende de `compact` (senão o encaixe da área
  // oscilaria): vem das linhas, que existem sempre. O que sobra, colapsado, é
  // a pílula compacta (com controles) ou só o ponto (já compacta).
  readonly property real fullWidth: (controls ? controlsRow.implicitWidth : pillRow.implicitWidth) + 18
  readonly property real compactWidth: controls ? pillRow.implicitWidth + 18 : 9 + dot.width + 9

  clickable: !showControls && source !== null
  onClicked: openRequested()
  onSnapshotChanged: now = Date.now()

  // Relógio de 1s só com o widget visível e o Pomodoro rodando.
  Timer {
    interval: 1000
    repeat: true
    running: widget.running && widget.visible
    onTriggered: widget.now = Date.now()
  }

  // Pílula compacta.
  Row {
    id: pillRow

    visible: !widget.showControls
    height: 22
    spacing: 6

    // `breathe` do protótipo: 0.45 → 0.9 → 0.45 em 3.4s, só rodando.
    Rectangle {
      id: dot

      anchors.verticalCenter: parent.verticalCenter
      width: 7
      height: 7
      radius: 3.5
      color: widget.accent
      // Parado, o ponto fica fixo e mais apagado.
      opacity: widget.running ? pulse : 0.55

      property real pulse: 0.9

      SequentialAnimation on pulse {
        running: widget.running && widget.visible
        loops: Animation.Infinite

        NumberAnimation {
          to: 0.45
          duration: 1700
          easing.type: Easing.InOutSine
        }
        NumberAnimation {
          to: 0.9
          duration: 1700
          easing.type: Easing.InOutSine
        }
      }
    }

    PomodoroClock {
      anchors.verticalCenter: parent.verticalCenter
      opacity: widget.compact ? 0 : 1
      text: widget.clockText
      px: 13
      weight: Font.Medium
    }

    Rectangle {
      anchors.verticalCenter: parent.verticalCenter
      opacity: widget.compact ? 0 : 1
      width: 26
      height: 3
      radius: 2
      color: Qt.alpha(Tokens.text, 0.14)

      Rectangle {
        width: parent.width * widget.fraction
        height: parent.height
        radius: 2
        color: widget.accent
      }
    }
  }

  // Com controles.
  Row {
    id: controlsRow

    visible: widget.showControls
    height: 22
    spacing: 6

    // Grip do protótipo: só desenho, a barra não arrasta.
    Grid {
      anchors.verticalCenter: parent.verticalCenter
      columns: 2
      spacing: 2
      opacity: 0.55

      Repeater {
        model: 6

        Rectangle {
          width: 2
          height: 2
          radius: 1
          color: Tokens.neutral400
        }
      }
    }

    // Etapa, relógio e progresso: clicar abre o card na ilha.
    Item {
      anchors.verticalCenter: parent.verticalCenter
      width: info.implicitWidth
      height: 22

      Row {
        id: info

        anchors.verticalCenter: parent.verticalCenter
        spacing: 6

        IslandText {
          anchors.verticalCenter: parent.verticalCenter
          text: PomodoroCore.cycleLabel(widget.snapshot, widget.config, I18n.language)
          px: 11.5
          font.weight: Tokens.weightBody
          color: Tokens.neutral400
        }

        PomodoroClock {
          anchors.verticalCenter: parent.verticalCenter
          text: widget.clockText
          px: 15
          weight: Font.Light
          color: "#ffffff"
        }

        Rectangle {
          anchors.verticalCenter: parent.verticalCenter
          width: 28
          height: 3
          radius: 2
          color: Qt.alpha(Tokens.text, 0.14)

          Rectangle {
            width: parent.width * widget.fraction
            height: parent.height
            radius: 2
            color: widget.accent
          }
        }
      }

      MouseArea {
        anchors.fill: parent
        cursorShape: Qt.PointingHandCursor
        onClicked: widget.openRequested()
      }
    }

    Row {
      anchors.verticalCenter: parent.verticalCenter
      spacing: 4

      PomodoroRoundButton {
        anchors.verticalCenter: parent.verticalCenter
        glyph: "arrow-counter-clockwise"
        label: I18n.tr("Restart")
        diameter: 18
        iconSize: 10
        onClicked: widget.source.restart()
      }

      PomodoroRoundButton {
        anchors.verticalCenter: parent.verticalCenter
        glyph: "skip-forward-fill"
        label: PomodoroCore.skipLabel(widget.snapshot, I18n.language)
        diameter: 18
        iconSize: 10
        onClicked: widget.source.skip()
      }

      PomodoroRoundButton {
        anchors.verticalCenter: parent.verticalCenter
        glyph: widget.running ? "pause-fill" : "play-fill"
        label: widget.running ? I18n.tr("Pause") : I18n.tr("Start")
        diameter: 22
        iconSize: 11
        primary: true
        glow: false
        accent: widget.accent
        onClicked: widget.source.toggle()
      }
    }

    Row {
      anchors.verticalCenter: parent.verticalCenter
      spacing: 4

      component MiniButton: Rectangle {
        id: mini

        required property string label

        signal clicked

        width: 16
        height: 16
        radius: 8
        color: miniPointer.containsMouse ? Qt.alpha(Tokens.text, 0.16) : Qt.alpha(Tokens.text, 0.08)
        Accessible.role: Accessible.Button
        Accessible.name: label

        MouseArea {
          id: miniPointer

          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: mini.clicked()
        }
      }

      MiniButton {
        label: I18n.tr("Settings")
        onClicked: widget.settingsRequested()

        PhIcon {
          anchors.centerIn: parent
          glyph: "gear-six"
          size: 10
          color: Tokens.neutral300
        }
      }

      // Minimizar: o traço do protótipo, de volta à pílula compacta.
      MiniButton {
        label: I18n.tr("Minimize")
        onClicked: widget.source.setConfig(ConfigCore.withBarControls(widget.source.config, false))

        Rectangle {
          anchors.centerIn: parent
          width: 7
          height: 1.5
          radius: 1
          color: Tokens.neutral300
        }
      }
    }
  }
}
