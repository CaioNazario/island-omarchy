// Som do fim da pausa (specs/20-pomodoro.md "Som"): três toques do tema de sons
// do freedesktop, tocados pelo PipeWire (`pw-play`) no `PomodoroSource.qml`.
// Aqui fica só o que dá para testar sem áudio: a tabela de arquivos, os nomes e
// a regra de quando tocar.

import { msg, tr, type Language } from './i18n.js';
import {
  BREAK_SOUND_IDS,
  type BreakSoundId,
  type PomodoroConfig,
  type PomodoroPhase,
} from './pomodoroConfig.js';

const SOUND_DIR = '/usr/share/sounds/freedesktop/stereo';

/** Arquivo de cada toque; `off` não tem. A lista fixa impede que um valor do `settings.json` vire caminho. */
const FILES: Readonly<Record<BreakSoundId, string | null>> = {
  off: null,
  chime: `${SOUND_DIR}/bell.oga`,
  bell: `${SOUND_DIR}/complete.oga`,
  alarm: `${SOUND_DIR}/alarm-clock-elapsed.oga`,
};

const NAMES: Readonly<Record<BreakSoundId, ReturnType<typeof msg>>> = {
  off: msg('Off'),
  chime: msg('Soft'),
  bell: msg('Bell'),
  alarm: msg('Alarm'),
};

export const BREAK_SOUNDS: readonly { id: BreakSoundId }[] = BREAK_SOUND_IDS.map((id) => ({ id }));

/**
 * Atraso máximo do timer para ainda tocar. Passando disso o computador voltou
 * da suspensão (ou o shell travou) e o fim da pausa já é passado: um som
 * agora só assusta.
 */
export const MAX_SOUND_LATE_MS = 10_000;

export function breakSoundFile(id: string): string | null {
  const known = BREAK_SOUND_IDS.find((item) => item === id);
  return known === undefined ? null : FILES[known];
}

export function breakSoundName(id: BreakSoundId, lang: Language): string {
  return tr(lang, NAMES[id]);
}

/**
 * Arquivo a tocar quando uma etapa começa por fim de tempo. Só o fim da pausa
 * (começa o foco) toca; `lateMs` é quanto o disparo passou do horário.
 */
export function breakEndSound(
  config: PomodoroConfig,
  started: PomodoroPhase,
  lateMs: number,
): string | null {
  if (started !== 'focus' || lateMs > MAX_SOUND_LATE_MS) return null;
  return breakSoundFile(config.breakSound);
}
