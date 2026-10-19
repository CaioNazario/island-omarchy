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

  it('sem observâncias, UTC', () => {
    expect(zoneOffsetMinutes([], wall(2026, 1, 1))).toBe(0);
  });
});
