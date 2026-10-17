import { describe, expect, it } from 'vitest';
import {
  artistLine,
  formatTrackTime,
  MUSIC_NOTE_GLYPH,
  PlayerTracker,
  positionAt,
  progressFraction,
  sourceGlyph,
  type PlaybackStatus,
  type PlayerSnapshot,
} from './music.js';

function player(status: PlaybackStatus, title = 'Faixa', trackId = '/t/1'): PlayerSnapshot {
  return { status, title, trackId };
}

function players(entries: Record<string, PlayerSnapshot>): Map<string, PlayerSnapshot> {
  return new Map(Object.entries(entries));
}

describe('PlayerTracker', () => {
  it('sem players, nada toca', () => {
    expect(new PlayerTracker().update(new Map())).toEqual({ current: null, trackChanged: false });
  });

  it('o último a entrar em Playing é o atual', () => {
    const tracker = new PlayerTracker();
    tracker.update(players({ a: player('Paused'), b: player('Paused') }));
    tracker.update(players({ a: player('Playing'), b: player('Paused') }));
    expect(tracker.update(players({ a: player('Playing'), b: player('Playing') })).current).toBe(
      'b',
    );
  });

  it('pausado continua atual enquanto nenhum outro toca', () => {
    const tracker = new PlayerTracker();
    tracker.update(players({ a: player('Paused'), b: player('Paused') }));
    tracker.update(players({ a: player('Paused'), b: player('Playing') }));
    expect(tracker.update(players({ a: player('Paused'), b: player('Paused') })).current).toBe('b');
  });

  it('o atual sai do barramento: volta ao anterior que tocou', () => {
    const tracker = new PlayerTracker();
    tracker.update(players({ a: player('Playing') }));
    tracker.update(players({ a: player('Playing'), b: player('Playing') }));
    expect(tracker.update(players({ a: player('Playing') })).current).toBe('a');
  });

  it('parado ou sem título não é atual (Brave em Stopped depois do vídeo)', () => {
    const tracker = new PlayerTracker();
    tracker.update(players({ a: player('Paused'), b: player('Playing') }));
    expect(tracker.update(players({ a: player('Paused'), b: player('Stopped', '') })).current).toBe(
      'a',
    );
    expect(tracker.update(players({ a: player('Paused', '') })).current).toBeNull();
  });

  it('parado volta a ser atual quando toca de novo', () => {
    const tracker = new PlayerTracker();
    tracker.update(players({ a: player('Paused'), b: player('Stopped', '') }));
    expect(tracker.update(players({ a: player('Paused'), b: player('Playing') })).current).toBe(
      'b',
    );
  });

  it('na primeira leitura, quem toca fica na frente de quem está pausado', () => {
    const tracker = new PlayerTracker();
    expect(tracker.update(players({ a: player('Playing'), b: player('Paused') })).current).toBe(
      'a',
    );
  });

  it('na primeira leitura, pausado também é atual (volta do lock)', () => {
    expect(new PlayerTracker().update(players({ a: player('Paused') })).current).toBe('a');
  });

  describe('troca de faixa', () => {
    it('descobrir um player já tocando não dispara', () => {
      const update = new PlayerTracker().update(players({ a: player('Playing') }));
      expect(update.trackChanged).toBe(false);
    });

    it('trackid novo com o atual tocando dispara', () => {
      const tracker = new PlayerTracker();
      tracker.update(players({ a: player('Playing', 'Um', '/t/1') }));
      expect(tracker.update(players({ a: player('Playing', 'Um', '/t/2') })).trackChanged).toBe(
        true,
      );
    });

    it('título novo com trackid fixo dispara (Firefox)', () => {
      const tracker = new PlayerTracker();
      tracker.update(players({ a: player('Playing', 'Um', '/org/mpris/MediaPlayer2/firefox') }));
      const update = tracker.update(
        players({ a: player('Playing', 'Dois', '/org/mpris/MediaPlayer2/firefox') }),
      );
      expect(update.trackChanged).toBe(true);
    });

    it('a mesma faixa não dispara de novo', () => {
      const tracker = new PlayerTracker();
      tracker.update(players({ a: player('Playing') }));
      expect(tracker.update(players({ a: player('Playing') })).trackChanged).toBe(false);
    });

    it('trocar de faixa pausado não dispara', () => {
      const tracker = new PlayerTracker();
      tracker.update(players({ a: player('Paused', 'Um') }));
      expect(tracker.update(players({ a: player('Paused', 'Dois') })).trackChanged).toBe(false);
    });

    it('pular pausado e voltar a tocar dispara (Spotify web no Firefox)', () => {
      const tracker = new PlayerTracker();
      const firefox = '/org/mpris/MediaPlayer2/firefox';
      tracker.update(players({ a: player('Playing', 'You Were Right', firefox) }));
      tracker.update(players({ a: player('Paused', 'You Were Right', firefox) }));
      expect(tracker.update(players({ a: player('Paused', 'Eyes', firefox) })).trackChanged).toBe(
        false,
      );
      expect(tracker.update(players({ a: player('Playing', 'Eyes', firefox) })).trackChanged).toBe(
        true,
      );
    });

    it('pausar e retomar depois de tocar não dispara', () => {
      const tracker = new PlayerTracker();
      tracker.update(players({ a: player('Playing') }));
      tracker.update(players({ a: player('Paused') }));
      expect(tracker.update(players({ a: player('Playing') })).trackChanged).toBe(false);
    });

    it('retomar a mesma faixa não dispara', () => {
      const tracker = new PlayerTracker();
      tracker.update(players({ a: player('Paused') }));
      expect(tracker.update(players({ a: player('Playing') })).trackChanged).toBe(false);
    });

    it('troca num player que não é o atual não dispara', () => {
      const tracker = new PlayerTracker();
      tracker.update(players({ a: player('Playing', 'Um') }));
      tracker.update(players({ a: player('Playing', 'Um'), b: player('Playing', 'X') }));
      const update = tracker.update(
        players({ a: player('Playing', 'Dois'), b: player('Playing', 'X') }),
      );
      expect(update).toEqual({ current: 'b', trackChanged: false });
    });

    it('player novo que já chega tocando dispara', () => {
      const tracker = new PlayerTracker();
      tracker.update(new Map());
      expect(tracker.update(players({ a: player('Playing') }))).toEqual({
        current: 'a',
        trackChanged: true,
      });
    });

    it('título que chega depois de vazio dispara uma vez', () => {
      const tracker = new PlayerTracker();
      tracker.update(players({ a: player('Playing', 'Um') }));
      tracker.update(players({ a: player('Playing', '') }));
      expect(tracker.update(players({ a: player('Playing', 'Dois') })).trackChanged).toBe(true);
      expect(tracker.update(players({ a: player('Playing', 'Dois') })).trackChanged).toBe(false);
    });
  });
});

describe('artistLine', () => {
  it('junta os artistas com ", "', () => {
    expect(artistLine(['RÜFÜS DU SOL', 'Adriatique'], 'Spotify')).toBe('RÜFÜS DU SOL, Adriatique');
  });

  it('ignora artistas vazios', () => {
    expect(artistLine(['', ' Stone '], 'Chrome')).toBe('Stone');
  });

  it('sem artista, mostra o nome do player', () => {
    expect(artistLine([], 'Brave')).toBe('Brave');
    expect(artistLine([''], 'Brave')).toBe('Brave');
  });
});

describe('formatTrackTime', () => {
  it.each([
    [0, '0:00'],
    [999_999, '0:00'],
    [5_000_000, '0:05'],
    [65_000_000, '1:05'],
    [1_309_381_000, '21:49'],
    [3_725_000_000, '62:05'],
    [-1, '0:00'],
  ])('%i µs vira %s', (us, label) => {
    expect(formatTrackTime(us)).toBe(label);
  });
});

describe('progressFraction', () => {
  it('fração da posição na duração, entre 0 e 1', () => {
    expect(progressFraction(50, 200)).toBe(0.25);
    expect(progressFraction(300, 200)).toBe(1);
    expect(progressFraction(-5, 200)).toBe(0);
  });

  it('sem duração, a barra fica vazia', () => {
    expect(progressFraction(50, 0)).toBe(0);
  });
});

describe('positionAt', () => {
  it('tocando, avança com o relógio', () => {
    expect(positionAt({ positionUs: 1_000_000, atMs: 10_000, playing: true }, 12_500, 0)).toBe(
      3_500_000,
    );
  });

  it('pausado, fica parado', () => {
    expect(positionAt({ positionUs: 1_000_000, atMs: 10_000, playing: false }, 99_000, 0)).toBe(
      1_000_000,
    );
  });

  it('não passa da duração', () => {
    expect(positionAt({ positionUs: 9_000_000, atMs: 0, playing: true }, 5_000, 10_000_000)).toBe(
      10_000_000,
    );
  });

  it('relógio andando para trás não volta a posição', () => {
    expect(positionAt({ positionUs: 1_000_000, atMs: 10_000, playing: true }, 9_000, 0)).toBe(
      1_000_000,
    );
  });
});

describe('sourceGlyph', () => {
  it.each([
    ['Spotify', 'spotify-logo-fill'],
    ['Chrome', 'google-chrome-logo-fill'],
    ['Google Chrome', 'google-chrome-logo-fill'],
    ['Chromium', 'google-chrome-logo-fill'],
    ['Brave', MUSIC_NOTE_GLYPH],
    ['Mozilla firefox', MUSIC_NOTE_GLYPH],
    ['VLC media player', MUSIC_NOTE_GLYPH],
  ])('%s usa %s', (identity, glyph) => {
    expect(sourceGlyph(identity)).toBe(glyph);
  });
});
