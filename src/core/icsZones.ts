// Fusos do feed (`VTIMEZONE`). O V4 do QML não tem `Intl`, então o nome do
// fuso (`TZID=America/Sao_Paulo`) não resolve sozinho: o deslocamento sai das
// regras que o próprio feed carrega (o Google inclui o VTIMEZONE de cada
// TZID usado).
//
// O VTIMEZONE também é de terceiros, e cada conversão de horário de cada
// evento percorre as observâncias do fuso: regras mais pesadas que uma de
// horário de verão descartam a observância, um fuso guarda no máximo as
// `MAX_OBSERVANCES` mais recentes, e os inícios são calculados uma vez por
// forma de ano (`YearShape`), não por ano (revisão do marketplace, #13501).

import { parseRule, periodCost, ruleWallsInYear, type Rule } from './icsRecurrence.js';
import { findProp, type IcsComponent } from './icsParse.js';
import { daysInMonth, msToParts, parseWallValue } from './icsWall.js';

export interface Observance {
  /** Início da regra, em relógio de parede. */
  onsetMs: number;
  offsetMin: number;
  fromMin: number;
  rule: Rule | null;
  /**
   * Inícios da regra por `YearShape.key`, em ms desde o 1º de janeiro. Sem
   * isso cada conversão repetia a expansão; por ano, um feed com um evento em
   * cada ano errava o cache a cada evento.
   */
  onsetsByShape: Map<number, number[]>;
}

/**
 * Os dias que uma regra anual escolhe só dependem de o ano ser bissexto e do
 * dia da semana de 1º de janeiro: há 14 formas de ano.
 */
interface YearShape {
  year: number;
  key: number;
  startMs: number;
}

/**
 * Uma regra de horário de verão escolhe um dia por ano: `BYMONTH=3;BYDAY=2SU`
 * custa 3 passos (`periodCost`), a forma antiga `BYMONTHDAY=8,…,14;BYDAY=SU`
 * custa 10. Uma regra mais pesada não é fuso, é feed hostil.
 */
const MAX_ZONE_RULE_COST = 10;

/** O Google traz 2 observâncias por fuso; exportações com histórico, algumas dezenas. */
const MAX_OBSERVANCES = 32;

/** `-0300`, `+0530`, `-030000` em minutos; formato inesperado → `null`. */
export function parseOffsetMinutes(value: string): number | null {
  const match = /^([+-])(\d{2})(\d{2})(?:\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const minutes = parseInt(match[2] ?? '0', 10) * 60 + parseInt(match[3] ?? '0', 10);
  return match[1] === '-' ? -minutes : minutes;
}

function toObservance(component: IcsComponent): Observance | null {
  const onset = parseWallValue(findProp(component, 'DTSTART')?.value ?? '');
  const offsetMin = parseOffsetMinutes(findProp(component, 'TZOFFSETTO')?.value ?? '');
  const fromMin = parseOffsetMinutes(findProp(component, 'TZOFFSETFROM')?.value ?? '');
  if (!onset || offsetMin === null || fromMin === null) return null;
  const rrule = findProp(component, 'RRULE')?.value;
  const rule = rrule ? parseRule(rrule) : null;
  if (rule && periodCost(rule) > MAX_ZONE_RULE_COST) return null;
  return { onsetMs: onset.ms, offsetMin, fromMin, rule, onsetsByShape: new Map() };
}

/** Observâncias válidas em ordem de início, só as `MAX_OBSERVANCES` mais recentes. */
function zoneObservances(timezone: IcsComponent): Observance[] {
  return timezone.children
    .map(toObservance)
    .filter((o): o is Observance => o !== null)
    .sort((a, b) => a.onsetMs - b.onsetMs)
    .slice(-MAX_OBSERVANCES);
}

/** `TZID` → observâncias de todos os `VTIMEZONE` do `VCALENDAR`. */
export function parseZones(root: IcsComponent): Map<string, Observance[]> {
  const zones = new Map<string, Observance[]>();
  const calendars = root.children.filter((child) => child.name === 'VCALENDAR');
  for (const timezone of calendars.reduce<IcsComponent[]>((all, c) => all.concat(c.children), [])) {
    const tzid = findProp(timezone, 'TZID')?.value;
    if (timezone.name !== 'VTIMEZONE' || !tzid) continue;
    zones.set(tzid, zoneObservances(timezone));
  }
  return zones;
}

function yearShape(year: number): YearShape {
  const startMs = Date.UTC(year, 0, 1);
  const leap = daysInMonth(year, 1) === 29 ? 7 : 0;
  return { year, key: leap + new Date(startMs).getUTCDay(), startMs };
}

/** Inícios de `rule` num ano da forma `shape`, em ms desde o 1º de janeiro. */
function onsetsInShape(observance: Observance, rule: Rule, shape: YearShape): number[] {
  const cached = observance.onsetsByShape.get(shape.key);
  if (cached) return cached;
  const walls = ruleWallsInYear(rule, msToParts(observance.onsetMs), shape.year);
  const onsets = walls.map((wall) => wall - shape.startMs);
  observance.onsetsByShape.set(shape.key, onsets);
  return onsets;
}

/** Maior início do ano `shape` em [`fromMs`, `toMs`], ou `null`. Laço sem `filter`: roda para cada observância em cada conversão. */
function latestIn(
  shape: YearShape,
  onsets: readonly number[],
  fromMs: number,
  toMs: number,
): number | null {
  let latest: number | null = null;
  for (const offset of onsets) {
    const wall = shape.startMs + offset;
    if (wall >= fromMs && wall <= toMs && (latest === null || wall > latest)) latest = wall;
  }
  return latest;
}

/** Último início de `observance` até `wallMs` (`shapes`: o ano dele e o anterior), ou `null` se ainda não começou. */
function latestOnset(
  observance: Observance,
  wallMs: number,
  shapes: readonly YearShape[],
): number | null {
  if (observance.onsetMs > wallMs) return null;
  const rule = observance.rule;
  if (!rule) return observance.onsetMs;
  for (const shape of shapes) {
    const onset = latestIn(
      shape,
      onsetsInShape(observance, rule, shape),
      observance.onsetMs,
      wallMs,
    );
    if (onset !== null) return onset;
  }
  return observance.onsetMs;
}

/** Deslocamento em minutos para UTC vigente em `wallMs` (relógio de parede do fuso). */
export function zoneOffsetMinutes(observances: readonly Observance[], wallMs: number): number {
  const year = msToParts(wallMs).y;
  const shapes = [yearShape(year), yearShape(year - 1)];
  let best: { onset: number; offsetMin: number } | null = null;
  for (const observance of observances) {
    const onset = latestOnset(observance, wallMs, shapes);
    if (onset !== null && (best === null || onset > best.onset))
      best = { onset, offsetMin: observance.offsetMin };
  }
  return best ? best.offsetMin : (observances[0]?.fromMin ?? 0);
}
