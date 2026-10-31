pragma ComponentBehavior: Bound

import QtQuick
import "../core/calendar.mjs" as CalendarCore
import "../core/countdown.mjs" as CountdownCore
import "../core/dayProgress.mjs" as DayProgress
import "../core/pomodoro.mjs" as PomodoroCore
import "../core/environments.mjs" as EnvironmentsCore

// Um widget do catálogo (specs/16-widgets.md "Widgets"), montado a partir das
// fontes. `naturalWidth`/`minWidth` alimentam o encaixe da área; só o `hw`
// encolhe (perde blocos) antes de sumir inteiro.
Item {
  id: slot

  required property string widgetId
  required property var bar
  required property string screenName
  property real budget: 100000
  property string side: ""
  property var dragProxy: null
  // Deslocamento e opacidade do conteúdo na troca de ambiente: o widget de
  // plugin, desenhado em outra janela, segue os dois (PluginWidget.qml).
  property real shift: 0
  property real fade: 1

  readonly property var system: bar.system
  readonly property var service: bar.service
  readonly property real naturalWidth: !loader.item ? 0 : widgetId === "hw" ? (loader.item as HwWidget).fullWidth : (loader.item as Item).implicitWidth
  readonly property real minWidth: loader.item && widgetId === "hw" ? Math.min(naturalWidth, (loader.item as HwWidget).minWidth) : naturalWidth

  implicitWidth: naturalWidth
  implicitHeight: 22

  function open(mode) {
    bar.openFromBar(screenName, mode);
  }

  Loader {
    id: loader

    sourceComponent: ({
        ai: aiWidget,
        hw: hwWidget,
        event: eventWidget,
        pomodoro: pomodoroWidget,
        music: musicWidget,
        github: githubWidget,
        progress: progressWidget,
        countdown: countdownWidget,
        note: noteWidget
      })[slot.widgetId] || (EnvironmentsCore.isPluginWidgetId(slot.widgetId) ? pluginWidget : null)
  }

  Component {
    id: pluginWidget

    PluginWidget {
      widgetId: slot.widgetId
      host: slot.bar.pluginWidgets
      editing: slot.bar.editingOn(slot.screenName)
      shift: slot.shift
      fade: slot.fade
    }
  }

  Component {
    id: aiWidget

    AiWidget {
      ai: slot.system.ai
      onClicked: slot.open("ai")
    }
  }

  Component {
    id: hwWidget

    HwWidget {
      hardware: slot.system.hardware
      budget: slot.budget
      onClicked: slot.open("quick")
    }
  }

  Component {
    id: eventWidget

    TopbarWidget {
      readonly property var view: CalendarCore.nextEvent(slot.system.calendar.events, new Date(slot.bar.nowMs))

      clickable: true
      glyph: "calendar-blank"
      label: view.label
      labelMaxWidth: 130
      sub: view.sub
      onClicked: slot.open("calendar")
    }
  }

  Component {
    id: pomodoroWidget

    TopbarWidget {
      id: pomodoro

      readonly property var pomodoroState: slot.service ? slot.service.pomodoro.current : PomodoroCore.initialPomodoro()
      property real now: Date.now()

      clickable: slot.service !== null
      ring: PomodoroCore.elapsedFraction(pomodoroState, now)
      label: PomodoroCore.formatRemaining(PomodoroCore.remainingAt(pomodoroState, now))
      sub: PomodoroCore.phaseLabel(pomodoroState)
      onClicked: slot.service.pomodoro.toggle()
      onPomodoroStateChanged: now = Date.now()

      // Relógio de 1s só com o widget visível e o pomodoro rodando.
      Timer {
        interval: 1000
        repeat: true
        running: pomodoro.pomodoroState.endsAt !== null
        onTriggered: pomodoro.now = Date.now()
      }
    }
  }

  Component {
    id: musicWidget

    TopbarWidget {
      readonly property var music: slot.system.music

      clickable: music.active
      glyph: music.active ? music.sourceGlyph : "music-note"
      glyphColor: music.active ? Tokens.accent400 : Tokens.neutral400
      label: music.active ? music.title : "Nada tocando"
      labelColor: music.active ? Tokens.text : Tokens.neutral400
      labelMaxWidth: 120
      sub: music.active ? music.artist : ""
      waves: music.active
      wavesPlaying: music.playing
      endGlyph: music.active ? (music.playing ? "pause-fill" : "play-fill") : ""
      onClicked: {
        slot.bar.targetScreen = slot.screenName;
        slot.bar.islandState.toggleMusicPinned();
      }
    }
  }

  Component {
    id: githubWidget

    TopbarWidget {
      readonly property var view: slot.system.github.view

      glyph: "github-logo-fill"
      label: view.label
      labelColor: view.unavailable ? Tokens.neutral400 : Tokens.text
      sub: view.sub || ""
    }
  }

  Component {
    id: progressWidget

    TopbarWidget {
      readonly property int percent: DayProgress.dayProgress(new Date(slot.bar.nowMs))

      glyph: "hourglass-medium"
      label: "Dia"
      bar: percent / 100
      sub: percent + "%"
    }
  }

  Component {
    id: countdownWidget

    TopbarWidget {
      readonly property var settings: slot.service ? slot.service.settings.values : null
      readonly property var view: CountdownCore.countdownView(settings ? settings.countdownName : "", settings ? settings.countdownDate : "", new Date(slot.bar.nowMs))

      // Só sem data há clique: leva às preferências (spec 13).
      clickable: view.missingDate
      glyph: "airplane-tilt"
      label: view.label
      labelColor: view.missingDate ? Tokens.neutral400 : Tokens.text
      sub: view.sub || ""
      onClicked: slot.bar.openPreferences("widgets")
    }
  }

  Component {
    id: noteWidget

    TopbarWidget {
      readonly property string text: slot.service ? slot.service.settings.values.noteText : ""

      clickable: true
      glyph: "note-fill"
      glyphColor: text === "" ? Tokens.neutral500 : Tokens.accent300
      label: text === "" ? "Nota vazia" : text
      labelMaxWidth: 150
      onClicked: slot.open("note")
    }
  }

  // Edição (spec 17): anel 1px `neutral-800` (selecionado `accent-900` + anel
  // `accent`) e cursor de arrastar; clique seleciona em vez de executar.
  EditorDragArea {
    id: editArea

    readonly property bool selected: slot.bar.editorSelected === slot.widgetId

    anchors.fill: parent
    visible: slot.bar.editingOn(slot.screenName)
    widgetId: slot.widgetId
    dragProxy: slot.dragProxy
    onTapped: {
      slot.bar.editorSelected = slot.widgetId;
      slot.bar.editorTarget = slot.side;
    }

    Rectangle {
      anchors.fill: parent
      radius: 11
      color: editArea.selected ? Qt.alpha(Tokens.accent900, 0.55) : "transparent"
      border.width: 1
      border.color: editArea.selected ? Tokens.accent : Tokens.neutral800
    }
  }
}
