// Formatação de hora/dia do modo compacto (specs/03-ilha.md, "Modo compacto").
// A hora segue o idioma (specs/13-preferencias.md "Idioma"): 12h em inglês,
// 24h em português.

import { tr, weekdayShort, type Language } from './i18n.js';

const pad = (n: number) => String(n).padStart(2, '0');
const hour12 = (date: Date) => date.getHours() % 12 || 12;
const period = (date: Date) => (date.getHours() < 12 ? 'AM' : 'PM');

/** `9:41 PM` em inglês (meia-noite é `12:00 AM`), `21:41` em português. */
export function formatClock(date: Date, lang: Language): string {
  const mm = pad(date.getMinutes());
  if (lang === 'pt-BR') return `${pad(date.getHours())}:${mm}`;
  return `${hour12(date)}:${mm} ${period(date)}`;
}

/** `9`, `9:30`: hora de 12h sem os minutos na hora cheia. */
function shortClock12(date: Date): string {
  const minutes = date.getMinutes();
  return minutes === 0 ? `${hour12(date)}` : `${hour12(date)}:${pad(minutes)}`;
}

/**
 * Intervalo de um evento. Em inglês, como no Google Calendar en-US, o AM/PM
 * aparece uma vez quando é o mesmo e a hora cheia não leva `:00`
 * (`9 – 10:30 AM`, `11 AM – 12:30 PM`): na coluna estreita da ilha, o
 * `9:00 AM – 10:00 AM` cortava. Em português, `09:00 – 10:30`.
 */
export function formatClockRange(start: Date, end: Date, lang: Language): string {
  if (lang === 'pt-BR') return `${formatClock(start, lang)} – ${formatClock(end, lang)}`;
  const tail = `${shortClock12(end)} ${period(end)}`;
  if (period(start) === period(end)) return `${shortClock12(start)} – ${tail}`;
  return `${shortClock12(start)} ${period(start)} – ${tail}`;
}

/** `Fri 25` em inglês, `Sex, 25` em português. */
export function formatDay(date: Date, lang: Language): string {
  return tr(lang, '{weekday} {day}', {
    weekday: weekdayShort(lang, date.getDay()),
    day: date.getDate(),
  });
}
