// Ondas da música (specs/05-musica.md "Ondas"; design/logic.js `Waves`): cada
// barra persegue um alvo feito de bumbo (graves à esquerda), chimbal
// (agudos à direita) e um balanço senoidal. O MPRIS não informa o andamento,
// então todas as faixas usam `DEFAULT_BPM`.

export const WAVES_REST = 0.15;
export const DEFAULT_BPM = 112;
const MAX_DT_SEC = 0.05;
const SETTLED_EPSILON = 0.002;

export interface Waves {
  levels: number[];
  /** Batidas desde o início; só anda tocando. */
  phase: number;
}

export interface WavesTick {
  dtSec: number;
  nowSec: number;
  playing: boolean;
  bpm?: number;
}

export function createWaves(count: number): Waves {
  return { levels: Array.from({ length: count }, () => WAVES_REST), phase: 0 };
}

function target(i: number, n: number, phase: number, nowSec: number): number {
  const beat = phase % 1;
  const kick = Math.exp(-beat * 6);
  const hat = Math.exp(-((phase + 0.5) % 1) * 9);
  const accent = Math.floor(phase) % 4 === 0 ? 1 : 0.82;
  const low = n > 1 ? 1 - i / (n - 1) : 1;
  const mid = Math.exp(-Math.pow((i - (n - 1) / 2) / 1.2, 2));
  const seed = 1.3 + i * 0.77;
  const wobble = 0.5 + 0.5 * Math.sin(nowSec * seed * 3.1 + i * 2);
  const hit = kick * (0.35 + 0.5 * low) + hat * 0.35 * (1 - low);
  return Math.min(1, 0.16 + accent * hit + mid * 0.2 * wobble + 0.12 * wobble);
}

/** Um quadro: sobe rápido (28/s) e desce devagar (9/s) em direção ao alvo. */
export function stepWaves(waves: Waves, tick: WavesTick): Waves {
  const dt = Math.min(MAX_DT_SEC, Math.max(0, tick.dtSec));
  const phase = tick.playing ? waves.phase + (dt * (tick.bpm ?? DEFAULT_BPM)) / 60 : waves.phase;
  const n = waves.levels.length;
  const levels = waves.levels.map((level, i) => {
    const goal = tick.playing ? target(i, n, phase, tick.nowSec) : WAVES_REST;
    const rate = goal > level ? 28 : 9;
    return level + (goal - level) * Math.min(1, dt * rate);
  });
  return { levels, phase };
}

/** Em repouso: a animação pode parar até voltar a tocar. */
export function wavesSettled(waves: Waves): boolean {
  return waves.levels.every((level) => Math.abs(level - WAVES_REST) < SETTLED_EPSILON);
}
