import { describe, expect, it } from 'vitest';
import { parseIcsEvents } from './icsEvents.js';
import { todayEvents } from './calendar.js';

const SAO_PAULO_ZONE = `BEGIN:VTIMEZONE
TZID:America/Sao_Paulo
BEGIN:STANDARD
TZOFFSETFROM:-0300
TZOFFSETTO:-0300
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE`;

function feed(...events: string[]): string {
  const body = events.map((e) => `BEGIN:VEVENT\n${e}\nEND:VEVENT`).join('\n');
  return `BEGIN:VCALENDAR\nX-WR-CALNAME:Eu\n${SAO_PAULO_ZONE}\n${body}\nEND:VCALENDAR`;
}

// 2026-10-18 00:00 local → janela de um dia
const FROM = new Date(2026, 9, 18);
const TO = new Date(2026, 9, 19);
const parse = (text: string, from = FROM, to = TO) => parseIcsEvents(text, from, to);

describe('parseIcsEvents · evento único', () => {
  it('UTC vira o instante certo', () => {
    const [event] = parse(
      feed('UID:a\nSUMMARY:Dentista\nDTSTART:20261018T120000Z\nDTEND:20261018T130000Z'),
    );
    expect(event?.summary).toBe('Dentista');
    expect(event?.start.toISOString()).toBe('2026-10-18T12:00:00.000Z');
    expect(event?.end.toISOString()).toBe('2026-10-18T13:00:00.000Z');
  });

  it('TZID usa o VTIMEZONE do feed, não o fuso da máquina', () => {
    const [event] = parse(
      feed(
        'UID:a\nSUMMARY:x\nDTSTART;TZID=America/Sao_Paulo:20261018T090000\nDTEND;TZID=America/Sao_Paulo:20261018T100000',
      ),
      new Date('2026-10-18T00:00:00Z'),
      new Date('2026-10-19T00:00:00Z'),
    );
    expect(event?.start.toISOString()).toBe('2026-10-18T12:00:00.000Z');
  });

  it('flutuante e dia inteiro usam o relógio local', () => {
    const [timed, allDay] = parse(
      feed(
        'UID:a\nSUMMARY:a\nDTSTART:20261018T080000\nDTEND:20261018T090000',
        'UID:b\nSUMMARY:b\nDTSTART;VALUE=DATE:20261018\nDTEND;VALUE=DATE:20261019',
      ),
    );
    expect(timed?.start).toEqual(new Date(2026, 9, 18, 8));
    expect(allDay?.start).toEqual(new Date(2026, 9, 18));
    expect(allDay?.end).toEqual(new Date(2026, 9, 19));
  });

  it('sem DTEND: dia inteiro dura um dia, com hora dura zero; DURATION vale', () => {
    const events = parse(
      feed(
        'UID:a\nSUMMARY:a\nDTSTART;VALUE=DATE:20261018',
        'UID:b\nSUMMARY:b\nDTSTART:20261018T080000',
        'UID:c\nSUMMARY:c\nDTSTART:20261018T080000\nDURATION:PT45M',
      ),
    );
    const [a, b, c] = events;
    expect(a?.end).toEqual(new Date(2026, 9, 19));
    expect(b?.end).toEqual(b?.start);
    expect(c?.end).toEqual(new Date(2026, 9, 18, 8, 45));
  });

  it('descarta evento fora da janela e CANCELLED', () => {
    const events = parse(
      feed(
        'UID:a\nSUMMARY:ontem\nDTSTART:20261017T080000\nDTEND:20261017T090000',
        'UID:b\nSUMMARY:cancelado\nSTATUS:CANCELLED\nDTSTART:20261018T080000\nDTEND:20261018T090000',
      ),
    );
    expect(events).toEqual([]);
  });

  it('desescapa o título e ignora evento sem DTSTART', () => {
    const events = parse(
      feed(
        'UID:a\nSUMMARY:Almoço\\, com a Ana\nDTSTART:20261018T120000\nDTEND:20261018T130000',
        'UID:b\nSUMMARY:sem data',
      ),
    );
    expect(events.map((e) => e.summary)).toEqual(['Almoço, com a Ana']);
  });

  it('o id começa com o calendário, como o `todayEvents` espera', () => {
    const [event] = parse(
      feed('UID:abc\nSUMMARY:x\nDTSTART:20261018T120000\nDTEND:20261018T130000'),
    );
    expect(event?.id.split('\n')[0]).toBe('Eu');
    expect(event?.id.split('\n')[1]).toBe('abc');
  });
});

describe('parseIcsEvents · recorrência', () => {
  const daily =
    'UID:r\nSUMMARY:Daily\nDTSTART;TZID=America/Sao_Paulo:20260101T090000\nDTEND;TZID=America/Sao_Paulo:20260101T093000';
  const window = [new Date('2026-10-18T00:00:00Z'), new Date('2026-10-19T00:00:00Z')] as const;

  it('expande a regra para dentro da janela, só com a ocorrência de hoje', () => {
    const events = parse(feed(`${daily}\nRRULE:FREQ=DAILY`), ...window);
    expect(events).toHaveLength(1);
    expect(events[0]?.start.toISOString()).toBe('2026-10-18T12:00:00.000Z');
    expect(events[0]?.end.toISOString()).toBe('2026-10-18T12:30:00.000Z');
  });

  it('UNTIL em UTC encerra a série', () => {
    expect(parse(feed(`${daily}\nRRULE:FREQ=DAILY;UNTIL=20261017T235959Z`), ...window)).toEqual([]);
    expect(
      parse(feed(`${daily}\nRRULE:FREQ=DAILY;UNTIL=20261018T235959Z`), ...window),
    ).toHaveLength(1);
  });

  it('COUNT conta desde o início da série', () => {
    expect(parse(feed(`${daily}\nRRULE:FREQ=DAILY;COUNT=10`), ...window)).toEqual([]);
  });

  it('EXDATE remove só aquela ocorrência', () => {
    const exdate = 'EXDATE;TZID=America/Sao_Paulo:20261018T090000';
    expect(parse(feed(`${daily}\nRRULE:FREQ=DAILY\n${exdate}`), ...window)).toEqual([]);
  });

  it('RECURRENCE-ID troca a ocorrência pela versão editada', () => {
    const moved =
      'UID:r\nSUMMARY:Daily adiada\nRECURRENCE-ID;TZID=America/Sao_Paulo:20261018T090000\nDTSTART;TZID=America/Sao_Paulo:20261018T150000\nDTEND;TZID=America/Sao_Paulo:20261018T153000';
    const events = parse(feed(`${daily}\nRRULE:FREQ=DAILY`, moved), ...window);
    expect(events.map((e) => e.summary)).toEqual(['Daily adiada']);
    expect(events[0]?.start.toISOString()).toBe('2026-10-18T18:00:00.000Z');
  });

  it('ocorrência movida para a janela aparece mesmo com o original fora dela', () => {
    const moved =
      'UID:r\nSUMMARY:Veio de outro dia\nRECURRENCE-ID;TZID=America/Sao_Paulo:20261020T090000\nDTSTART;TZID=America/Sao_Paulo:20261018T150000\nDTEND;TZID=America/Sao_Paulo:20261018T153000';
    const events = parse(feed(`${daily}\nRRULE:FREQ=DAILY;COUNT=1`, moved), ...window);
    expect(events.map((e) => e.summary)).toEqual(['Veio de outro dia']);
  });

  it('override CANCELLED some com a ocorrência', () => {
    const gone =
      'UID:r\nSTATUS:CANCELLED\nRECURRENCE-ID;TZID=America/Sao_Paulo:20261018T090000\nDTSTART;TZID=America/Sao_Paulo:20261018T090000';
    expect(parse(feed(`${daily}\nRRULE:FREQ=DAILY`, gone), ...window)).toEqual([]);
  });

  it('RRULE que o parser não suporta mantém o evento só na data de início', () => {
    const hourly =
      'UID:h\nSUMMARY:h\nDTSTART:20261018T080000\nDTEND:20261018T090000\nRRULE:FREQ=HOURLY';
    expect(parse(feed(hourly))).toHaveLength(1);
  });

  it('feed com um evento por dia durante anos continua rápido', () => {
    const events: string[] = [];
    for (let i = 0; i < 3000; i++)
      events.push(
        `UID:e${i}\nSUMMARY:e\nDTSTART:2020010${(i % 9) + 1}T080000\nDTEND:2020010${(i % 9) + 1}T090000`,
      );
    const started = Date.now();
    parse(feed(...events, `${daily}\nRRULE:FREQ=DAILY`));
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe('parseIcsEvents · com o todayEvents', () => {
  it('lista de hoje em ordem, com "Dia inteiro"', () => {
    const events = parse(
      feed(
        'UID:a\nSUMMARY:Tarde\nDTSTART:20261018T150000\nDTEND:20261018T160000',
        'UID:b\nSUMMARY:Feriado\nDTSTART;VALUE=DATE:20261018\nDTEND;VALUE=DATE:20261019',
      ),
    );
    const today = todayEvents(events, new Date(2026, 9, 18, 10), 'pt-BR');
    expect(today.map((e) => [e.name, e.time])).toEqual([
      ['Feriado', 'Dia inteiro'],
      ['Tarde', '15:00 – 16:00'],
    ]);
  });
});

describe('parseIcsEvents · entrada ruim', () => {
  it('texto que não é ICS → lista vazia', () => {
    expect(parse('<html>login</html>')).toEqual([]);
    expect(parse('')).toEqual([]);
  });
});
