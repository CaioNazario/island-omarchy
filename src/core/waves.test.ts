import { describe, expect, it } from 'vitest';
import { createWaves, stepWaves, WAVES_REST, wavesSettled } from './waves.js';

function run(steps: number, playing: boolean, start = createWaves(5)) {
  let waves = start;
  for (let i = 0; i < steps; i++)
    waves = stepWaves(waves, { dtSec: 1 / 60, nowSec: i / 60, playing });
  return waves;
}

describe('waves', () => {
  it('começa em repouso, com uma barra por coluna', () => {
    const waves = createWaves(7);
    expect(waves.levels).toHaveLength(7);
    expect(waves.levels.every((level) => level === WAVES_REST)).toBe(true);
    expect(wavesSettled(waves)).toBe(true);
  });

  it('tocando, as barras sobem e ficam entre o repouso e 1', () => {
    const waves = run(120, true);
    expect(Math.max(...waves.levels)).toBeGreaterThan(0.3);
    expect(waves.levels.every((level) => level >= WAVES_REST - 1e-9 && level <= 1)).toBe(true);
    expect(wavesSettled(waves)).toBe(false);
  });

  it('pausado, as barras voltam ao repouso e a fase para', () => {
    const playing = run(120, true);
    const paused = run(120, false, playing);
    expect(paused.phase).toBe(playing.phase);
    expect(wavesSettled(paused)).toBe(true);
  });

  it('a fase anda bpm/60 batidas por segundo', () => {
    const waves = stepWaves(createWaves(4), { dtSec: 0.05, nowSec: 0, playing: true, bpm: 120 });
    expect(waves.phase).toBeCloseTo(0.1);
  });

  it('um quadro longo conta no máximo 50ms (como o rAF do design)', () => {
    const waves = stepWaves(createWaves(4), { dtSec: 2, nowSec: 0, playing: true, bpm: 60 });
    expect(waves.phase).toBeCloseTo(0.05);
  });
});
