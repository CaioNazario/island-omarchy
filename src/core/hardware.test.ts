import { describe, expect, it } from 'vitest';
import {
  busyFromIdleResidency,
  cpuUsage,
  fittingBlocks,
  hardwareBlocks,
  isPhysicalInterface,
  netRates,
  parseCpuTimes,
  parseMeminfo,
  parseNetDev,
  WIDEST_VALUE,
  type HardwareBlockId,
  type HardwareReading,
} from './hardware.js';

const GIB = 1024 ** 3;

function reading(overrides: Partial<HardwareReading> = {}): HardwareReading {
  return {
    cpu: 12,
    memory: { totalBytes: 15.3 * GIB, usedBytes: 7.2 * GIB },
    gpu: 8,
    temp: 54,
    net: { downBytesPerSecond: 1_200_000 },
    ...overrides,
  };
}

function block(r: HardwareReading, id: HardwareBlockId) {
  return hardwareBlocks(r).find((b) => b.id === id);
}

describe('parseCpuTimes', () => {
  it('sums user through steal and counts iowait as idle', () => {
    const stat = [
      'cpu  100 20 30 400 50 6 7 8 90 10',
      'cpu0 50 10 15 200 25 3 3 4 45 5',
      'intr 12345',
    ].join('\n');
    expect(parseCpuTimes(stat)).toEqual({ idle: 450, total: 621 });
  });

  it('returns null without the aggregate cpu line', () => {
    expect(parseCpuTimes('cpu0 1 2 3 4 5\n')).toBeNull();
    expect(parseCpuTimes('')).toBeNull();
  });
});

describe('cpuUsage', () => {
  it('uses the delta between samples', () => {
    expect(cpuUsage({ idle: 1000, total: 2000 }, { idle: 1075, total: 2100 })).toBe(25);
  });

  it('is 0 when the counters did not move', () => {
    expect(cpuUsage({ idle: 10, total: 20 }, { idle: 10, total: 20 })).toBe(0);
  });

  it('clamps to 0–100', () => {
    expect(cpuUsage({ idle: 0, total: 0 }, { idle: 150, total: 100 })).toBe(0);
    expect(cpuUsage({ idle: 50, total: 0 }, { idle: 0, total: 100 })).toBe(100);
  });
});

describe('parseMeminfo', () => {
  it('uses MemTotal − MemAvailable', () => {
    const meminfo = [
      'MemTotal:       16000000 kB',
      'MemFree:         2000000 kB',
      'MemAvailable:    9000000 kB',
    ].join('\n');
    expect(parseMeminfo(meminfo)).toEqual({
      totalBytes: 16000000 * 1024,
      usedBytes: 7000000 * 1024,
    });
  });

  it('returns null when a field is missing', () => {
    expect(parseMeminfo('MemTotal: 16000000 kB\n')).toBeNull();
  });
});

describe('busyFromIdleResidency', () => {
  it('turns RC6 residency into busy %', () => {
    expect(busyFromIdleResidency(5000, 5920, 1000)).toBe(8);
  });

  it('is 0% when the GPU stayed idle the whole interval', () => {
    expect(busyFromIdleResidency(0, 1000, 1000)).toBe(0);
  });

  it('clamps residency that overshoots the elapsed time', () => {
    expect(busyFromIdleResidency(0, 1010, 1000)).toBe(0);
    expect(busyFromIdleResidency(100, 90, 1000)).toBe(100);
  });

  it('is 0 without elapsed time', () => {
    expect(busyFromIdleResidency(0, 0, 0)).toBe(0);
  });
});

describe('isPhysicalInterface', () => {
  it.each(['wlan0', 'wlp2s0', 'enp3s0', 'eth0'])('keeps %s', (name) => {
    expect(isPhysicalInterface(name)).toBe(true);
  });

  it.each(['lo', 'docker0', 'veth1a2b', 'br-3f9e', 'virbr0', 'tun0', 'wg0'])('drops %s', (name) => {
    expect(isPhysicalInterface(name)).toBe(false);
  });
});

describe('parseNetDev', () => {
  it('sums the received bytes of physical interfaces', () => {
    const netDev = [
      'Inter-|   Receive                                                |  Transmit',
      ' face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed',
      '    lo: 9999 10 0 0 0 0 0 0 9999 10 0 0 0 0 0 0',
      'wlp2s0: 1000 5 0 0 0 0 0 0 200 3 0 0 0 0 0 0',
      'enp3s0:500 2 0 0 0 0 0 0 50 1 0 0 0 0 0 0',
      'docker0: 7777 1 0 0 0 0 0 0 7777 1 0 0 0 0 0 0',
    ].join('\n');
    expect(parseNetDev(netDev)).toEqual({ rx: 1500 });
  });
});

describe('netRates', () => {
  it('converts the delta to bytes per second', () => {
    expect(netRates({ rx: 0 }, { rx: 3_000_000 }, 2000)).toEqual({ downBytesPerSecond: 1_500_000 });
  });

  it('treats a counter reset as 0', () => {
    expect(netRates({ rx: 5000 }, { rx: 100 }, 1000)).toEqual({ downBytesPerSecond: 0 });
  });
});

describe('hardwareBlocks', () => {
  it('matches the design sample', () => {
    expect(hardwareBlocks(reading())).toEqual([
      { id: 'cpu', label: 'CPU', value: '12%', tone: 'normal' },
      { id: 'ram', label: 'RAM', value: '7.2G', tone: 'normal' },
      { id: 'gpu', label: 'GPU', value: '8%', tone: 'normal' },
      { id: 'temp', label: 'TEMP', value: '54°', tone: 'normal' },
      { id: 'net', label: 'NET', value: '↓1.2', tone: 'normal' },
    ]);
  });

  it.each([
    [59.4, 'normal'],
    [59.5, 'busy'],
    [60, 'busy'],
    [100, 'busy'],
  ] as const)('colors CPU %d%% as %s', (cpu, tone) => {
    expect(block(reading({ cpu }), 'cpu')?.tone).toBe(tone);
  });

  it.each([
    [69.4, 'normal'],
    [69.5, 'hot'],
    [70, 'hot'],
    [95, 'hot'],
  ] as const)('colors TEMP %d° as %s', (temp, tone) => {
    expect(block(reading({ temp }), 'temp')?.tone).toBe(tone);
  });

  it('never colors RAM, GPU or NET', () => {
    const busy = reading({ gpu: 100, net: { downBytesPerSecond: 1e9 } });
    for (const id of ['ram', 'gpu', 'net'] as const) expect(block(busy, id)?.tone).toBe('normal');
  });

  it('drops GPU and TEMP when there is no source', () => {
    const ids = hardwareBlocks(reading({ gpu: null, temp: null })).map((b) => b.id);
    expect(ids).toEqual(['cpu', 'ram', 'net']);
  });

  it('shows NET with one decimal below 100 MB/s and none from 100', () => {
    const net = (down: number) =>
      block(reading({ net: { downBytesPerSecond: down } }), 'net')?.value;
    expect(net(0)).toBe('↓0.0');
    expect(net(99_940_000)).toBe('↓99.9');
    expect(net(99_960_000)).toBe('↓100');
    expect(net(123_400_000)).toBe('↓123');
  });

  it('clamps CPU and GPU to 0–100', () => {
    const r = reading({ cpu: 104, gpu: -3 });
    expect(block(r, 'cpu')?.value).toBe('100%');
    expect(block(r, 'gpu')?.value).toBe('0%');
  });

  describe('widest values', () => {
    const lengths = (r: HardwareReading) =>
      Object.fromEntries(hardwareBlocks(r).map((b) => [b.id, b.value.length]));

    it('are what the extremes format to', () => {
      const extreme = reading({
        cpu: 100,
        memory: { totalBytes: 128 * GIB, usedBytes: 99.9 * GIB },
        gpu: 100,
        temp: 100,
        net: { downBytesPerSecond: 99_900_000 },
      });
      for (const b of hardwareBlocks(extreme)) expect(b.value).toBe(WIDEST_VALUE[b.id]);
    });

    it('are never exceeded in the normal ranges', () => {
      for (let step = 0; step <= 1000; step++) {
        const t = step / 1000;
        const got = lengths(
          reading({
            cpu: t * 100,
            memory: { totalBytes: 128 * GIB, usedBytes: t * 99.9 * GIB },
            gpu: t * 100,
            temp: t * 100,
            net: { downBytesPerSecond: t * 999_000_000 },
          }),
        );
        for (const id of Object.keys(got) as HardwareBlockId[]) {
          expect(got[id]).toBeLessThanOrEqual(WIDEST_VALUE[id].length);
        }
      }
    });
  });
});

describe('fittingBlocks', () => {
  const ALL: HardwareBlockId[] = ['cpu', 'ram', 'gpu', 'temp', 'net'];
  // 5 blocos de 30px com gap 10: 30, 70, 110, 150, 190.
  const fit = (budget: number, ids = ALL) => fittingBlocks(ids, () => 30, budget, 10);

  it('keeps every block when they fit', () => {
    expect(fit(190)).toEqual(ALL);
  });

  it.each([
    [189, ['cpu', 'ram', 'gpu', 'temp']],
    [149, ['cpu', 'ram', 'temp']],
    [109, ['cpu', 'ram']],
  ])('drops NET → GPU → TEMP to fit %ipx', (budget, ids) => {
    expect(fit(budget)).toEqual(ids);
  });

  it('never drops CPU or RAM', () => {
    expect(fit(0)).toEqual(['cpu', 'ram']);
  });

  it('keeps TEMP sooner without a GPU', () => {
    expect(fit(150, ['cpu', 'ram', 'temp', 'net'])).toEqual(['cpu', 'ram', 'temp', 'net']);
    expect(fit(149, ['cpu', 'ram', 'temp', 'net'])).toEqual(['cpu', 'ram', 'temp']);
  });

  it('measures each block by its own width', () => {
    const widths: Record<HardwareBlockId, number> = {
      cpu: 30,
      ram: 36,
      gpu: 30,
      temp: 30,
      net: 50,
    };
    // Tudo: 176 + 40 = 216; sem NET: 126 + 30 = 156.
    expect(fittingBlocks(ALL, (id) => widths[id], 215, 10)).toEqual(['cpu', 'ram', 'gpu', 'temp']);
    expect(fittingBlocks(ALL, (id) => widths[id], 156, 10)).toEqual(['cpu', 'ram', 'gpu', 'temp']);
  });
});
