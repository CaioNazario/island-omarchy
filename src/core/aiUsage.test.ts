import { describe, expect, it } from 'vitest';
import {
  credentialState,
  formatPercent,
  formatSessionReset,
  formatWeeklyReset,
  INITIAL_SCHEDULE,
  isExpired,
  isOffline,
  nextSchedule,
  parseClaudeCredentials,
  parseClaudeUsage,
  parseCodexCredentials,
  parseCodexUsage,
  usageLevel,
  type FetchOutcome,
  type PollSchedule,
} from './aiUsage.js';

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function base64Url(text: string): string {
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of new TextEncoder().encode(text)) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      out += BASE64URL[(buffer >> bits) & 63];
    }
  }
  if (bits > 0) out += BASE64URL[(buffer << (6 - bits)) & 63];
  return out;
}

function fakeJwt(claims: object): string {
  const part = (value: object) => base64Url(JSON.stringify(value));
  return `${part({ alg: 'none' })}.${part(claims)}.sig`;
}

// github.com/akitaonrails/ai-usagebar, tests/fixtures/anthropic_usage_full.json
const CLAUDE_FULL = JSON.stringify({
  five_hour: { utilization: 62.0, resets_at: '2026-05-23T13:30:00Z' },
  seven_day: { utilization: 27.0, resets_at: '2026-05-27T13:00:00Z' },
  seven_day_sonnet: { utilization: 4.0, resets_at: '2026-05-23T14:24:00Z' },
  seven_day_opus: null,
  tangelo: null,
  extra_usage: {
    is_enabled: true,
    monthly_limit: 5000,
    used_credits: 250.0,
    currency: 'USD',
    decimal_places: 2,
  },
});

// ai-usagebar, src/openai/fetch.rs (testes do fetch_snapshot).
const CODEX_BOTH = JSON.stringify({
  plan_type: 'plus',
  rate_limit: {
    primary_window: { used_percent: 1, limit_window_seconds: 18000, reset_at: 1779597324 },
    secondary_window: { used_percent: 0, limit_window_seconds: 604800, reset_at: 1780184124 },
  },
});

describe('parseClaudeCredentials', () => {
  it('reads the token, expiry and capitalized plan', () => {
    const text = JSON.stringify({
      claudeAiOauth: { accessToken: 'tok', expiresAt: 1_800_000_000_000, subscriptionType: 'max' },
    });
    expect(parseClaudeCredentials(text)).toEqual({
      token: 'tok',
      accountId: null,
      expiresAt: 1_800_000_000_000,
      plan: 'Max',
    });
  });

  it('tolerates missing expiry and plan', () => {
    const text = JSON.stringify({ claudeAiOauth: { accessToken: 'tok' } });
    expect(parseClaudeCredentials(text)).toMatchObject({ expiresAt: null, plan: null });
  });

  it.each([
    ['not json', '{'],
    ['no oauth block', '{}'],
    ['empty token', JSON.stringify({ claudeAiOauth: { accessToken: '' } })],
    ['array root', '[]'],
  ])('rejects %s', (_name, text) => {
    expect(parseClaudeCredentials(text)).toBeNull();
  });
});

describe('parseCodexCredentials', () => {
  it('takes the expiry and plan from the id_token', () => {
    const idToken = fakeJwt({
      exp: 1_800_000_000,
      'https://api.openai.com/auth': { chatgpt_plan_type: 'plus' },
    });
    const text = JSON.stringify({
      tokens: { access_token: 'tok', id_token: idToken, account_id: 'acc' },
    });
    expect(parseCodexCredentials(text)).toEqual({
      token: 'tok',
      accountId: 'acc',
      expiresAt: 1_800_000_000_000,
      plan: 'Plus',
    });
  });

  it('prefers an ISO expires_at over an expired id_token', () => {
    const text = JSON.stringify({
      tokens: {
        access_token: 'tok',
        id_token: fakeJwt({ exp: 1 }),
        expires_at: '2030-01-01T00:00:00Z',
      },
    });
    expect(parseCodexCredentials(text)?.expiresAt).toBe(Date.parse('2030-01-01T00:00:00Z'));
  });

  it('reads a numeric expires_at as seconds', () => {
    const text = JSON.stringify({ tokens: { access_token: 'tok', expires_at: 1_800_000_000 } });
    expect(parseCodexCredentials(text)?.expiresAt).toBe(1_800_000_000_000);
  });

  it('survives a garbage id_token', () => {
    const text = JSON.stringify({ tokens: { access_token: 'tok', id_token: 'a.%%%.c' } });
    expect(parseCodexCredentials(text)).toEqual({
      token: 'tok',
      accountId: null,
      expiresAt: null,
      plan: null,
    });
  });

  it('rejects a file without an access token', () => {
    expect(parseCodexCredentials(JSON.stringify({ tokens: {} }))).toBeNull();
    expect(parseCodexCredentials(JSON.stringify({ OPENAI_API_KEY: 'sk' }))).toBeNull();
  });
});

describe('isExpired', () => {
  const credential = { token: 't', accountId: null, plan: null };

  it('compares the expiry with now', () => {
    expect(isExpired({ ...credential, expiresAt: 1000 }, 999)).toBe(false);
    expect(isExpired({ ...credential, expiresAt: 1000 }, 1000)).toBe(true);
  });

  it('never expires without a date (the 401 decides)', () => {
    expect(isExpired({ ...credential, expiresAt: null }, Number.MAX_SAFE_INTEGER)).toBe(false);
  });
});

describe('credentialState', () => {
  const credential = { token: 't', accountId: null, plan: null };

  it('is missing without a credential', () => {
    expect(credentialState(null, 0)).toBe('missing');
  });

  it('is expired past the expiry date', () => {
    expect(credentialState({ ...credential, expiresAt: 1000 }, 1000)).toBe('expired');
  });

  it('is found otherwise', () => {
    expect(credentialState({ ...credential, expiresAt: 1000 }, 999)).toBe('found');
    expect(credentialState({ ...credential, expiresAt: null }, 999)).toBe('found');
  });
});

describe('parseClaudeUsage', () => {
  it('reads the 5h and weekly windows', () => {
    expect(parseClaudeUsage(CLAUDE_FULL)).toEqual({
      session: { percent: 62, resetsAt: Date.parse('2026-05-23T13:30:00Z') },
      weekly: { percent: 27, resetsAt: Date.parse('2026-05-27T13:00:00Z') },
      plan: null,
    });
  });

  it('keeps a window whose reset is null', () => {
    const body = JSON.stringify({ five_hour: { utilization: 0, resets_at: null } });
    expect(parseClaudeUsage(body)).toEqual({
      session: { percent: 0, resetsAt: null },
      weekly: null,
      plan: null,
    });
  });

  it('clamps the percentage to 0–100', () => {
    const body = JSON.stringify({
      five_hour: { utilization: 104 },
      seven_day: { utilization: -2 },
    });
    const usage = parseClaudeUsage(body);
    expect(usage?.session?.percent).toBe(100);
    expect(usage?.weekly?.percent).toBe(0);
  });

  it.each([
    ['not json', '<html>'],
    ['null', 'null'],
    ['no windows', JSON.stringify({ extra_usage: null })],
    ['string utilization', JSON.stringify({ five_hour: { utilization: 'lots' } })],
    ['error body', JSON.stringify({ type: 'error', error: { type: 'rate_limit_error' } })],
  ])('rejects %s', (_name, body) => {
    expect(parseClaudeUsage(body)).toBeNull();
  });
});

describe('parseCodexUsage', () => {
  it('reads both windows and the plan', () => {
    expect(parseCodexUsage(CODEX_BOTH, 0)).toEqual({
      session: { percent: 1, resetsAt: 1779597324 * 1000 },
      weekly: { percent: 0, resetsAt: 1780184124 * 1000 },
      plan: 'Plus',
    });
  });

  it('classifies windows by duration, not position', () => {
    const body = JSON.stringify({
      plan_type: 'pro',
      rate_limit: {
        primary_window: { used_percent: 40, limit_window_seconds: 604800, reset_at: 20 },
        secondary_window: { used_percent: 10, limit_window_seconds: 18000, reset_at: 10 },
      },
    });
    const usage = parseCodexUsage(body, 0);
    expect(usage?.session).toEqual({ percent: 10, resetsAt: 10_000 });
    expect(usage?.weekly).toEqual({ percent: 40, resetsAt: 20_000 });
  });

  it('handles a weekly-only account', () => {
    const body = JSON.stringify({
      plan_type: 'prolite',
      rate_limit: {
        primary_window: { used_percent: 66, limit_window_seconds: 604800, reset_at: 1785261834 },
        secondary_window: null,
      },
    });
    const usage = parseCodexUsage(body, 0);
    expect(usage?.session).toBeNull();
    expect(usage?.weekly?.percent).toBe(66);
  });

  it('accepts numeric strings and falls back to reset_after_seconds', () => {
    const body = JSON.stringify({
      rate_limit: {
        primary_window: {
          used_percent: '37',
          limit_window_seconds: '18000',
          reset_after_seconds: 120,
        },
      },
    });
    expect(parseCodexUsage(body, 5000)).toEqual({
      session: { percent: 37, resetsAt: 5000 + 120_000 },
      weekly: null,
      plan: null,
    });
  });

  it('ignores windows of unknown length', () => {
    const body = JSON.stringify({
      rate_limit: { primary_window: { used_percent: 5, limit_window_seconds: 3600 } },
    });
    expect(parseCodexUsage(body, 0)).toBeNull();
  });

  it.each([
    ['not json', ''],
    ['no rate_limit', JSON.stringify({ plan_type: 'plus' })],
    ['rate_limit null', JSON.stringify({ rate_limit: null })],
    ['windows without percent', JSON.stringify({ rate_limit: { primary_window: {} } })],
  ])('rejects %s', (_name, body) => {
    expect(parseCodexUsage(body, 0)).toBeNull();
  });
});

describe('usageLevel', () => {
  it.each([
    [0, 'normal'],
    [69.9, 'normal'],
    [70, 'high'],
    [89.9, 'high'],
    [90, 'critical'],
    [100, 'critical'],
  ])('%f%% is %s', (value, level) => {
    expect(usageLevel(value)).toBe(level);
  });
});

describe('formatPercent', () => {
  it('rounds to an integer', () => {
    expect(formatPercent(61.5)).toBe('62%');
    expect(formatPercent(0)).toBe('0%');
  });
});

describe('formatSessionReset', () => {
  const now = 1_000_000;
  const min = 60_000;

  it.each([
    [(2 * 60 + 14) * min, 'em 2h 14min'],
    [45 * min, 'em 45min'],
    [44 * min + 1, 'em 45min'],
    [2 * 60 * min, 'em 2h'],
    [0, 'em 1min'],
    [-5 * min, 'em 1min'],
  ])('%i ms ahead is %s', (ahead, label) => {
    expect(formatSessionReset(now + ahead, now)).toBe(label);
  });
});

describe('formatWeeklyReset', () => {
  it('shows the lowercase weekday and local time', () => {
    // 28/09/2026 é uma segunda.
    expect(formatWeeklyReset(new Date(2026, 8, 28, 9, 0).getTime())).toBe('seg, 09:00');
    expect(formatWeeklyReset(new Date(2026, 9, 3, 23, 5).getTime())).toBe('sáb, 23:05');
  });
});

describe('nextSchedule', () => {
  const run = (outcomes: FetchOutcome[]): PollSchedule =>
    outcomes.reduce(nextSchedule, INITIAL_SCHEDULE);

  it('doubles the interval on 429 up to 1200s', () => {
    expect(run(['rate-limited']).intervalS).toBe(600);
    expect(run(['rate-limited', 'rate-limited']).intervalS).toBe(1200);
    expect(run(['rate-limited', 'rate-limited', 'rate-limited']).intervalS).toBe(1200);
  });

  it('goes back to 300s on the next success', () => {
    expect(run(['rate-limited', 'rate-limited', 'ok'])).toEqual(INITIAL_SCHEDULE);
  });

  it('goes offline after 3 failures in a row', () => {
    expect(isOffline(run(['failure', 'failure']))).toBe(false);
    expect(isOffline(run(['failure', 'failure', 'failure']))).toBe(true);
    expect(isOffline(run(['failure', 'failure', 'ok', 'failure']))).toBe(false);
  });

  it('does not count 401 or a malformed body as a network failure', () => {
    expect(run(['failure', 'unauthorized', 'malformed'])).toEqual({ intervalS: 300, failures: 1 });
  });
});
