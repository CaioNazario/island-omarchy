import { describe, expect, it } from 'vitest';
import {
  nextEvent,
  monthGrid,
  todayEvents,
  todayTitle,
  visibleWeeks,
  WEEKDAY_HEADERS,
  type CalendarDay,
  type CalendarEvent,
} from './calendar.js';

// 2026-09-25 é uma sexta-feira.
const TODAY = new Date(2026, 8, 25, 14, 30);

const days = (week: CalendarDay[]) => week.map((d) => d.day);
const kinds = (week: CalendarDay[]) => week.map((d) => d.kind);

describe('WEEKDAY_HEADERS', () => {
  it('começa na segunda', () => {
    expect(WEEKDAY_HEADERS).toEqual(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']);
  });
});

describe('monthGrid', () => {
  it('monta o mês atual em semanas inteiras com hoje marcado', () => {
    const grid = monthGrid(TODAY, 0);
    expect(grid.title).toBe('Setembro 2026');
    expect(grid.weeks.map(days)).toEqual([
      [31, 1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12, 13],
      [14, 15, 16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25, 26, 27],
      [28, 29, 30, 1, 2, 3, 4],
    ]);
    expect(kinds(grid.weeks[0]!)).toEqual([
      'outside',
      'in-month',
      'in-month',
      'in-month',
      'in-month',
      'in-month',
      'in-month',
    ]);
    expect(grid.weeks[3]![4]).toEqual({ day: 25, kind: 'today' });
    expect(grid.weeks[4]!.slice(3).every((d) => d.kind === 'outside')).toBe(true);
  });

  it.each([
    ['segunda', -3, 'Junho 2026', [1, 2, 3, 4, 5, 6, 7]],
    ['terça', 0, 'Setembro 2026', [31, 1, 2, 3, 4, 5, 6]],
    ['quarta', -5, 'Abril 2026', [30, 31, 1, 2, 3, 4, 5]],
    ['quinta', -8, 'Janeiro 2026', [29, 30, 31, 1, 2, 3, 4]],
    ['sexta', -4, 'Maio 2026', [27, 28, 29, 30, 1, 2, 3]],
    ['sábado', -1, 'Agosto 2026', [27, 28, 29, 30, 31, 1, 2]],
    ['domingo', -7, 'Fevereiro 2026', [26, 27, 28, 29, 30, 31, 1]],
  ])('mês começando na %s completa a semana com o mês anterior', (_, offset, title, first) => {
    const grid = monthGrid(TODAY, offset);
    expect(grid.title).toBe(title);
    expect(days(grid.weeks[0]!)).toEqual(first);
    const lead = first.indexOf(1);
    expect(grid.weeks[0]!.slice(0, lead).every((d) => d.kind === 'outside')).toBe(true);
    expect(grid.weeks[0]![lead]!.kind).toBe('in-month');
  });

  it('usa só as semanas necessárias', () => {
    // Fevereiro de 2021: começa na segunda e cabe em 4 semanas exatas.
    const feb2021 = monthGrid(new Date(2021, 1, 10), 0);
    expect(feb2021.weeks).toHaveLength(4);
    expect(feb2021.weeks.flat().every((d) => d.kind !== 'outside')).toBe(true);
    // Agosto de 2026: começa no sábado e precisa de 6.
    expect(monthGrid(TODAY, -1).weeks).toHaveLength(6);
  });

  it('inclui o 29 de fevereiro em ano bissexto', () => {
    const grid = monthGrid(TODAY, 17);
    expect(grid.title).toBe('Fevereiro 2028');
    expect(grid.weeks.at(-1)?.map((d) => [d.day, d.kind])).toEqual([
      [28, 'in-month'],
      [29, 'in-month'],
      [1, 'outside'],
      [2, 'outside'],
      [3, 'outside'],
      [4, 'outside'],
      [5, 'outside'],
    ]);
  });

  it('navega entre anos', () => {
    expect(monthGrid(TODAY, 4).title).toBe('Janeiro 2027');
    expect(days(monthGrid(TODAY, 4).weeks[0]!)).toEqual([28, 29, 30, 31, 1, 2, 3]);
    expect(monthGrid(TODAY, -9).title).toBe('Dezembro 2025');
    expect(monthGrid(TODAY, 24).title).toBe('Setembro 2028');
  });

  it('só marca hoje no mês de hoje, fora dele nenhum dia é hoje', () => {
    expect(
      monthGrid(TODAY, 2)
        .weeks.flat()
        .some((d) => d.kind === 'today'),
    ).toBe(false);
  });

  it('marca hoje mesmo como dia de fora num mês vizinho, como no design', () => {
    const lastOfSeptember = new Date(2026, 8, 30);
    const october = monthGrid(lastOfSeptember, 1);
    expect(october.weeks[0]![2]).toEqual({ day: 30, kind: 'today' });
    expect(october.weekIndex).toBe(0);
  });
});

describe('visibleWeeks', () => {
  it('em Semana mostra a linha de hoje no mês atual', () => {
    expect(visibleWeeks(monthGrid(TODAY, 0), 'week').map(days)).toEqual([
      [21, 22, 23, 24, 25, 26, 27],
    ]);
  });

  it('em Semana mostra a primeira linha nos outros meses', () => {
    expect(visibleWeeks(monthGrid(TODAY, 1), 'week').map(days)).toEqual([[28, 29, 30, 1, 2, 3, 4]]);
    expect(visibleWeeks(monthGrid(TODAY, -1), 'week').map(days)).toEqual([
      [27, 28, 29, 30, 31, 1, 2],
    ]);
  });

  it('em Mês mostra todas as linhas', () => {
    expect(visibleWeeks(monthGrid(TODAY, 0), 'month')).toHaveLength(5);
  });
});

const at = (day: number, hour: number, minute = 0) => new Date(2026, 8, day, hour, minute);
const event = (source: string, summary: string, start: Date, end: Date): CalendarEvent => ({
  id: `${source}\n${summary}\n`,
  summary,
  start,
  end,
});

describe('todayEvents', () => {
  it('lista só os eventos de hoje, por início, com o intervalo HH:MM – HH:MM', () => {
    const events = [
      event('google', 'Academia', at(25, 18), at(25, 19)),
      event('google', 'Ontem', at(24, 9), at(24, 10)),
      event('google', 'Reunião de equipe', at(25, 9), at(25, 10)),
      event('google', 'Amanhã', at(26, 9), at(26, 10)),
      event('google', 'Estudo Java', at(25, 14), at(25, 16, 30)),
    ];
    expect(todayEvents(events, TODAY).map(({ name, time }) => [name, time])).toEqual([
      ['Reunião de equipe', '09:00 – 10:00'],
      ['Estudo Java', '14:00 – 16:30'],
      ['Academia', '18:00 – 19:00'],
    ]);
  });

  it('mostra "Dia inteiro" para evento que cobre o dia todo', () => {
    const events = [
      event('local', 'Feriado', at(25, 0), at(26, 0)),
      event('local', 'Viagem', at(23, 0), at(28, 0)),
    ];
    expect(todayEvents(events, TODAY).map((e) => e.time)).toEqual(['Dia inteiro', 'Dia inteiro']);
  });

  it('mostra o horário de um evento que atravessa a meia-noite', () => {
    const events = [event('local', 'Plantão', at(24, 22), at(25, 2))];
    expect(todayEvents(events, TODAY)[0]?.time).toBe('22:00 – 02:00');
  });

  it('inclui evento de duração zero e mostra só o início', () => {
    const events = [event('local', 'Lembrete', at(25, 8, 15), at(25, 8, 15))];
    expect(todayEvents(events, TODAY)).toEqual([
      { name: 'Lembrete', time: '08:15', dot: 'accent500' },
    ]);
  });

  it('não inclui evento que termina à meia-noite de hoje', () => {
    const events = [event('local', 'Ontem à noite', at(24, 21), at(25, 0))];
    expect(todayEvents(events, TODAY)).toEqual([]);
  });

  it('mostra no máximo os 10 primeiros, por início', () => {
    const events = Array.from({ length: 12 }, (_, i) =>
      event('local', `E${11 - i}`, at(25, 11 - i), at(25, 12 - i)),
    );
    expect(todayEvents(events, TODAY).map((e) => e.name)).toEqual([
      'E0',
      'E1',
      'E2',
      'E3',
      'E4',
      'E5',
      'E6',
      'E7',
      'E8',
      'E9',
    ]);
  });

  it('dá uma cor da ilha por calendário, na ordem em que aparecem', () => {
    const events = [
      event('google', 'A', at(25, 8), at(25, 9)),
      event('trabalho', 'B', at(25, 10), at(25, 11)),
      event('google', 'C', at(25, 12), at(25, 13)),
      event('aniversarios', 'D', at(25, 14), at(25, 15)),
      event('nextcloud', 'E', at(25, 16), at(25, 17)),
    ];
    expect(todayEvents(events, TODAY).map((e) => e.dot)).toEqual([
      'accent500',
      'accent300',
      'accent500',
      'neutral400',
      'accent500',
    ]);
  });
});

describe('todayTitle', () => {
  it('usa o dia da semana minúsculo', () => {
    expect(todayTitle(TODAY)).toBe('Hoje, sex, 25');
    expect(todayTitle(new Date(2026, 8, 27))).toBe('Hoje, dom, 27');
  });
});

describe('nextEvent', () => {
  const now = new Date(2026, 8, 30, 9, 0);
  const at = (h: number, m = 0, day = 30): Date => new Date(2026, 8, day, h, m);
  const event = (summary: string, start: Date, end = start) => ({
    id: `cal\n${summary}\n`,
    summary,
    start,
    end,
  });

  it('sem eventos: "Sem eventos" hoje', () => {
    expect(nextEvent([], now)).toEqual({ label: 'Sem eventos', sub: 'hoje' });
  });

  it('ignora eventos já começados e os de amanhã', () => {
    const events = [event('Daily', at(8, 30), at(9, 30)), event('Amanhã', at(10, 0, 31))];
    expect(nextEvent(events, now)).toEqual({ label: 'Sem eventos', sub: 'hoje' });
  });

  it('sem próximo com hora, mostra o primeiro de dia inteiro', () => {
    const events = [
      event('Daily', at(8, 30), at(9, 30)),
      event('Viagem', at(0, 0, 29), at(0, 0, 32)),
      event('Feriado', at(0), at(0, 0, 31)),
    ];
    expect(nextEvent(events, now)).toEqual({ label: 'Viagem', sub: 'dia inteiro' });
  });

  it('o próximo com hora vem antes do dia inteiro', () => {
    const events = [event('Feriado', at(0), at(0, 0, 31)), event('Almoço', at(12, 0))];
    expect(nextEvent(events, now)).toEqual({ label: 'Almoço', sub: '12:00' });
  });

  it('até 90 min mostra quanto falta', () => {
    expect(nextEvent([event('Review', at(10, 30))], now)).toEqual({
      label: 'Review',
      sub: 'em 90 min',
    });
    expect(nextEvent([event('Review', at(9, 0, 30))], new Date(2026, 8, 30, 8, 59, 30)).sub).toBe(
      'em 1 min',
    );
  });

  it('depois de 90 min mostra a hora', () => {
    expect(nextEvent([event('Almoço', at(12, 0))], now)).toEqual({ label: 'Almoço', sub: '12:00' });
    expect(nextEvent([event('Review', at(10, 31))], now).sub).toBe('10:31');
  });

  it('escolhe o que começa primeiro', () => {
    const events = [event('Tarde', at(15)), event('Manhã', at(11)), event('Meio-dia', at(12))];
    expect(nextEvent(events, now).label).toBe('Manhã');
  });
});
