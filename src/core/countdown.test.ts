import { describe, expect, it } from 'vitest';
import { countdownView, daysUntil, formatDate, parseIsoDate, toIsoDate } from './countdown.js';

describe('parseIsoDate', () => {
  it('lê AAAA-MM-DD', () => {
    expect(parseIsoDate('2026-12-24')).toEqual({ year: 2026, month: 12, day: 24 });
  });

  it('recusa vazio, formato errado e dia inexistente', () => {
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoDate('24/12/2026')).toBeNull();
    expect(parseIsoDate('2026-2-3')).toBeNull();
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
  });

  it('aceita 29 de fevereiro só em ano bissexto', () => {
    expect(parseIsoDate('2028-02-29')).not.toBeNull();
    expect(parseIsoDate('2027-02-29')).toBeNull();
  });
});

describe('toIsoDate e formatDate', () => {
  it('completam com zero à esquerda', () => {
    const date = { year: 2027, month: 1, day: 5 };
    expect(toIsoDate(date)).toBe('2027-01-05');
    expect(formatDate(date)).toBe('05/01/2027');
  });
});

describe('daysUntil', () => {
  const today = new Date(2026, 8, 30, 22, 15);

  it('conta dias de calendário, sem olhar a hora', () => {
    expect(daysUntil(today, { year: 2026, month: 9, day: 30 })).toBe(0);
    expect(daysUntil(today, { year: 2026, month: 10, day: 1 })).toBe(1);
    expect(daysUntil(today, { year: 2026, month: 9, day: 29 })).toBe(-1);
  });

  it('atravessa a virada de ano', () => {
    const dec31 = new Date(2026, 11, 31, 23, 59);
    expect(daysUntil(dec31, { year: 2027, month: 1, day: 1 })).toBe(1);
    expect(daysUntil(dec31, { year: 2027, month: 12, day: 31 })).toBe(365);
  });

  it('não perde um dia no horário de verão', () => {
    // A troca de fuso local não muda a conta: ela usa só a data.
    expect(daysUntil(new Date(2026, 2, 1), { year: 2026, month: 4, day: 1 })).toBe(31);
  });
});

describe('countdownView', () => {
  const today = new Date(2026, 8, 30, 10, 0);

  it('mostra o nome e os dias no singular ou plural', () => {
    expect(countdownView('Viagem', '2026-10-01', today)).toEqual({
      label: 'Viagem',
      missingDate: false,
      sub: '1 dia',
    });
    expect(countdownView('Viagem', '2026-10-12', today).sub).toBe('12 dias');
  });

  it('diz hoje e encerrada', () => {
    expect(countdownView('Viagem', '2026-09-30', today).sub).toBe('hoje');
    expect(countdownView('Viagem', '2026-09-01', today).sub).toBe('encerrada');
  });

  it('usa "Contagem" com o nome vazio', () => {
    expect(countdownView('  ', '2026-10-01', today).label).toBe('Contagem');
  });

  it('sem data não tem sub, com qualquer nome', () => {
    expect(countdownView('Viagem', '', today)).toEqual({ label: 'Sem data', missingDate: true });
  });
});
