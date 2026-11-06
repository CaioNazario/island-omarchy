import { describe, expect, it } from 'vitest';
import {
  breakInstruction,
  breakKindLabel,
  ENTRANCE_MS,
  entranceStage,
  nextStageDelay,
} from './pomodoroBreak.js';

describe('breakKindLabel', () => {
  it('pausa curta até 10 min e longa acima disso', () => {
    expect(breakKindLabel(5, 'pt-BR')).toBe('Pausa curta · 5 min');
    expect(breakKindLabel(10, 'pt-BR')).toBe('Pausa curta · 10 min');
    expect(breakKindLabel(20, 'pt-BR')).toBe('Pausa longa · 20 min');
    expect(breakKindLabel(20, 'en')).toBe('Long break · 20 min');
  });
});

describe('breakInstruction', () => {
  it('escolhe a frase por (concluídos + sessão) % 3', () => {
    expect(breakInstruction(0, 3, 'pt-BR')).toBe('Levanta.');
    expect(breakInstruction(0, 1, 'pt-BR')).toBe('Bebe água.');
    expect(breakInstruction(1, 1, 'pt-BR')).toBe('Olha pela janela.');
    expect(breakInstruction(2, 1, 'en')).toBe('Stand up.');
  });
});

describe('animação de entrada', () => {
  it('estágios disparam em 60, 900, 1700 e 2400 ms', () => {
    expect(ENTRANCE_MS).toEqual([60, 900, 1700, 2400]);
    expect(entranceStage(0)).toBe(0);
    expect(entranceStage(59)).toBe(0);
    expect(entranceStage(60)).toBe(1);
    expect(entranceStage(900)).toBe(2);
    expect(entranceStage(1700)).toBe(3);
    expect(entranceStage(2400)).toBe(4);
    expect(entranceStage(60_000)).toBe(4);
  });

  it('o próximo estágio vem em quanto falta; no último, nada', () => {
    expect(nextStageDelay(0)).toBe(60);
    expect(nextStageDelay(60)).toBe(840);
    expect(nextStageDelay(2000)).toBe(400);
    expect(nextStageDelay(2400)).toBeNull();
  });

  it('tempo negativo (relógio andou para trás) conta como zero', () => {
    expect(entranceStage(-5)).toBe(0);
    expect(nextStageDelay(-5)).toBe(60);
  });
});
