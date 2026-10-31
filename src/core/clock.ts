// Formatação de hora/dia do modo compacto (specs/03-ilha.md, "Modo compacto").
// O relógio fica em 24h nos dois idiomas, como no design.

import { tr, weekdayShort, type Language } from './i18n.js';

export function formatClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** `Fri 25` em inglês, `Sex, 25` em português. */
export function formatDay(date: Date, lang: Language): string {
  return tr(lang, '{weekday} {day}', {
    weekday: weekdayShort(lang, date.getDay()),
    day: date.getDate(),
  });
}
