pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/pomodoroConfig.mjs" as ConfigCore

// Seção "Sessões" das configurações do Pomodoro (specs/20 "Sessões e
// durações"): quantidade, Global/Individual, durações e início automático.
// Cada toque grava na hora, sem botão Salvar; o motor reage à mudança.
ColumnLayout {
  id: sessions

  required property var pomodoro
  // Sessão atual do ciclo, destacada no modo Individual.
  required property int session

  readonly property var config: pomodoro.config
  readonly property bool individual: config.durationMode === "individual"

  spacing: 0

  function apply(next) {
    pomodoro.setConfig(next);
  }

  function minutes(value) {
    return value + "m";
  }

  PomodoroSectionTitle {
    Layout.fillWidth: true
    text: I18n.tr("Sessions")
  }

  RowLayout {
    Layout.fillWidth: true
    Layout.leftMargin: 12
    Layout.rightMargin: 12
    Layout.topMargin: 4
    Layout.bottomMargin: 4
    spacing: 11

    PhIcon {
      glyph: "clock"
      size: 14
      color: Tokens.neutral300
    }

    IslandText {
      Layout.fillWidth: true
      text: I18n.tr("Sessions per cycle")
      px: 13
      font.weight: Tokens.weightBody
      color: Tokens.neutral200
    }

    PomodoroStepper {
      editable: true
      text: String(sessions.config.cycleLen)
      valueColor: Tokens.neutral200
      decreaseLabel: I18n.tr("Fewer sessions")
      increaseLabel: I18n.tr("More sessions")
      onDecrease: sessions.apply(ConfigCore.withCycleLength(sessions.config, sessions.config.cycleLen - 1))
      onIncrease: sessions.apply(ConfigCore.withCycleLength(sessions.config, sessions.config.cycleLen + 1))
      onCommitted: text => sessions.apply(ConfigCore.withCycleLength(sessions.config, ConfigCore.parseCycleLength(text, sessions.config.cycleLen)))
    }
  }

  PomodoroSegmented {
    Layout.fillWidth: true
    Layout.leftMargin: 12
    Layout.rightMargin: 12
    Layout.topMargin: 4
    Layout.bottomMargin: 8
    current: sessions.config.durationMode
    options: [
      {
        id: "global",
        label: I18n.tr("Global")
      },
      {
        id: "individual",
        label: I18n.tr("Individual")
      }
    ]
    onChosen: id => sessions.apply(ConfigCore.withDurationMode(sessions.config, id))
  }

  // Modo Global: uma duração para todo foco e outra para toda pausa.
  ColumnLayout {
    Layout.fillWidth: true
    visible: !sessions.individual
    spacing: 0

    RowLayout {
      Layout.fillWidth: true
      Layout.leftMargin: 12
      Layout.rightMargin: 12
      Layout.topMargin: 4
      Layout.bottomMargin: 4

      IslandText {
        Layout.fillWidth: true
        text: I18n.tr("All focus sessions")
        px: 13
        font.weight: Tokens.weightBody
        color: Tokens.neutral200
      }

      PomodoroStepper {
        text: I18n.tr("{n} min", {
          n: sessions.config.focusMin
        })
        onDecrease: sessions.apply(ConfigCore.stepGlobalMinutes(sessions.config, "focus", -1))
        onIncrease: sessions.apply(ConfigCore.stepGlobalMinutes(sessions.config, "focus", 1))
      }
    }

    RowLayout {
      Layout.fillWidth: true
      Layout.leftMargin: 12
      Layout.rightMargin: 12
      Layout.topMargin: 4
      Layout.bottomMargin: 4

      IslandText {
        Layout.fillWidth: true
        text: I18n.tr("All breaks")
        px: 13
        font.weight: Tokens.weightBody
        color: Tokens.neutral200
      }

      PomodoroStepper {
        text: I18n.tr("{n} min", {
          n: sessions.config.breakMin
        })
        onDecrease: sessions.apply(ConfigCore.stepGlobalMinutes(sessions.config, "break", -1))
        onIncrease: sessions.apply(ConfigCore.stepGlobalMinutes(sessions.config, "break", 1))
      }
    }
  }

  // Modo Individual: uma linha por sessão, a atual destacada.
  ColumnLayout {
    Layout.fillWidth: true
    Layout.leftMargin: 6
    Layout.rightMargin: 6
    visible: sessions.individual
    spacing: 0

    RowLayout {
      Layout.fillWidth: true
      Layout.leftMargin: 10
      Layout.rightMargin: 10
      Layout.bottomMargin: 6

      IslandText {
        Layout.fillWidth: true
        text: I18n.tr("Session")
        px: 12
        font.weight: Tokens.weightBody
        color: Tokens.neutral600
      }

      IslandText {
        Layout.preferredWidth: 76
        horizontalAlignment: Text.AlignHCenter
        text: I18n.tr("Focus")
        px: 12
        font.weight: Tokens.weightBody
        color: Tokens.neutral600
      }

      IslandText {
        Layout.preferredWidth: 76
        horizontalAlignment: Text.AlignHCenter
        text: I18n.tr("Break")
        px: 12
        font.weight: Tokens.weightBody
        color: Tokens.neutral600
      }
    }

    Repeater {
      model: sessions.config.cycleLen

      Rectangle {
        id: row

        required property int index
        readonly property int number: index + 1
        readonly property bool current: number === sessions.session
        readonly property var plan: sessions.config.plan[index]

        Layout.fillWidth: true
        implicitHeight: 30
        radius: 14
        color: Qt.alpha(Tokens.text, current ? 0.055 : 0.015)

        RowLayout {
          anchors.fill: parent
          anchors.leftMargin: 10
          anchors.rightMargin: 10
          spacing: 8

          Rectangle {
            Layout.preferredWidth: 5
            Layout.preferredHeight: 5
            radius: 3
            color: row.current ? Tokens.pomodoroFocus : Qt.alpha(Tokens.text, 0.18)
          }

          IslandText {
            Layout.fillWidth: true
            text: I18n.tr("Session {n}", {
              n: row.number
            })
            px: 12.5
            font.weight: Tokens.weightBody
            color: Tokens.neutral200
          }

          PomodoroStepper {
            Layout.preferredWidth: 76
            size: 20
            valueWidth: 34
            valuePx: 13
            valueColor: Tokens.neutral100
            text: sessions.minutes(row.plan ? row.plan.focusMin : 0)
            onDecrease: sessions.apply(ConfigCore.stepPlanMinutes(sessions.config, row.number, "focus", -1))
            onIncrease: sessions.apply(ConfigCore.stepPlanMinutes(sessions.config, row.number, "focus", 1))
          }

          PomodoroStepper {
            Layout.preferredWidth: 76
            size: 20
            valueWidth: 34
            valuePx: 13
            text: sessions.minutes(row.plan ? row.plan.breakMin : 0)
            onDecrease: sessions.apply(ConfigCore.stepPlanMinutes(sessions.config, row.number, "break", -1))
            onIncrease: sessions.apply(ConfigCore.stepPlanMinutes(sessions.config, row.number, "break", 1))
          }
        }
      }
    }

    IslandText {
      Layout.leftMargin: 6
      Layout.topMargin: 6
      text: I18n.tr("Cycle total · {time}", {
        time: ConfigCore.formatCycleTotal(ConfigCore.cycleTotalMinutes(sessions.config))
      })
      px: 12
      font.weight: Tokens.weightBody
      color: Tokens.neutral600
    }
  }

  // Início automático do foco depois da pausa; a pausa sempre começa sozinha.
  Rectangle {
    Layout.fillWidth: true
    Layout.leftMargin: 4
    Layout.rightMargin: 4
    Layout.topMargin: 4
    implicitHeight: 38
    radius: 14
    color: autoPointer.containsMouse ? Qt.alpha(Tokens.text, 0.07) : "transparent"

    RowLayout {
      anchors.fill: parent
      anchors.leftMargin: 8
      anchors.rightMargin: 8
      spacing: 11

      PhIcon {
        glyph: "play-fill"
        size: 14
        color: Tokens.neutral300
      }

      IslandText {
        Layout.fillWidth: true
        text: I18n.tr("Start automatically")
        px: 13
        font.weight: Tokens.weightBody
        color: Tokens.neutral200
      }

      ToggleSwitch {
        on: sessions.config.autoStart
        onClicked: sessions.apply(ConfigCore.withAutoStart(sessions.config, !sessions.config.autoStart))
      }
    }

    MouseArea {
      id: autoPointer

      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: sessions.apply(ConfigCore.withAutoStart(sessions.config, !sessions.config.autoStart))
    }
  }
}
