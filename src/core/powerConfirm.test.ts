import { describe, expect, it } from 'vitest';
import {
  CONFIRM_SECONDS,
  confirmationText,
  isDue,
  needsConfirmation,
  secondsLeft,
  startPending,
} from './powerConfirm.js';

describe('needsConfirmation', () => {
  it.each(['reboot', 'shutdown', 'logout'])('asks before %s', (action) => {
    expect(needsConfirmation(action)).toBe(true);
  });

  it.each(['suspend', 'lock'])('runs %s right away, it is undone by waking up', (action) => {
    expect(needsConfirmation(action)).toBe(false);
  });
});

describe('pending confirmation', () => {
  it('starts with the full 60 seconds, like the GNOME dialog', () => {
    const pending = startPending('shutdown', 1_000);
    expect(CONFIRM_SECONDS).toBe(60);
    expect(secondsLeft(pending, 1_000)).toBe(60);
    expect(isDue(pending, 1_000)).toBe(false);
  });

  it('counts down by wall clock and rounds up, so 0 only shows when it fires', () => {
    const pending = startPending('reboot', 0);
    expect(secondsLeft(pending, 1)).toBe(60);
    expect(secondsLeft(pending, 1_000)).toBe(59);
    expect(secondsLeft(pending, 59_001)).toBe(1);
    expect(isDue(pending, 59_999)).toBe(false);
    expect(secondsLeft(pending, 60_000)).toBe(0);
    expect(isDue(pending, 60_000)).toBe(true);
  });

  it('is still due, never negative, when a late tick lands past the deadline', () => {
    const pending = startPending('logout', 0);
    expect(secondsLeft(pending, 75_000)).toBe(0);
    expect(isDue(pending, 75_000)).toBe(true);
  });

  it('rejects an action that does not ask, with the value and the expected ones', () => {
    expect(() => startPending('lock', 0)).toThrow(
      "no confirmation for power action 'lock', expected one of reboot, shutdown, logout",
    );
  });
});

describe('confirmationText', () => {
  it('says what will happen and when', () => {
    expect(confirmationText('en', 'shutdown', 60)).toBe('Shutting down in 60s');
    expect(confirmationText('en', 'reboot', 7)).toBe('Restarting in 7s');
    expect(confirmationText('en', 'logout', 1)).toBe('Logging out in 1s');
  });

  it('translates to pt-BR', () => {
    expect(confirmationText('pt-BR', 'shutdown', 60)).toBe('Desligando em 60s');
    expect(confirmationText('pt-BR', 'reboot', 7)).toBe('Reiniciando em 7s');
    expect(confirmationText('pt-BR', 'logout', 1)).toBe('Saindo em 1s');
  });
});
