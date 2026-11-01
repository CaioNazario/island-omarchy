import { describe, expect, it } from 'vitest';
import { expandWalls, parseRule, ruleWallsInYear } from './icsRecurrence.js';
import { msToParts } from './icsWall.js';

const at = (y: number, m: number, d: number, h = 9) => Date.UTC(y, m - 1, d, h);
const days = (walls: number[]) => walls.map((w) => msToParts(w).d);
const never = () => false;

function expand(rule: string, start: number, endWall: number): number[] {
  const parsed = parseRule(rule);
  if (!parsed) throw new Error(`regra inválida: ${rule}`);
  return expandWalls(parsed, start, (wall) => wall >= endWall);
}

describe('parseRule', () => {
  it('lê FREQ, INTERVAL, COUNT e BYDAY com ordinal', () => {
    const rule = parseRule('FREQ=MONTHLY;INTERVAL=2;COUNT=5;BYDAY=-1FR,MO');
    expect(rule).toMatchObject({ freq: 'MONTHLY', interval: 2, count: 5 });
    expect(rule?.byDay).toEqual([
      { ord: -1, day: 5 },
      { ord: 0, day: 1 },
    ]);
  });

  it('FREQ desconhecida (ex.: HOURLY) → null', () => {
    expect(parseRule('FREQ=HOURLY')).toBeNull();
    expect(parseRule('COUNT=3')).toBeNull();
  });

  // Revisão do marketplace (#13501): um feed controlado por terceiros não pode
  // forçar varreduras inúteis com listas impossíveis ou repetidas.
  it('ordinal de BYDAY fora de ±1…5 invalida a regra', () => {
    expect(parseRule('FREQ=MONTHLY;BYDAY=99MO')).toBeNull();
    expect(parseRule('FREQ=MONTHLY;BYDAY=6MO')).toBeNull();
    expect(parseRule('FREQ=MONTHLY;BYDAY=0MO')).toBeNull();
    expect(parseRule('FREQ=MONTHLY;BYDAY=-5MO')?.byDay).toEqual([{ ord: -5, day: 1 }]);
  });

  it('BYDAY, BYMONTHDAY ou BYMONTH com valor inválido invalida a regra', () => {
    expect(parseRule('FREQ=MONTHLY;BYDAY=1MO,XX')).toBeNull();
    expect(parseRule('FREQ=MONTHLY;BYMONTHDAY=32')).toBeNull();
    expect(parseRule('FREQ=MONTHLY;BYMONTHDAY=0')).toBeNull();
    expect(parseRule('FREQ=YEARLY;BYMONTH=13')).toBeNull();
    expect(parseRule('FREQ=YEARLY;BYMONTH=1x')).toBeNull();
  });

  it('valores repetidos entram uma vez só', () => {
    const rule = parseRule('FREQ=MONTHLY;BYDAY=1MO,1MO,1MO;BYMONTHDAY=5,5,-1,-1;BYMONTH=3,3');
    expect(rule?.byDay).toEqual([{ ord: 1, day: 1 }]);
    expect(rule?.byMonthDay).toEqual([5, -1]);
    expect(rule?.byMonth).toEqual([2]);
  });
});

describe('expandWalls', () => {
  it('diário com COUNT', () => {
    const walls = expand('FREQ=DAILY;COUNT=3', at(2026, 10, 18), at(2027, 1, 1));
    expect(days(walls)).toEqual([18, 19, 20]);
  });

  it('semanal sem BYDAY repete o dia da semana do início', () => {
    const walls = expand('FREQ=WEEKLY', at(2026, 10, 18), at(2026, 11, 9));
    expect(days(walls)).toEqual([18, 25, 1, 8]);
  });

  it('semanal quinzenal com BYDAY MO,WE', () => {
    // 2026-10-19 é segunda
    const walls = expand('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE', at(2026, 10, 19), at(2026, 11, 10));
    expect(days(walls)).toEqual([19, 21, 2, 4]);
  });

  it('mensal no mesmo dia pula meses que não têm o dia 31', () => {
    const walls = expand('FREQ=MONTHLY', at(2026, 1, 31), at(2026, 6, 1));
    expect(days(walls)).toEqual([31, 31, 31]);
    expect(walls.map((w) => msToParts(w).m)).toEqual([0, 2, 4]);
  });

  it('mensal na última sexta e na primeira segunda', () => {
    const last = expand('FREQ=MONTHLY;BYDAY=-1FR', at(2026, 9, 25), at(2026, 12, 1));
    expect(days(last)).toEqual([25, 30, 27]);
    const first = expand('FREQ=MONTHLY;BYDAY=1MO', at(2026, 10, 5), at(2026, 12, 1));
    expect(days(first)).toEqual([5, 2]);
  });

  it('mensal por BYMONTHDAY negativo (último dia)', () => {
    const walls = expand('FREQ=MONTHLY;BYMONTHDAY=-1', at(2026, 2, 28), at(2026, 5, 1));
    expect(days(walls)).toEqual([28, 31, 30]);
  });

  it('anual repete mês e dia; 29/02 só nos bissextos', () => {
    const birthday = expand('FREQ=YEARLY', at(2026, 10, 18), at(2029, 1, 1));
    expect(birthday.map((w) => msToParts(w).y)).toEqual([2026, 2027, 2028]);
    const leap = expand('FREQ=YEARLY', at(2024, 2, 29), at(2033, 1, 1));
    expect(leap.map((w) => msToParts(w).y)).toEqual([2024, 2028, 2032]);
  });

  it('o horário do início vale para todas as ocorrências', () => {
    const walls = expand('FREQ=DAILY;COUNT=2', at(2026, 10, 18, 14), at(2027, 1, 1));
    expect(walls.map((w) => msToParts(w).h)).toEqual([14, 14]);
  });

  it('para quando pastEnd diz que passou, sem COUNT nem UNTIL', () => {
    const rule = parseRule('FREQ=DAILY');
    expect(rule && expandWalls(rule, at(2026, 10, 18), (w) => w >= at(2026, 10, 21))).toHaveLength(
      3,
    );
  });

  it('regra que nunca casa termina (limite de períodos)', () => {
    const rule = parseRule('FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=30');
    expect(rule && expandWalls(rule, at(2026, 1, 1), never)).toEqual([]);
  });

  it('regra que nunca casa para no fim da janela, sem varrer todos os períodos', () => {
    // 30 de fevereiro: nenhum período gera data. A janela acaba um ano depois.
    const rule = parseRule('FREQ=MONTHLY;BYMONTH=2;BYMONTHDAY=30');
    const end = at(2027, 1, 1);
    const asked: number[] = [];
    const walls =
      rule &&
      expandWalls(rule, at(2026, 1, 1), (wall) => {
        asked.push(wall);
        return wall >= end;
      });
    expect(walls).toEqual([]);
    expect(asked.length).toBeGreaterThan(0);
    expect(asked.length).toBeLessThan(20);
  });

  it('para quando o orçamento de períodos compartilhado acaba', () => {
    // COUNT impede o salto até a janela: sem orçamento, varreria 20.000 dias.
    const rule = parseRule('FREQ=DAILY;COUNT=999999;BYMONTH=2;BYMONTHDAY=30');
    const budget = { periods: 100 };
    const asked: number[] = [];
    const walls =
      rule &&
      expandWalls(
        rule,
        at(1970, 1, 1),
        (wall) => {
          asked.push(wall);
          return wall >= at(2026, 11, 1);
        },
        at(1970, 1, 1),
        budget,
      );
    expect(walls).toEqual([]);
    expect(budget.periods).toBe(0);
    expect(asked.length).toBeLessThanOrEqual(100);
  });

  it('com COUNT, a regra que nunca casa também para no fim da janela', () => {
    const rule = parseRule('FREQ=DAILY;COUNT=3;BYMONTH=2;BYMONTHDAY=30');
    const asked: number[] = [];
    const walls =
      rule &&
      expandWalls(rule, at(2026, 1, 1), (wall) => {
        asked.push(wall);
        return wall >= at(2026, 3, 1);
      });
    expect(walls).toEqual([]);
    expect(asked.length).toBeGreaterThan(0);
    expect(asked.length).toBeLessThan(80);
  });
});

describe('expandWalls · salto até a janela', () => {
  const RULES = [
    'FREQ=DAILY',
    'FREQ=DAILY;INTERVAL=3',
    'FREQ=WEEKLY',
    'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,SU',
    'FREQ=MONTHLY',
    'FREQ=MONTHLY;INTERVAL=5;BYDAY=-1FR',
    'FREQ=MONTHLY;BYMONTHDAY=31',
    'FREQ=YEARLY',
    'FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=29',
    'FREQ=YEARLY;INTERVAL=3;BYMONTH=11;BYDAY=1SU',
  ];
  const starts = [
    at(2020, 1, 31),
    at(2022, 2, 28),
    at(2023, 7, 1),
    at(2024, 2, 29),
    at(2025, 12, 31),
  ];
  const windows = [at(2026, 10, 18), at(2026, 1, 1), at(2027, 3, 1)];

  it('dá as mesmas ocorrências da janela que a varredura desde o início', () => {
    for (const ruleText of RULES) {
      for (const start of starts) {
        for (const from of windows) {
          const rule = parseRule(ruleText);
          if (!rule) throw new Error(ruleText);
          const to = from + 3 * 86_400_000;
          const pastEnd = (wall: number) => wall >= to;
          const full = expandWalls(rule, start, pastEnd).filter((w) => w >= from);
          const jumped = expandWalls(rule, start, pastEnd, from).filter((w) => w >= from);
          expect(
            jumped,
            `${ruleText} desde ${new Date(start).toISOString()} em ${new Date(from).toISOString()}`,
          ).toEqual(full);
        }
      }
    }
  });

  it('salta de verdade: um diário de anos atrás varre poucas ocorrências', () => {
    const rule = parseRule('FREQ=DAILY');
    const from = at(2026, 10, 18);
    const found =
      rule && expandWalls(rule, at(2020, 1, 1), (wall) => wall >= from + 86_400_000, from);
    expect(found && found.length).toBeLessThan(15);
  });

  it('com COUNT a varredura é completa (o salto mudaria o total)', () => {
    const rule = parseRule('FREQ=DAILY;COUNT=5');
    expect(rule && expandWalls(rule, at(2020, 1, 1), () => false, at(2026, 1, 1))).toHaveLength(5);
  });
});

describe('ruleWallsInYear', () => {
  it('domingo 1 de novembro (regra de horário de verão dos EUA)', () => {
    const rule = parseRule('FREQ=YEARLY;BYMONTH=11;BYDAY=1SU');
    const start = msToParts(at(2007, 11, 4, 2));
    expect(rule && days(ruleWallsInYear(rule, start, 2026))).toEqual([1]);
  });
});
