import { describe, expect, it } from 'vitest';
import {
  btClickAction,
  btHeaderStatus,
  buildDeviceLists,
  visibleBattery,
  type BtDevice,
  type BtDeviceInfo,
} from './bluetooth.js';

function info(path: string, extra: Partial<BtDeviceInfo> = {}): BtDeviceInfo {
  return {
    path,
    name: path,
    hasName: true,
    kind: 'other',
    paired: true,
    connected: false,
    battery: null,
    ...extra,
  };
}

function device(extra: Partial<BtDevice> = {}): BtDevice {
  return { ...info('/dev', extra), status: 'disconnected', ...extra };
}

describe('buildDeviceLists', () => {
  it('splits paired and nearby devices', () => {
    const { paired, nearby } = buildDeviceLists(
      [info('/a'), info('/b', { paired: false }), info('/c')],
      null,
    );
    expect(paired.map((d) => d.path)).toEqual(['/a', '/c']);
    expect(nearby.map((d) => d.path)).toEqual(['/b']);
  });

  it('puts connected paired devices first, keeping the rest in order', () => {
    const { paired } = buildDeviceLists(
      [info('/a'), info('/b', { connected: true }), info('/c'), info('/d', { connected: true })],
      null,
    );
    expect(paired.map((d) => d.path)).toEqual(['/b', '/d', '/a', '/c']);
  });

  it('hides nearby devices without a name but keeps unnamed paired ones', () => {
    const { paired, nearby } = buildDeviceLists(
      [info('/a', { hasName: false }), info('/b', { paired: false, hasName: false })],
      null,
    );
    expect(paired.map((d) => d.path)).toEqual(['/a']);
    expect(nearby).toEqual([]);
  });

  it('derives the status from pairing and connection', () => {
    const { paired, nearby } = buildDeviceLists(
      [info('/a', { connected: true }), info('/b'), info('/c', { paired: false })],
      null,
    );
    expect(paired.map((d) => d.status)).toEqual(['connected', 'disconnected']);
    expect(nearby[0]!.status).toBe('pair');
  });

  it('shows the running operation on its device only', () => {
    const { paired, nearby } = buildDeviceLists(
      [info('/a'), info('/b', { paired: false }), info('/c', { connected: true })],
      { path: '/b', kind: 'pairing' },
    );
    expect(nearby[0]!.status).toBe('pairing');
    expect(paired.map((d) => d.status)).toEqual(['connected', 'disconnected']);
  });
});

describe('btClickAction', () => {
  it('disconnects a connected device', () => {
    expect(btClickAction(device({ status: 'connected' }), false)).toBe('disconnect');
  });

  it('connects a paired disconnected device', () => {
    expect(btClickAction(device({ status: 'disconnected' }), false)).toBe('connect');
  });

  it('pairs a nearby device', () => {
    expect(btClickAction(device({ status: 'pair' }), false)).toBe('pair');
  });

  it('ignores clicks while any operation runs', () => {
    expect(btClickAction(device({ status: 'disconnected' }), true)).toBe('none');
    expect(btClickAction(device({ status: 'pairing' }), true)).toBe('none');
  });
});

describe('visibleBattery', () => {
  it('shows the level only when connected and known', () => {
    expect(visibleBattery(device({ connected: true, battery: 72 }))).toBe(72);
    expect(visibleBattery(device({ connected: false, battery: 72 }))).toBeNull();
    expect(visibleBattery(device({ connected: true, battery: null }))).toBeNull();
  });
});

describe('btHeaderStatus', () => {
  it('reads off when the radio is off', () => {
    expect(btHeaderStatus(false, 2)).toBe('Desligado');
  });

  it('counts connected devices', () => {
    expect(btHeaderStatus(true, 0)).toBe('0 conectados');
    expect(btHeaderStatus(true, 1)).toBe('1 conectado');
    expect(btHeaderStatus(true, 2)).toBe('2 conectados');
  });
});
