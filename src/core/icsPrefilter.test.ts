import { describe, expect, it } from 'vitest';
import { dropFarEvents } from './icsPrefilter.js';
import { parseIcsEvents } from './icsEvents.js';

const FROM = new Date(2026, 9, 18);
const TO = new Date(2026, 9, 19);

function vevent(lines: string): string {
  return `BEGIN:VEVENT\r\n${lines.split('\n').join('\r\n')}\r\nEND:VEVENT\r\n`;
}
const wrap = (body: string) => `BEGIN:VCALENDAR\r\nX-WR-CALNAME:Eu\r\n${body}END:VCALENDAR\r\n`;
const kept = (text: string) => (text.match(/SUMMARY:[^\r\n]*/g) ?? []).map((s) => s.slice(8));

describe('dropFarEvents', () => {
  it('descarta o evento único que termina muito antes ou começa muito depois', () => {
    const text = wrap(
      vevent('SUMMARY:antigo\nDTSTART:20200101T100000Z\nDTEND:20200101T110000Z') +
        vevent('SUMMARY:futuro\nDTSTART:20300101T100000Z\nDTEND:20300101T110000Z') +
        vevent('SUMMARY:hoje\nDTSTART:20261018T100000Z\nDTEND:20261018T110000Z'),
    );
    expect(kept(dropFarEvents(text, FROM, TO))).toEqual(['hoje']);
  });

  it('mantém o que tem margem de fuso: ontem à noite e amanhã cedo', () => {
    const text = wrap(
      vevent('SUMMARY:ontem\nDTSTART:20261017T230000Z\nDTEND:20261018T010000Z') +
        vevent('SUMMARY:amanha\nDTSTART:20261019T020000Z\nDTEND:20261019T030000Z'),
    );
    expect(kept(dropFarEvents(text, FROM, TO))).toEqual(['ontem', 'amanha']);
  });

  it('mantém o evento de vários dias que começou antes e cobre a janela', () => {
    const text = wrap(
      vevent('SUMMARY:viagem\nDTSTART;VALUE=DATE:20261010\nDTEND;VALUE=DATE:20261025'),
    );
    expect(kept(dropFarEvents(text, FROM, TO))).toEqual(['viagem']);
  });

  it('mantém recorrente, ocorrência editada, DURATION e bloco sem DTSTART legível', () => {
    const text = wrap(
      vevent('SUMMARY:rec\nDTSTART:20200101T100000Z\nRRULE:FREQ=DAILY') +
        vevent('SUMMARY:editada\nRECURRENCE-ID:20200105T100000Z\nDTSTART:20200105T100000Z') +
        vevent('SUMMARY:duracao\nDTSTART:20200101T100000Z\nDURATION:P1000D') +
        vevent('SUMMARY:estranho\nDTSTART:amanha'),
    );
    expect(kept(dropFarEvents(text, FROM, TO))).toEqual(['rec', 'editada', 'duracao', 'estranho']);
  });

  it('preserva o cabeçalho (VTIMEZONE) e o fim do feed', () => {
    const zone = 'BEGIN:VTIMEZONE\r\nTZID:X\r\nEND:VTIMEZONE\r\n';
    const text = wrap(
      zone + vevent('SUMMARY:antigo\nDTSTART:20200101T100000Z\nDTEND:20200101T110000Z'),
    );
    const out = dropFarEvents(text, FROM, TO);
    expect(out).toContain('BEGIN:VTIMEZONE');
    expect(out.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(out).not.toContain('VEVENT');
  });

  it('não muda o resultado do parser', () => {
    const text = wrap(
      vevent('UID:1\nSUMMARY:antigo\nDTSTART:20200101T100000Z\nDTEND:20200101T110000Z') +
        vevent('UID:2\nSUMMARY:hoje\nDTSTART:20261018T100000Z\nDTEND:20261018T110000Z') +
        vevent(
          'UID:3\nSUMMARY:rec\nDTSTART:20200101T090000Z\nDTEND:20200101T093000Z\nRRULE:FREQ=DAILY',
        ),
    );
    expect(parseIcsEvents(dropFarEvents(text, FROM, TO), FROM, TO)).toEqual(
      parseIcsEvents(text, FROM, TO),
    );
  });

  it('texto sem VEVENT volta igual', () => {
    expect(dropFarEvents('<html>login</html>', FROM, TO)).toBe('<html>login</html>');
  });
});
