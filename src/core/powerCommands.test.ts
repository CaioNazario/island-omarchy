import { describe, expect, it } from 'vitest';
import { POWER_ACTIONS, powerCommand } from './powerCommands.js';

describe('powerCommand', () => {
  // Regressão #40: o Omarchy 4.5 não tem mais `omarchy-system-reboot|shutdown|logout`,
  // só `omarchy-system <ação>`; o programa ausente falhava em silêncio.
  it.each(['reboot', 'shutdown', 'logout'] as const)('%s goes through omarchy-system', (action) => {
    expect(powerCommand(action)).toEqual(['omarchy-system', action]);
  });

  it('keeps lock and suspend on their own commands', () => {
    expect(powerCommand('lock')).toEqual(['omarchy-system-lock']);
    expect(powerCommand('suspend')).toEqual(['systemctl', 'suspend']);
  });

  it('lists every action the power row can run', () => {
    expect([...POWER_ACTIONS].sort()).toEqual(['lock', 'logout', 'reboot', 'shutdown', 'suspend']);
  });

  it('rejects an unknown action with the value and the expected ones', () => {
    expect(() => powerCommand('hibernate')).toThrow(
      "unknown power action 'hibernate', expected one of suspend, reboot, shutdown, logout, lock",
    );
  });
});
