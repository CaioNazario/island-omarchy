import { describe, expect, it } from 'vitest';
import {
  addEnvironment,
  defaultEnvironments,
  EnvironmentScroll,
  findWidget,
  placeWidget,
  removeWidget,
  removeEnvironment,
  sanitizeEnvironments,
  sanitizeIndex,
  stepIndex,
  toStored,
  type Environment,
  type ScrollInput,
  type StoredEnvironment,
} from './environments.js';

const smooth = (dx: number, dy = 0): ScrollInput => ({ kind: 'smooth', dx, dy, finished: false });
const finish: ScrollInput = { kind: 'smooth', dx: 0, dy: 0, finished: true };

describe('sanitizeEnvironments', () => {
  it('keeps a valid list as is', () => {
    const stored: StoredEnvironment[] = [['Casa', 'coffee', ['ai', 'note'], ['hw']]];
    expect(sanitizeEnvironments(stored)).toEqual([
      { name: 'Casa', icon: 'coffee', left: ['ai', 'note'], right: ['hw'] },
    ]);
  });

  it('drops unknown widgets', () => {
    const [env] = sanitizeEnvironments([['A', 'house', ['ai', 'clock'], ['weather', 'hw']]]);
    expect(env).toMatchObject({ left: ['ai'], right: ['hw'] });
  });

  it('keeps only the first occurrence of a repeated widget, left before right', () => {
    const [env] = sanitizeEnvironments([['A', 'house', ['ai', 'ai', 'hw'], ['hw', 'note']]]);
    expect(env).toMatchObject({ left: ['ai', 'hw'], right: ['note'] });
  });

  it('lets different environments repeat a widget', () => {
    const envs = sanitizeEnvironments([
      ['A', 'house', ['ai'], []],
      ['B', 'house', ['ai'], []],
    ]);
    expect(envs.map((env) => env.left)).toEqual([['ai'], ['ai']]);
  });

  it('replaces an unknown icon with the house', () => {
    const [env] = sanitizeEnvironments([['A', 'ph ph-rocket', [], []]]);
    expect(env?.icon).toBe('house');
  });

  it('falls back to the initial environments when the list is empty', () => {
    expect(sanitizeEnvironments([])).toEqual(defaultEnvironments());
  });

  it('keeps at most 6 environments', () => {
    const stored: StoredEnvironment[] = Array.from({ length: 8 }, (_v, i) => [
      `E${i}`,
      'house',
      [],
      [],
    ]);
    expect(sanitizeEnvironments(stored).map((env) => env.name)).toEqual([
      'E0',
      'E1',
      'E2',
      'E3',
      'E4',
      'E5',
    ]);
  });

  it('cuts names at 20 characters', () => {
    const [env] = sanitizeEnvironments([['Um nome comprido demais aqui', 'house', [], []]]);
    expect(env?.name).toBe('Um nome comprido dem');
  });

  it('round-trips through the stored form', () => {
    expect(sanitizeEnvironments(toStored(defaultEnvironments()))).toEqual(defaultEnvironments());
  });
});

describe('defaultEnvironments', () => {
  it('starts with Padrão reproducing the v1.0 bar', () => {
    expect(defaultEnvironments()[0]).toEqual({
      name: 'Padrão',
      icon: 'house',
      left: ['ai'],
      right: ['hw'],
    });
  });

  it('returns a fresh copy each time', () => {
    const envs = defaultEnvironments();
    envs[0]!.left.push('note');
    expect(defaultEnvironments()[0]!.left).toEqual(['ai']);
  });
});

describe('sanitizeIndex', () => {
  it('keeps an index in range', () => {
    expect(sanitizeIndex(3, 4)).toBe(3);
  });

  it.each([-1, 4, 10, 1.5, NaN])('turns %s into 0 with 4 environments', (index) => {
    expect(sanitizeIndex(index, 4)).toBe(0);
  });
});

describe('stepIndex', () => {
  it('goes forward and wraps after the last', () => {
    expect(stepIndex(2, 4, 1)).toBe(3);
    expect(stepIndex(3, 4, 1)).toBe(0);
  });

  it('goes back and wraps before the first', () => {
    expect(stepIndex(1, 4, -1)).toBe(0);
    expect(stepIndex(0, 4, -1)).toBe(3);
  });

  it('stays put with a single environment', () => {
    expect(stepIndex(0, 1, 1)).toBe(0);
    expect(stepIndex(0, 1, -1)).toBe(0);
  });
});

describe('removeEnvironment', () => {
  it('removes a non-default environment', () => {
    const envs = removeEnvironment(defaultEnvironments(), 2);
    expect(envs.map((env) => env.name)).toEqual(['Padrão', 'Trabalho', 'Fim de semana']);
  });

  it('never removes Padrão', () => {
    const envs = removeEnvironment(defaultEnvironments(), 0);
    expect(envs).toEqual(defaultEnvironments());
  });

  it('ignores an index out of range', () => {
    expect(removeEnvironment(defaultEnvironments(), 7)).toHaveLength(4);
  });
});

describe('placeWidget', () => {
  const env: Environment = {
    name: 'A',
    icon: 'house',
    left: ['ai', 'event', 'pomodoro'],
    right: ['hw'],
  };

  it('appends at the end without a position', () => {
    expect(placeWidget(env, 'note', 'right', null)).toMatchObject({ right: ['hw', 'note'] });
  });

  it('inserts before the widget at the position', () => {
    expect(placeWidget(env, 'note', 'left', 1)).toMatchObject({
      left: ['ai', 'note', 'event', 'pomodoro'],
    });
  });

  it('moves forward in the same pill, adjusting the index', () => {
    expect(placeWidget(env, 'ai', 'left', 2)).toMatchObject({
      left: ['event', 'ai', 'pomodoro'],
    });
  });

  it('moves back in the same pill', () => {
    expect(placeWidget(env, 'pomodoro', 'left', 0)).toMatchObject({
      left: ['pomodoro', 'ai', 'event'],
    });
  });

  it('moves to the other pill', () => {
    expect(placeWidget(env, 'event', 'right', 0)).toEqual({
      ...env,
      left: ['ai', 'pomodoro'],
      right: ['event', 'hw'],
    });
  });

  it('does not duplicate a widget already present', () => {
    const placed = placeWidget(env, 'hw', 'right', null);
    expect(placed).toMatchObject({ left: env.left, right: ['hw'] });
  });

  it('clamps a position past the end', () => {
    expect(placeWidget(env, 'note', 'right', 9)).toMatchObject({ right: ['hw', 'note'] });
  });

  it('leaves the original untouched', () => {
    placeWidget(env, 'ai', 'right', null);
    expect(env).toMatchObject({ left: ['ai', 'event', 'pomodoro'], right: ['hw'] });
  });
});

describe('findWidget', () => {
  const env: Environment = { name: 'A', icon: 'house', left: ['ai', 'event'], right: ['hw'] };

  it('tells the pill, the position and the pill size', () => {
    expect(findWidget(env, 'event')).toEqual({ side: 'left', index: 1, count: 2 });
    expect(findWidget(env, 'hw')).toEqual({ side: 'right', index: 0, count: 1 });
  });

  it('returns null for a widget outside the environment', () => {
    expect(findWidget(env, 'note')).toBeNull();
  });
});

describe('removeWidget', () => {
  it('takes the widget out of either pill', () => {
    const env: Environment = { name: 'A', icon: 'house', left: ['ai'], right: ['hw', 'note'] };
    expect(removeWidget(env, 'hw')).toMatchObject({ left: ['ai'], right: ['note'] });
    expect(removeWidget(env, 'ai')).toMatchObject({ left: [], right: ['hw', 'note'] });
  });
});

describe('addEnvironment', () => {
  it('appends "Ambiente N" with the next icon and empty pills', () => {
    const envs = defaultEnvironments();
    expect(addEnvironment(envs)).toEqual([
      ...envs,
      { name: 'Ambiente 5', icon: 'code', left: [], right: [] },
    ]);
  });

  it('picks the icon by the environment count', () => {
    const envs = [...defaultEnvironments(), defaultEnvironments()[0]!];
    expect(addEnvironment(envs).at(-1)).toMatchObject({
      name: 'Ambiente 6',
      icon: 'game-controller',
    });
  });

  it('does nothing with 6 environments', () => {
    const envs = [...defaultEnvironments(), ...defaultEnvironments().slice(0, 2)];
    expect(addEnvironment(envs)).toEqual(envs);
  });
});

describe('EnvironmentScroll', () => {
  it('follows the finger at half its speed before switching', () => {
    const scroll = new EnvironmentScroll();
    expect(scroll.handle(smooth(2))).toEqual({ handled: true, drag: -10 });
    expect(scroll.handle(smooth(-6))).toEqual({ handled: true, drag: 20 });
    expect(scroll.handle(smooth(-7))).toEqual({ handled: true, drag: 55 });
  });

  it('switches once past 11 and locks until the gesture ends', () => {
    const scroll = new EnvironmentScroll();
    for (let i = 0; i < 5; i++) scroll.handle(smooth(2));
    expect(scroll.handle(smooth(2))).toEqual({ handled: true, step: 1 });
    expect(scroll.handle(smooth(20))).toEqual({ handled: true });
    expect(scroll.handle(smooth(-40))).toEqual({ handled: true });
    expect(scroll.handle(finish)).toEqual({ handled: true, drag: 0 });
    for (let i = 0; i < 5; i++) scroll.handle(smooth(-2));
    expect(scroll.handle(smooth(-2))).toEqual({ handled: true, step: -1 });
  });

  it('does not switch exactly at the threshold', () => {
    const scroll = new EnvironmentScroll();
    expect(scroll.handle(smooth(11)).step).toBeUndefined();
  });

  it('resets the accumulated delta when the gesture ends', () => {
    const scroll = new EnvironmentScroll();
    scroll.handle(smooth(10));
    scroll.handle(finish);
    expect(scroll.handle(smooth(10)).step).toBeUndefined();
  });

  it('passes vertical scrolling along', () => {
    const scroll = new EnvironmentScroll();
    expect(scroll.handle(smooth(0, 5))).toEqual({ handled: false });
    expect(scroll.handle(smooth(3, 3))).toEqual({ handled: false });
    expect(scroll.handle(finish)).toEqual({ handled: false });
  });

  it('ignores discrete events emulated by the touchpad', () => {
    const scroll = new EnvironmentScroll();
    const emulated: ScrollInput = { kind: 'discrete', direction: 'right', fromWheel: false };
    expect(scroll.handle(emulated)).toEqual({ handled: false });
  });

  it('switches one step per click of a tilted wheel', () => {
    const scroll = new EnvironmentScroll();
    expect(scroll.handle({ kind: 'discrete', direction: 'right', fromWheel: true })).toEqual({
      handled: true,
      step: 1,
    });
    expect(scroll.handle({ kind: 'discrete', direction: 'left', fromWheel: true })).toEqual({
      handled: true,
      step: -1,
    });
    expect(scroll.handle({ kind: 'discrete', direction: 'down', fromWheel: true })).toEqual({
      handled: false,
    });
  });
});
