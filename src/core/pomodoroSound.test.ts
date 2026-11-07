import { describe, expect, it } from 'vitest';
import { defaultPomodoroConfig, withBreakSound } from './pomodoroConfig.js';
import {
  BREAK_SOUNDS,
  breakEndSound,
  breakSoundFile,
  breakSoundName,
  MAX_SOUND_LATE_MS,
} from './pomodoroSound.js';

describe('sons da pausa', () => {
  it('são desligado e três toques, na ordem das configurações', () => {
    expect(BREAK_SOUNDS.map((sound) => sound.id)).toEqual(['off', 'chime', 'bell', 'alarm']);
  });

  it('cada toque aponta para um arquivo do tema de sons do freedesktop', () => {
    expect(breakSoundFile('chime')).toBe('/usr/share/sounds/freedesktop/stereo/bell.oga');
    expect(breakSoundFile('bell')).toBe('/usr/share/sounds/freedesktop/stereo/complete.oga');
    expect(breakSoundFile('alarm')).toBe(
      '/usr/share/sounds/freedesktop/stereo/alarm-clock-elapsed.oga',
    );
  });

  it('desligado, e id desconhecido, não têm arquivo', () => {
    expect(breakSoundFile('off')).toBeNull();
    expect(breakSoundFile('../../etc/passwd')).toBeNull();
  });

  it('nomes nos dois idiomas', () => {
    expect(breakSoundName('off', 'pt-BR')).toBe('Desligado');
    expect(breakSoundName('chime', 'pt-BR')).toBe('Suave');
    expect(breakSoundName('bell', 'en')).toBe('Bell');
    expect(breakSoundName('alarm', 'pt-BR')).toBe('Alarme');
  });
});

describe('quando tocar', () => {
  const config = defaultPomodoroConfig();

  it('toca no fim da pausa, que começa o foco', () => {
    expect(breakEndSound(config, 'focus', 0)).toBe(breakSoundFile(config.breakSound));
  });

  it('não toca quando começa a pausa (fim do foco)', () => {
    expect(breakEndSound(config, 'break', 0)).toBeNull();
  });

  it('não toca com o som desligado', () => {
    expect(breakEndSound(withBreakSound(config, 'off'), 'focus', 0)).toBeNull();
  });

  it('toca com um atraso pequeno do timer', () => {
    expect(breakEndSound(config, 'focus', MAX_SOUND_LATE_MS)).not.toBeNull();
  });

  it('não toca fora de hora: o computador acordou da suspensão horas depois', () => {
    expect(breakEndSound(config, 'focus', MAX_SOUND_LATE_MS + 1)).toBeNull();
  });
});
