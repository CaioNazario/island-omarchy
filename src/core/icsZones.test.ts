import { describe, expect, it } from 'vitest';
import { parseIcs } from './icsParse.js';
import { parseOffsetMinutes, parseZones, zoneOffsetMinutes } from './icsZones.js';

const SAO_PAULO = `BEGIN:VCALENDAR
BEGIN:VTIMEZONE
TZID:America/Sao_Paulo
BEGIN:STANDARD
TZOFFSETFROM:-0300
TZOFFSETTO:-0300
TZNAME:-03
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
END:VCALENDAR`;

const NEW_YORK = `BEGIN:VCALENDAR
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
DTSTART:20070311T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
DTSTART:20071104T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
END:VCALENDAR`;

const wall = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h);

function secondSundayOfMarch(year: number): number {
  let sundays = 0;
  for (let d = 1; ; d++) {
    if (new Date(Date.UTC(year, 2, d)).getUTCDay() === 0 && ++sundays === 2) return d;
  }
}

describe('parseOffsetMinutes', () => {
  it('±HHMM e ±HHMMSS', () => {
    expect(parseOffsetMinutes('-0300')).toBe(-180);
    expect(parseOffsetMinutes('+0530')).toBe(330);
    expect(parseOffsetMinutes('-030000')).toBe(-180);
    expect(parseOffsetMinutes('abc')).toBeNull();
  });
});

describe('zoneOffsetMinutes', () => {
  it('fuso sem horário de verão (São Paulo) é fixo', () => {
    const zones = parseZones(parseIcs(SAO_PAULO));
    expect(zoneOffsetMinutes(zones.get('America/Sao_Paulo') ?? [], wall(2026, 10, 18))).toBe(-180);
  });

  it('fuso com horário de verão alterna pelas regras anuais', () => {
    const zone = parseZones(parseIcs(NEW_YORK)).get('America/New_York') ?? [];
    expect(zoneOffsetMinutes(zone, wall(2026, 7, 1))).toBe(-240);
    expect(zoneOffsetMinutes(zone, wall(2026, 12, 1))).toBe(-300);
    expect(zoneOffsetMinutes(zone, wall(2026, 1, 15))).toBe(-300);
    // 2026: começa em 8 de março e termina em 1º de novembro
    expect(zoneOffsetMinutes(zone, wall(2026, 3, 7))).toBe(-300);
    expect(zoneOffsetMinutes(zone, wall(2026, 3, 9))).toBe(-240);
    expect(zoneOffsetMinutes(zone, wall(2026, 10, 31))).toBe(-240);
    expect(zoneOffsetMinutes(zone, wall(2026, 11, 2))).toBe(-300);
  });

  it('o horário de verão começa no segundo domingo de março em todo ano', () => {
    const zone = parseZones(parseIcs(NEW_YORK)).get('America/New_York') ?? [];
    for (let year = 2008; year < 2100; year++) {
      const sunday = secondSundayOfMarch(year);
      expect(zoneOffsetMinutes(zone, wall(year, 3, sunday - 1)), `${year}`).toBe(-300);
      expect(zoneOffsetMinutes(zone, wall(year, 3, sunday)), `${year}`).toBe(-240);
    }
  });

  it('sem observâncias, UTC', () => {
    expect(zoneOffsetMinutes([], wall(2026, 1, 1))).toBe(0);
  });
});

// Revisão do marketplace (#13501): o VTIMEZONE vem do feed, e cada conversão
// de horário de cada evento expandia as regras de todas as observâncias.
describe('parseZones · fuso hostil', () => {
  const zoneWith = (observances: string[]) =>
    `BEGIN:VCALENDAR\nBEGIN:VTIMEZONE\nTZID:X\n${observances.join('\n')}\nEND:VTIMEZONE\nEND:VCALENDAR`;
  const observance = (onset: string, offset: string, rule = '') =>
    `BEGIN:STANDARD\nTZOFFSETFROM:-0300\nTZOFFSETTO:${offset}\nDTSTART:${onset}${rule ? `\nRRULE:${rule}` : ''}\nEND:STANDARD`;

  it('descarta a observância com regra mais pesada que uma de horário de verão', () => {
    const heavy = 'FREQ=YEARLY;BYMONTH=1,2,3,4,5,6,7,8,9,10,11,12;BYDAY=MO,TU,WE,TH,FR,SA,SU';
    const text = zoneWith([
      observance('19700101T000000', '-0300'),
      observance('19800101T000000', '-0200', heavy),
    ]);
    const zone = parseZones(parseIcs(text)).get('X') ?? [];
    expect(zone).toHaveLength(1);
    expect(zoneOffsetMinutes(zone, wall(2026, 10, 18))).toBe(-180);
  });

  it('a regra de horário de verão com BYMONTHDAY e BYDAY continua valendo', () => {
    const rule = 'FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=8,9,10,11,12,13,14;BYDAY=SU';
    const text = zoneWith([observance('20070311T020000', '-0400', rule)]);
    expect(parseZones(parseIcs(text)).get('X')).toHaveLength(1);
  });

  it('um evento por ano não recalcula as regras a cada ano', () => {
    // Cada ano novo errava o cache: 32 observâncias × ~9.000 anos levavam ~2 s.
    const rule = 'FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=8,9,10,11,12,13,14;BYDAY=SU';
    const many = Array.from({ length: 32 }, (_, i) =>
      observance(`${1000 + i}0101T000000`, '-0200', rule),
    );
    const zone = parseZones(parseIcs(zoneWith(many))).get('X') ?? [];
    const started = Date.now();
    for (let year = 1100; year < 9900; year++) zoneOffsetMinutes(zone, wall(year, 3, 10));
    expect(Date.now() - started).toBeLessThan(500);
  });

  it('guarda só as 32 observâncias mais recentes', () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      observance(`${1980 + i}0101T000000`, i % 2 ? '-0200' : '-0400'),
    );
    const zone = parseZones(parseIcs(zoneWith(many))).get('X') ?? [];
    expect(zone).toHaveLength(32);
    expect(Math.min(...zone.map((o) => new Date(o.onsetMs).getUTCFullYear()))).toBe(1988);
    // A última (2019, ímpar) vale hoje.
    expect(zoneOffsetMinutes(zone, wall(2026, 10, 18))).toBe(-120);
  });
});
