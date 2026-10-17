// Widget Progresso do dia (specs/16-widgets.md `progress`; design/logic.js
// `widgetData` `progress`).

const MINUTES_PER_PERCENT = 14.4;

/** % do dia já passado, pelos minutos desde 00:00. */
export function dayProgress(now: Date): number {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return Math.round(minutes / MINUTES_PER_PERCENT);
}

/** Milissegundos até a virada do próximo minuto. */
export function msUntilNextMinute(now: Date): number {
  return 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
}
