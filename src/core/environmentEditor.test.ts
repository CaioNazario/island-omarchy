import { describe, expect, it } from 'vitest';
import { defaultEnvironments, type Environment } from './environments.js';
import {
  dropIndex,
  moveToOtherSide,
  renameEnvironment,
  selectionLabel,
  setEnvironmentIcon,
  stepWidget,
  usedCount,
} from './environmentEditor.js';

const env: Environment = {
  name: 'Trabalho',
  icon: 'briefcase',
  left: ['event', 'pomodoro', 'ai'],
  right: ['hw'],
};

describe('renomear e trocar ícone', () => {
  it('troca só o ambiente escolhido e corta o nome em 20 caracteres', () => {
    const envs = renameEnvironment(defaultEnvironments(), 1, 'Um nome comprido demais para caber');
    expect(envs[1]?.name).toBe('Um nome comprido dem');
    expect(envs[0]?.name).toBe(defaultEnvironments()[0]?.name);
  });

  it('ícone fora de ENV_ICONS não muda nada', () => {
    expect(setEnvironmentIcon([env], 0, 'code')[0]?.icon).toBe('code');
    expect(setEnvironmentIcon([env], 0, 'banana')[0]?.icon).toBe('briefcase');
  });
});

describe('stepWidget', () => {
  it('anda uma posição para trás ou para frente na mesma pílula', () => {
    expect(stepWidget(env, 'pomodoro', -1).left).toEqual(['pomodoro', 'event', 'ai']);
    expect(stepWidget(env, 'pomodoro', 1).left).toEqual(['event', 'ai', 'pomodoro']);
  });

  it('no limite, nada muda', () => {
    expect(stepWidget(env, 'event', -1)).toEqual(env);
    expect(stepWidget(env, 'ai', 1)).toEqual(env);
  });
});

describe('moveToOtherSide', () => {
  it('passa para o fim da outra pílula', () => {
    expect(moveToOtherSide(env, 'event')).toMatchObject({
      left: ['pomodoro', 'ai'],
      right: ['hw', 'event'],
    });
    expect(moveToOtherSide(env, 'hw')).toMatchObject({
      left: ['event', 'pomodoro', 'ai', 'hw'],
      right: [],
    });
  });
});

describe('selectionLabel', () => {
  it('"Pílula esquerda · 2 de 3"', () => {
    expect(selectionLabel(env, 'pomodoro')).toBe('Pílula esquerda · 2 de 3');
    expect(selectionLabel(env, 'hw')).toBe('Pílula direita · 1 de 1');
    expect(selectionLabel(env, 'note')).toBe('');
  });
});

describe('usedCount', () => {
  it('widgets nas duas pílulas', () => {
    expect(usedCount(env)).toBe(4);
  });
});

describe('dropIndex', () => {
  const boxes = [
    { x: 100, width: 60 },
    { x: 162, width: 40 },
  ];

  it('solto sobre um widget, entra na posição dele', () => {
    expect(dropIndex(boxes, 120)).toBe(0);
    expect(dropIndex(boxes, 170)).toBe(1);
  });

  it('no espaço livre (antes ou depois), vai para o fim', () => {
    expect(dropIndex(boxes, 20)).toBeNull();
    expect(dropIndex(boxes, 300)).toBeNull();
  });
});
