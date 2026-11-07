pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/pomodoroConfig.mjs" as ConfigCore
import "../core/pomodoroSound.mjs" as SoundCore

// Seção "Som do fim da pausa" (specs/20 "Som"): segmentado Desligado / Suave /
// Sino / Alarme. Escolher um toque já o toca, para ouvir antes de decidir.
ColumnLayout {
  id: section

  required property var pomodoro

  readonly property var config: pomodoro.config

  spacing: 0

  PomodoroSectionTitle {
    Layout.fillWidth: true
    text: I18n.tr("Break end sound")
  }

  PomodoroSegmented {
    Layout.fillWidth: true
    Layout.leftMargin: 12
    Layout.rightMargin: 12
    Layout.topMargin: 2
    Layout.bottomMargin: 10
    current: section.config.breakSound
    options: SoundCore.BREAK_SOUNDS.map(sound => ({
          id: sound.id,
          label: SoundCore.breakSoundName(sound.id, I18n.language)
        }))
    onChosen: id => {
      section.pomodoro.setConfig(ConfigCore.withBreakSound(section.config, id));
      section.pomodoro.previewSound(id);
    }
  }
}
