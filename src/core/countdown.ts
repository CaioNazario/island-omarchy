// Widget Contagem regressiva (specs/16-widgets.md `countdown`): a data vem de
// GSettings `countdown-date` como `AAAA-MM-DD` (specs/13-preferencias.md).

export const MAX_COUNTDOWN_NAME = 20;

export interface CalendarDate {
  year: number;
  /** 1–12. */
  month: number;
  day: number;
}

/** `AAAA-MM-DD` válido vira data; vazio ou dia inexistente vira `null`. */
export function parseIsoDate(text: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day };
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function toIsoDate({ year, month, day }: CalendarDate): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** `DD/MM/AAAA`, como a data aparece nas preferências. */
export function formatDate({ year, month, day }: CalendarDate): string {
  return `${pad(day)}/${pad(month)}/${year}`;
}

const DAY_MS = 86_400_000;

/** Dias de calendário de `today` (data local) até `target`; negativo se já passou. */
export function daysUntil(today: Date, target: CalendarDate): number {
  const from = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const to = Date.UTC(target.year, target.month - 1, target.day);
  return Math.round((to - from) / DAY_MS);
}

export interface CountdownView {
  label: string;
  /** Sem data: rótulo `neutral-400`, sem sub e com clique. */
  missingDate: boolean;
  sub?: string;
}

function remaining(days: number): string {
  if (days < 0) return 'encerrada';
  if (days === 0) return 'hoje';
  return days === 1 ? '1 dia' : `${days} dias`;
}

export function countdownView(name: string, dateText: string, today: Date): CountdownView {
  const date = parseIsoDate(dateText);
  if (!date) return { label: 'Sem data', missingDate: true };
  return {
    label: name.trim() || 'Contagem',
    missingDate: false,
    sub: remaining(daysUntil(today, date)),
  };
}
