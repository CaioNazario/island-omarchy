// Uso de IA (specs/12-uso-ia.md): faixas de cor e textos de "Reinicia" das
// janelas de sessão e semanal. Os limites vêm dos registros do Omarchy
// (agentUsage.ts).

import { formatClock } from './clock.js';
import { tr, weekdayShort, type Language } from './i18n.js';

export interface UsageWindow {
  /** 0–100. */
  percent: number;
  /** ms epoch; `null` quando o registro não diz. */
  resetsAt: number | null;
}

/** `high`: ≥70% (`accent-300`); `critical`: ≥90% (vermelho). */
export type UsageLevel = 'normal' | 'high' | 'critical';

export function usageLevel(percent: number): UsageLevel {
  if (percent >= 90) return 'critical';
  if (percent >= 70) return 'high';
  return 'normal';
}

export function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

/** "in 2h 14m" ("em 2h 14min"). Nunca "in 0m": o que falta arredonda para cima. */
export function formatSessionReset(resetsAt: number, now: number, lang: Language): string {
  const minutes = Math.max(1, Math.ceil((resetsAt - now) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return tr(lang, 'in {m}m', { m: rest });
  return rest === 0
    ? tr(lang, 'in {h}h', { h: hours })
    : tr(lang, 'in {h}h {m}m', { h: hours, m: rest });
}

/** "Mon 09:00" ("seg, 09:00": em português, minúsculo como no design), na hora local. */
export function formatWeeklyReset(resetsAt: number, lang: Language): string {
  const date = new Date(resetsAt);
  const weekday = weekdayShort(lang, date.getDay());
  return tr(lang, '{weekday} {time}', {
    weekday: lang === 'pt-BR' ? weekday.toLowerCase() : weekday,
    time: formatClock(date),
  });
}
