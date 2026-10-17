import { describe, expect, it } from 'vitest';
import {
  aiPanelHeight,
  dayRows,
  formatTokens,
  friendlyModelName,
  modelRows,
  parseAgentRecord,
} from './agentUsage.js';

const RECORD = JSON.stringify({
  id: 'claude',
  tierLabel: 'Pro',
  updatedAt: '2026-10-17T05:37:58.656188+00:00',
  recentDays: [
    { date: '2026-10-11', messageCount: 0 },
    { date: '2026-10-12', messageCount: 2_100_000 },
    { date: '2026-10-13', messageCount: 0 },
    { date: '2026-10-14', messageCount: 0 },
    { date: '2026-10-15', messageCount: 0 },
    { date: '2026-10-16', messageCount: 10_484_094 },
    { date: '2026-10-17', messageCount: 132_396_615 },
  ],
  modelUsage: {
    'claude-sonnet-4-5-20250929': {
      inputTokens: 1000,
      outputTokens: 2000,
      cacheReadInputTokens: 500_000,
      cacheCreationInputTokens: 0,
    },
    'claude-opus-5-5': {
      inputTokens: 1148,
      outputTokens: 415_350,
      cacheReadInputTokens: 141_568_078,
      cacheCreationInputTokens: 896_133,
    },
  },
});

describe('parseAgentRecord', () => {
  it('lê dias, modelos e plano do registro do omarchy-agent-usage-update', () => {
    const record = parseAgentRecord(RECORD);
    expect(record?.plan).toBe('Pro');
    expect(record?.updatedAt).toBe(Date.parse('2026-10-17T05:37:58.656188+00:00'));
    expect(record?.days).toHaveLength(7);
    expect(record?.days[6]).toEqual({ date: '2026-10-17', tokens: 132_396_615 });
    // Total do modelo = entrada + saída + cache lido + cache escrito, como o painel do Omarchy.
    expect(record?.models).toEqual([
      { id: 'claude-opus-5-5', tokens: 142_880_709 },
      { id: 'claude-sonnet-4-5-20250929', tokens: 503_000 },
    ]);
  });

  it('JSON inválido ou sem o formato dá null; campos ausentes viram listas vazias', () => {
    expect(parseAgentRecord('{')).toBeNull();
    expect(parseAgentRecord('[]')).toBeNull();
    expect(parseAgentRecord('{"id":"codex"}')).toEqual({
      plan: '',
      updatedAt: 0,
      days: [],
      models: [],
    });
  });
});

describe('formatTokens', () => {
  it('B, M e K com uma casa, como o Omarchy', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(950)).toBe('950');
    expect(formatTokens(503_000)).toBe('503.0K');
    expect(formatTokens(132_396_615)).toBe('132.4M');
    expect(formatTokens(2_400_000_000)).toBe('2.4B');
  });
});

describe('friendlyModelName', () => {
  it('junta a versão e capitaliza, sem o prefixo claude- e a data', () => {
    expect(friendlyModelName('claude-opus-5-5')).toBe('Opus 5.5');
    expect(friendlyModelName('claude-sonnet-4-5-20250929')).toBe('Sonnet 4.5');
    expect(friendlyModelName('gpt-5.6-sol')).toBe('GPT 5.6 Sol');
    expect(friendlyModelName('')).toBe('Desconhecido');
  });
});

describe('dayRows', () => {
  const days = parseAgentRecord(RECORD)?.days ?? [];

  it('sete linhas, a última é "Hoje" em destaque e as outras o dia da semana', () => {
    const rows = dayRows(days, '2026-10-17');
    expect(rows.map((row) => row.label)).toEqual([
      'Dom',
      'Seg',
      'Ter',
      'Qua',
      'Qui',
      'Sex',
      'Hoje',
    ]);
    expect(rows[6]).toMatchObject({ today: true, value: '132.4M', fraction: 1 });
    expect(rows[0]).toMatchObject({ today: false, value: '0', fraction: 0 });
  });

  it('dia de hoje ausente no registro (coleta de ontem) não vira "Hoje"', () => {
    expect(dayRows(days, '2026-10-18').some((row) => row.today)).toBe(false);
  });
});

describe('modelRows', () => {
  it('nome amigável, valor formatado e barra relativa ao maior', () => {
    const rows = modelRows(parseAgentRecord(RECORD)?.models ?? []);
    expect(rows[0]).toEqual({ name: 'Opus 5.5', value: '142.9M', fraction: 1 });
    expect(rows[1]?.name).toBe('Sonnet 4.5');
    expect(rows[1]?.fraction).toBeCloseTo(503_000 / 142_880_709);
  });
});

describe('aiPanelHeight', () => {
  it('design v5: 24 + 32 + abas 36 + 346 + 34 por modelo − 4', () => {
    expect(aiPanelHeight({ providers: 2, days: true, models: 2 })).toBe(
      24 + 32 + 36 + 346 + 68 - 4,
    );
    expect(aiPanelHeight({ providers: 1, days: true, models: 3 })).toBe(24 + 32 + 346 + 102 - 4);
  });

  it('sem registro local, o cartão fica só com os limites', () => {
    expect(aiPanelHeight({ providers: 1, days: false, models: 0 })).toBe(56 + 106);
  });

  it('sem provedor, só o cabeçalho', () => {
    expect(aiPanelHeight({ providers: 0, days: false, models: 0 })).toBe(56);
  });
});
