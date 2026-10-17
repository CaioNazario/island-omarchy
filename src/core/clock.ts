// Formatação de hora/dia do modo compacto (specs/03-ilha.md, "Modo compacto").

const WEEKDAYS_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function formatClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDay(date: Date): string {
  const weekday = WEEKDAYS_ABBR[date.getDay()];
  return `${weekday}, ${date.getDate()}`;
}
