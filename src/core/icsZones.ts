// Fusos do feed (`VTIMEZONE`). O V4 do QML não tem `Intl`, então o nome do
// fuso (`TZID=America/Sao_Paulo`) não resolve sozinho: o deslocamento sai das
// regras que o próprio feed carrega (o Google inclui o VTIMEZONE de cada
// TZID usado).

import { parseRule, ruleWallsInYear, type Rule } from './icsRecurrence.js';
import { findProp, type IcsComponent } from './icsParse.js';
import { msToParts, parseWallValue } from './icsWall.js';

export interface Observance {
  /** Início da regra, em relógio de parede. */
  onsetMs: number;
  offsetMin: number;
  fromMin: number;
  rule: Rule | null;
}

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
  return { onsetMs: onset.ms, offsetMin, fromMin, rule: rrule ? parseRule(rrule) : null };
}

/** `TZID` → observâncias de todos os `VTIMEZONE` do `VCALENDAR`. */
export function parseZones(root: IcsComponent): Map<string, Observance[]> {
  const zones = new Map<string, Observance[]>();
  const calendars = root.children.filter((child) => child.name === 'VCALENDAR');
  for (const timezone of calendars.reduce<IcsComponent[]>((all, c) => all.concat(c.children), [])) {
    const tzid = findProp(timezone, 'TZID')?.value;
    if (timezone.name !== 'VTIMEZONE' || !tzid) continue;
    const observances = timezone.children
      .map(toObservance)
      .filter((o): o is Observance => o !== null);
    zones.set(tzid, observances);
  }
  return zones;
}

/** Último início de `observance` até `wallMs`, ou `null` se ainda não começou. */
function latestOnset(observance: Observance, wallMs: number): number | null {
  if (observance.onsetMs > wallMs) return null;
  if (!observance.rule) return observance.onsetMs;
  const start = msToParts(observance.onsetMs);
  const year = msToParts(wallMs).y;
  for (const candidateYear of [year, year - 1]) {
    const onsets = ruleWallsInYear(observance.rule, start, candidateYear).filter(
      (wall) => wall >= observance.onsetMs && wall <= wallMs,
    );
    if (onsets.length) return Math.max(...onsets);
  }
  return observance.onsetMs;
}

/** Deslocamento em minutos para UTC vigente em `wallMs` (relógio de parede do fuso). */
export function zoneOffsetMinutes(observances: readonly Observance[], wallMs: number): number {
  let best: { onset: number; offsetMin: number } | null = null;
  for (const observance of observances) {
    const onset = latestOnset(observance, wallMs);
    if (onset !== null && (best === null || onset > best.onset))
      best = { onset, offsetMin: observance.offsetMin };
  }
  return best ? best.offsetMin : (observances[0]?.fromMin ?? 0);
}
