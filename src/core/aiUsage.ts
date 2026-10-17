// Uso de IA (specs/12-uso-ia.md): faixas de cor e textos de "Reinicia" das
// janelas de sessão e semanal. Os limites vêm dos registros do Omarchy
// (agentUsage.ts).

import { formatClock } from './clock.js';

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

/** "em 2h 14min", "em 45min". Nunca "em 0min": o que falta arredonda para cima. */
export function formatSessionReset(resetsAt: number, now: number): string {
  const minutes = Math.max(1, Math.ceil((resetsAt - now) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `em ${rest}min`;
  return rest === 0 ? `em ${hours}h` : `em ${hours}h ${rest}min`;
}

const WEEKDAYS_ABBR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "seg, 09:00", na hora local. */
export function formatWeeklyReset(resetsAt: number): string {
  const date = new Date(resetsAt);
  return `${WEEKDAYS_ABBR[date.getDay()]}, ${formatClock(date)}`;
}
