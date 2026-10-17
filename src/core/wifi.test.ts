import { describe, expect, it } from 'vitest';
import {
  buildNetworkList,
  clickAction,
  headerStatus,
  signalLevel,
  validatePassword,
  type AccessPointInfo,
  type WifiNetwork,
} from './wifi.js';

function ap(ssid: string, strength: number, extra: Partial<AccessPointInfo> = {}): AccessPointInfo {
  return { ssid, strength, security: 'personal', hasProfile: false, ...extra };
}

function network(extra: Partial<WifiNetwork> = {}): WifiNetwork {
  return {
    ssid: 'Casa',
    strength: 80,
    security: 'personal',
    hasProfile: false,
    status: 'idle',
    ...extra,
  };
}

describe('buildNetworkList', () => {
  it('dedupes by SSID keeping the strongest access point', () => {
    const list = buildNetworkList([ap('Casa', 40), ap('Casa', 90), ap('Casa', 60)], null);
    expect(list).toHaveLength(1);
    expect(list[0]?.strength).toBe(90);
  });

  it('keeps a saved profile flag from any access point of the same SSID', () => {
    const list = buildNetworkList([ap('Casa', 90), ap('Casa', 40, { hasProfile: true })], null);
    expect(list[0]?.hasProfile).toBe(true);
  });

  it('drops hidden networks without SSID', () => {
    expect(buildNetworkList([ap('', 99), ap('Casa', 50)], null).map((n) => n.ssid)).toEqual([
      'Casa',
    ]);
  });

  it('sorts by signal strength, strongest first', () => {
    const list = buildNetworkList([ap('A', 30), ap('B', 90), ap('C', 60)], null);
    expect(list.map((n) => n.ssid)).toEqual(['B', 'C', 'A']);
  });

  it('puts the active network first regardless of signal', () => {
    const list = buildNetworkList([ap('A', 30), ap('B', 90)], {
      ssid: 'A',
      status: 'connected',
    });
    expect(list.map((n) => [n.ssid, n.status])).toEqual([
      ['A', 'connected'],
      ['B', 'idle'],
    ]);
  });

  it('marks a network being activated as connecting', () => {
    const list = buildNetworkList([ap('A', 30)], { ssid: 'A', status: 'connecting' });
    expect(list[0]?.status).toBe('connecting');
  });
});

describe('signalLevel', () => {
  it.each([
    [100, 'high'],
    [67, 'high'],
    [66, 'medium'],
    [34, 'medium'],
    [33, 'low'],
    [0, 'low'],
  ] as const)('%i%% is %s', (strength, level) => {
    expect(signalLevel(strength)).toBe(level);
  });
});

describe('clickAction', () => {
  it('does nothing on a connected or connecting network', () => {
    expect(clickAction(network({ status: 'connected' }))).toBe('none');
    expect(clickAction(network({ status: 'connecting' }))).toBe('none');
  });

  it('activates an open network', () => {
    expect(clickAction(network({ security: 'open' }))).toBe('activate');
  });

  it('activates a protected network that already has a saved profile', () => {
    expect(clickAction(network({ hasProfile: true }))).toBe('activate');
  });

  it('asks for a password on a personal network without profile', () => {
    expect(clickAction(network())).toBe('password');
  });

  it('opens Settings on an enterprise network without profile', () => {
    expect(clickAction(network({ security: 'enterprise' }))).toBe('settings');
  });

  it('activates an enterprise network that already has a saved profile', () => {
    expect(clickAction(network({ security: 'enterprise', hasProfile: true }))).toBe('activate');
  });
});

describe('validatePassword', () => {
  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('1234567')).toBe('too-short');
  });

  it('accepts passwords with 8 characters or more', () => {
    expect(validatePassword('12345678')).toBeNull();
  });
});

describe('headerStatus', () => {
  it('shows "Desligado" with the radio off', () => {
    expect(headerStatus(false, null)).toBe('Desligado');
  });

  it('names the connected network', () => {
    expect(headerStatus(true, { ssid: 'Casa', status: 'connected' })).toBe('Conectado a Casa');
  });

  it('shows "Conectando…" while activating', () => {
    expect(headerStatus(true, { ssid: 'Casa', status: 'connecting' })).toBe('Conectando…');
  });

  it('shows "Desconectado" with the radio on and no connection', () => {
    expect(headerStatus(true, null)).toBe('Desconectado');
  });
});
