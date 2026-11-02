import { describe, expect, it } from 'vitest';
import { MAX_SUMMARY_CHARS, parseIcsEvents } from './icsEvents.js';
import { todayEvents } from './calendar.js';
import { MAX_FEED_BYTES } from './icsFeed.js';
import { MAX_FEED_EVENTS } from './icsPrefilter.js';

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

describe('parseIcsEvents · feed hostil', () => {
  // Os 77 BYDAY distintos que o parser aceita: a lista mais pesada possível.
  const ALL_BYDAY = ['', '1', '2', '3', '4', '5', '-1', '-2', '-3', '-4', '-5']
    .flatMap((ord) => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day) => ord + day))
    .join(',');

  // Revisão do marketplace (#13501): com COUNT a expansão não salta até a
  // janela, e cada série varria até 20.000 dias desde 1970. O orçamento é do
  // feed inteiro: esgotado, as séries seguintes param, e o evento simples
  // continua aparecendo.
  it('muitas séries COUNT que nunca casam não tiram o evento simples', () => {
    const hostile = Array.from(
      { length: 200 },
      (_, i) =>
        `UID:h${i}\nSUMMARY:x\nDTSTART:19700101T090000Z\nDTEND:19700101T100000Z\nRRULE:FREQ=DAILY;COUNT=999999;BYMONTH=2;BYMONTHDAY=30`,
    );
    const simple = 'UID:a\nSUMMARY:Dentista\nDTSTART:20261018T120000Z\nDTEND:20261018T130000Z';
    const started = Date.now();
    const events = parse(feed(...hostile, simple));
    expect(events.map((e) => e.summary)).toEqual(['Dentista']);
    // Folga larga para máquina lenta; sem o orçamento passava de 3 s.
    expect(Date.now() - started).toBeLessThan(1500);
  });

  // 4º apontamento: o orçamento contava períodos, e um período YEARLY com os
  // 12 meses e os 77 BYDAY custa milhares de checagens. Agora conta trabalho.
  it('séries YEARLY com todos os meses e todos os BYDAY não travam o feed', () => {
    const rule = `FREQ=YEARLY;COUNT=999999999;BYMONTH=1,2,3,4,5,6,7,8,9,10,11,12;BYDAY=${ALL_BYDAY}`;
    const hostile = Array.from(
      { length: 30 },
      (_, i) =>
        `UID:y${i}\nSUMMARY:x\nDTSTART:19000101T090000Z\nDTEND:19000101T100000Z\nRRULE:${rule}`,
    );
    const simple = 'UID:a\nSUMMARY:Dentista\nDTSTART:20261018T120000Z\nDTEND:20261018T130000Z';
    const started = Date.now();
    const events = parse(feed(...hostile, simple));
    expect(events.map((e) => e.summary)).toContain('Dentista');
    // Contando períodos, 30 séries levavam ~3,6 s no Node.
    expect(Date.now() - started).toBeLessThan(1500);
  });

  // O VTIMEZONE também é do feed: cada conversão de horário expandia as regras
  // de todas as observâncias, sem orçamento.
  it('um fuso com regras pesadas não multiplica o custo de cada evento', () => {
    const heavy = `FREQ=YEARLY;BYMONTH=1,2,3,4,5,6,7,8,9,10,11,12;BYDAY=${ALL_BYDAY}`;
    const observances = Array.from(
      { length: 10 },
      (_, i) =>
        `BEGIN:DAYLIGHT\nTZOFFSETFROM:-0300\nTZOFFSETTO:-0200\nDTSTART:${1970 + i}0101T000000\nRRULE:${heavy}\nEND:DAYLIGHT`,
    );
    const zone = `BEGIN:VTIMEZONE\nTZID:Hostil\n${observances.join('\n')}\nEND:VTIMEZONE`;
    const events = Array.from(
      { length: 1000 },
      (_, i) =>
        `BEGIN:VEVENT\nUID:e${i}\nSUMMARY:x\nDTSTART;TZID=Hostil:20261018T090000\nDURATION:PT1H\nEND:VEVENT`,
    );
    const text = `BEGIN:VCALENDAR\n${zone}\n${events.join('\n')}\nEND:VCALENDAR`;
    const started = Date.now();
    expect(parse(text)).toHaveLength(1000);
    // Sem limite nas regras do fuso, levava ~3 s no Node.
    expect(Date.now() - started).toBeLessThan(1500);
  });

  // 5º apontamento: os eventos se juntavam com `concat`, que copia a lista
  // inteira a cada evento, e evento simples não gasta o orçamento. 100 mil
  // eventos no mesmo dia cabem nos 10 MB: ~5 bilhões de cópias.
  it('100 mil eventos simples no mesmo dia não travam o feed', () => {
    const plain = Array.from(
      { length: 100_000 },
      (_, i) => `UID:p${i}\nDTSTAMP:20261018T000000Z\nSUMMARY:x\nDTSTART:20261018T120000Z`,
    );
    const text = feed('UID:a\nSUMMARY:Dentista\nDTSTART:20261018T120000Z', ...plain);
    expect(text.length).toBeLessThan(MAX_FEED_BYTES);
    const started = Date.now();
    const events = parse(text);
    expect(events[0]?.summary).toBe('Dentista');
    expect(events).toHaveLength(MAX_FEED_EVENTS);
    // Com `concat`, levava ~26 s no Node.
    expect(Date.now() - started).toBeLessThan(1500);
  });

  // O nome vai para um Text (e um TextMetrics) a cada minuto: 1 milhão de
  // caracteres custava ~0,8 s no QML, e o feed aceita ~10 milhões.
  it('corta o nome do evento em MAX_SUMMARY_CHARS', () => {
    const long = 'x'.repeat(100_000);
    const [event] = parse(feed(`UID:a\nSUMMARY:${long}\nDTSTART:20261018T120000Z`));
    expect(event?.summary).toBe('x'.repeat(MAX_SUMMARY_CHARS));
  });

  it('muitos VCALENDAR não multiplicam a leitura dos fusos', () => {
    const calendars = Array.from(
      { length: 50_000 },
      () => 'BEGIN:VCALENDAR\nBEGIN:X\nEND:X\nEND:VCALENDAR',
    );
    const text = `${feed('UID:a\nSUMMARY:Dentista\nDTSTART:20261018T120000Z')}\n${calendars.join('\n')}`;
    const started = Date.now();
    expect(parse(text).map((e) => e.summary)).toEqual(['Dentista']);
    expect(Date.now() - started).toBeLessThan(1500);
  });
});

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
