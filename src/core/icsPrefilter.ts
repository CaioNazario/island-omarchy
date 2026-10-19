// O V4 do QML é cerca de 7× mais lento que o Node e o parser roda na thread da
// UI: um feed do Google com anos de histórico (milhares de eventos) levava ~1s
// para virar árvore. Quase tudo isso está a anos da janela, então os blocos
// `VEVENT` que certamente não a tocam saem do texto antes de `parseIcs`. Na
// dúvida o bloco fica: recorrente, ocorrência editada, `DURATION` ou datas que
// o filtro não lê.

// Ancorados no começo da linha: uma descrição dobrada que cite "BEGIN:VEVENT"
// começa a continuação com espaço e não corta o texto.
const BEGIN = '\nBEGIN:VEVENT';
const END = '\nEND:VEVENT';
const MARGIN_MS = 2 * 24 * 60 * 60 * 1000;

function dayKey(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** `AAAAMMDD` da propriedade (qualquer parâmetro ou hora); sem ela → `null`. */
function dateOf(block: string, name: string): string | null {
  const match = new RegExp(`(?:^|\\n)${name}[^:\\r\\n]*:(\\d{8})`).exec(block);
  return match ? (match[1] ?? null) : null;
}

function isAlwaysKept(block: string): boolean {
  return /\n(?:RRULE|RECURRENCE-ID|DURATION)[;:]/.test(block);
}

/** Só `true` com certeza: o evento termina antes de `fromKey` ou começa depois de `toKey`. */
function isFarOutside(block: string, fromKey: string, toKey: string): boolean {
  if (isAlwaysKept(block)) return false;
  const start = dateOf(block, 'DTSTART');
  if (start === null) return false;
  if (start > toKey) return true;
  const end = dateOf(block, 'DTEND') ?? start;
  return end < fromKey && start < fromKey;
}

/** `text` sem os `VEVENT` que certamente não tocam [`from`, `to`). */
export function dropFarEvents(text: string, from: Date, to: Date): string {
  const parts = text.split(BEGIN);
  const fromKey = dayKey(from.getTime() - MARGIN_MS);
  const toKey = dayKey(to.getTime() + MARGIN_MS);
  const out = [parts[0] ?? ''];
  for (const part of parts.slice(1)) {
    const end = part.indexOf(END);
    if (end < 0 || !isFarOutside(part.slice(0, end), fromKey, toKey)) out.push(BEGIN + part);
    else out.push(part.slice(end + END.length));
  }
  return out.join('');
}
