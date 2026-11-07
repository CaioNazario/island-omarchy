pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import QtQuick.Effects
import Quickshell
import Quickshell.Wayland
import "../core/pomodoro.mjs" as PomodoroCore
import "../core/pomodoroConfig.mjs" as ConfigCore
import "../core/pomodoroBreak.mjs" as BreakCore

// Tela de pausa (specs/20-pomodoro.md "Tela de pausa"): uma janela de tela
// cheia por monitor, na camada `overlay` (por cima até de app em tela cheia),
// com wallpaper, vinheta, a instrução da pausa e o relógio. O monitor do foco
// toma o teclado, para nada digitado chegar aos apps de baixo. A única saída é
// a zona de Urgência no topo (mouse ou segurar Esc por 2 s).
PanelWindow {
  id: window

  required property var pomodoro
  // Só o monitor do foco toma o teclado.
  property bool keyboardOwner: false

  readonly property var phaseState: pomodoro.breakState
  readonly property var config: pomodoro.applied
  readonly property bool preview: pomodoro.previewing && !pomodoro.current.locked
  readonly property int breakMinutes: ConfigCore.minutesFor(config, "break", phaseState.session)
  property real now: Date.now()
  readonly property real remaining: PomodoroCore.remainingAt(phaseState, now)
  // Estágio da animação de entrada (0–4), a partir de quando a tela apareceu.
  property int stage: 0
  property bool confirmOpen: false
  readonly property color accent: Tokens.pomodoroBreak

  anchors {
    top: true
    bottom: true
    left: true
    right: true
  }
  exclusionMode: ExclusionMode.Ignore
  color: Tokens.pomodoroBreakBase
  WlrLayershell.namespace: "island-break"
  WlrLayershell.layer: WlrLayer.Overlay
  WlrLayershell.keyboardFocus: keyboardOwner ? WlrKeyboardFocus.Exclusive : WlrKeyboardFocus.None

  // Um relógio só: o motor conta por horário, aqui só se repinta.
  Timer {
    interval: 250
    repeat: true
    running: window.visible
    onTriggered: window.now = Date.now()
  }

  // A barra recriada no hot-reload retoma do estágio certo, sem refazer a entrada.
  function refreshStage() {
    const elapsed = Date.now() - pomodoro.breakSince;
    stage = BreakCore.entranceStage(elapsed);
    const next = BreakCore.nextStageDelay(elapsed);
    if (next === null) {
      stageTimer.stop();
      return;
    }
    stageTimer.interval = next;
    stageTimer.restart();
  }

  Component.onCompleted: refreshStage()

  Timer {
    id: stageTimer

    onTriggered: window.refreshStage()
  }

  function skipBreak() {
    if (preview) pomodoro.endPreview();
    else pomodoro.skip();
  }

  function askEmergency() {
    if (preview) pomodoro.endPreview();
    else confirmOpen = true;
  }

  function closeDialog() {
    confirmOpen = false;
    keys.forceActiveFocus();
  }

  // Revela a zona de Urgência pelo teclado e a esconde de novo depois de um tempo.
  Timer {
    id: holdEscape

    interval: BreakCore.URGENCY_HOLD_MS
    onTriggered: {
      zone.forceShown = true;
      hideReveal.restart();
    }
  }

  Timer {
    id: hideReveal

    interval: 8000
    onTriggered: zone.forceShown = false
  }

  // Bloco que entra com opacidade, subida e desfoque (specs/20 "Animação de
  // entrada"). A subida é o `y` do layout interno: `y` num item gerido por
  // layout (e a `Translate` dele) o `qmllint` recusa, então o bloco é um `Item`.
  component Reveal: Item {
    id: reveal

    default property alias content: inner.data
    property alias spacing: inner.spacing
    property bool on: false
    property real rise: 36
    property real blurPx: 8
    property real blurAmount: on ? 0 : 1

    implicitWidth: inner.implicitWidth
    implicitHeight: inner.implicitHeight
    opacity: on ? 1 : 0
    layer.enabled: blurAmount > 0.001
    layer.effect: MultiEffect {
      blurEnabled: true
      blurMax: 32
      blur: reveal.blurAmount * reveal.blurPx / 32
    }

    ColumnLayout {
      id: inner

      width: reveal.width
      y: reveal.on ? 0 : reveal.rise

      Behavior on y {
        NumberAnimation {
          duration: 1300
          easing.type: Easing.BezierSpline
          easing.bezierCurve: [0.16, 1, 0.3, 1, 1, 1]
        }
      }
    }

    Behavior on opacity {
      NumberAnimation {
        duration: 1000
      }
    }
    Behavior on blurAmount {
      NumberAnimation {
        duration: 1000
      }
    }
  }

  Item {
    id: keys

    anchors.fill: parent
    clip: true
    focus: true

    Keys.onPressed: event => {
      if (event.key !== Qt.Key_Escape)
        return;
      event.accepted = true;
      if (window.confirmOpen)
        window.closeDialog();
      else if (!event.isAutoRepeat)
        holdEscape.start();
    }
    Keys.onReleased: event => {
      if (event.key === Qt.Key_Escape && !event.isAutoRepeat)
        holdEscape.stop();
    }

    PomodoroWallpaper {
      anchors.fill: parent
      wallpaperId: window.config.wallpaper
      customPath: window.config.wallpaperPath
      opacity: window.stage >= 1 ? 1 : 0
      scale: window.stage >= 1 ? 1 : 1.06

      Behavior on opacity {
        NumberAnimation {
          duration: 1400
          easing.type: Easing.InOutQuad
        }
      }
      Behavior on scale {
        NumberAnimation {
          duration: 2400
          easing.type: Easing.BezierSpline
          easing.bezierCurve: [0.16, 1, 0.3, 1, 1, 1]
        }
      }
    }

    PomodoroWallpaper {
      anchors.fill: parent
      vignetteOnly: true
    }

    ColumnLayout {
      anchors.centerIn: parent
      width: Math.min(parent.width - 80, 1500)
      spacing: 30

      Reveal {
        Layout.fillWidth: true
        on: window.stage >= 2
        spacing: 16

        IslandText {
          Layout.alignment: Qt.AlignHCenter
          text: BreakCore.breakKindLabel(window.breakMinutes, I18n.language)
          color: Qt.alpha("#ffffff", 0.66)
          font.weight: Tokens.weightBody
        }

        IslandText {
          Layout.fillWidth: true
          horizontalAlignment: Text.AlignHCenter
          wrapMode: Text.WordWrap
          text: BreakCore.breakInstruction(window.phaseState.completed, window.phaseState.session, I18n.language)
          // `clamp(56px, 9vw, 132px)` do protótipo.
          px: Math.min(132, Math.max(56, window.width * 0.09))
          font.weight: Font.Light
          font.letterSpacing: -0.035 * px
          lineHeight: 0.95
          color: "#f7f6f2"
        }
      }

      Reveal {
        Layout.alignment: Qt.AlignHCenter
        on: window.stage >= 3
        rise: 28
        blurPx: 6
        spacing: 14

        PomodoroClock {
          Layout.alignment: Qt.AlignHCenter
          text: PomodoroCore.formatRemaining(window.remaining)
          px: 34
          color: Qt.alpha("#ffffff", 0.88)
        }

        Rectangle {
          Layout.alignment: Qt.AlignHCenter
          Layout.preferredWidth: 180
          Layout.preferredHeight: 3
          radius: 2
          color: Qt.alpha("#ffffff", 0.16)

          Rectangle {
            width: parent.width * PomodoroCore.elapsedFraction(window.phaseState, window.config, window.now)
            height: parent.height
            radius: 2
            color: window.accent

            Behavior on width {
              NumberAnimation {
                duration: 250
              }
            }
          }
        }
      }
    }

    PomodoroUrgencyZone {
      id: zone

      anchors.top: parent.top
      anchors.horizontalCenter: parent.horizontalCenter
      onSkipRequested: window.skipBreak()
      onEmergencyRequested: window.askEmergency()
    }

    Loader {
      anchors.fill: parent
      active: window.confirmOpen

      sourceComponent: PomodoroUrgencyDialog {
        accent: window.accent
        onCanceled: window.closeDialog()
        onConfirmed: {
          window.confirmOpen = false;
          window.pomodoro.release();
        }
      }
    }
  }
}
