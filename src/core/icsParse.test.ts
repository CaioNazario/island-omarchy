import { describe, expect, it } from 'vitest';
import { parseIcs, parseProperty, unfoldLines, unescapeText } from './icsParse.js';

describe('unfoldLines', () => {
  it('junta a linha dobrada (espaço ou tab) com a anterior', () => {
    expect(unfoldLines('SUMMARY:Reuni\r\n ao longa\r\n\tmesmo\r\nX:1')).toEqual([
      'SUMMARY:Reuniao longamesmo',
      'X:1',
    ]);
  });

  it('ignora linhas vazias', () => {
    expect(unfoldLines('A:1\n\nB:2\n')).toEqual(['A:1', 'B:2']);
  });
});

describe('parseProperty', () => {
  it('separa nome, parâmetros e valor', () => {
    expect(parseProperty('DTSTART;TZID=America/Sao_Paulo:20261018T090000')).toEqual({
      name: 'DTSTART',
      params: { TZID: 'America/Sao_Paulo' },
      value: '20261018T090000',
    });
  });

  it('o primeiro ":" fora de aspas separa o valor, que pode ter ":"', () => {
    const prop = parseProperty('ATTENDEE;CN="A: B":mailto:a@b.c');
    expect(prop?.params).toEqual({ CN: 'A: B' });
    expect(prop?.value).toBe('mailto:a@b.c');
  });

  it('nome em maiúsculas; linha sem ":" não é propriedade', () => {
    expect(parseProperty('summary:x')?.name).toBe('SUMMARY');
    expect(parseProperty('sem dois pontos')).toBeNull();
  });
});

describe('parseIcs', () => {
  it('monta a árvore BEGIN/END', () => {
    const root = parseIcs(
      'BEGIN:VCALENDAR\nX-WR-CALNAME:Eu\nBEGIN:VEVENT\nSUMMARY:A\nEND:VEVENT\nEND:VCALENDAR',
    );
    const calendar = root.children[0]!;
    expect(calendar.name).toBe('VCALENDAR');
    expect(calendar.props[0]?.value).toBe('Eu');
    expect(calendar.children[0]?.name).toBe('VEVENT');
    expect(calendar.children[0]?.props[0]?.value).toBe('A');
  });

  it('END sem BEGIN não derruba o parser', () => {
    expect(parseIcs('END:VEVENT\nSUMMARY:x').props).toHaveLength(1);
  });
});

describe('unescapeText', () => {
  it('desfaz \\n, \\, \; e \\\\', () => {
    expect(unescapeText('a\\nb\\, c\; d\\\\e')).toBe('a b, c; d\\e');
  });
});
