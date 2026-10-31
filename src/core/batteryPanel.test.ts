import { describe, expect, it } from 'vitest';
import {
  batteryGlyph,
  batteryPanel,
  parseBatteryStatus,
  parsePowerProfiles,
} from './batteryPanel.js';

const CHARGING =
  'percentage\t24%\nstate\tcharging\nrate\t16.9W\nsize\t29Wh\ntime\t1h 23m\ncycles\t0\nthreshold\t75-80%\n';
const DISCHARGING =
  'percentage\t61%\nstate\tdischarging\nrate\t8.4W\nsize\t52Wh\ntime\t3h 5m\ncycles\t184\n';

describe('parseBatteryStatus', () => {
  it('lê as linhas chave<TAB>valor de omarchy-battery-status --shell', () => {
    expect(parseBatteryStatus(CHARGING)).toEqual({
      percentage: '24%',
      state: 'charging',
      rate: '16.9W',
      size: '29Wh',
      time: '1h 23m',
      cycles: '0',
      threshold: '75-80%',
    });
  });

  it('saída vazia dá objeto vazio (sem bateria, ou na troca da tomada)', () => {
    expect(parseBatteryStatus('')).toEqual({});
  });
});

describe('batteryPanel', () => {
  it('carregando: tempo até a carga total e potência de carga', () => {
    const panel = batteryPanel(parseBatteryStatus(CHARGING), 'pt-BR');
    expect(panel.status).toBe('Carregando');
    expect(panel.stats).toEqual([
      { label: 'Capacidade', value: '29 Wh' },
      { label: 'Até carga total', value: '1h 23min' },
      { label: 'Ciclos de carga', value: '0' },
      { label: 'Potência de carga', value: '16.9 W' },
    ]);
  });

  it('na bateria: tempo restante e consumo', () => {
    const panel = batteryPanel(parseBatteryStatus(DISCHARGING), 'pt-BR');
    expect(panel.status).toBe('Na bateria');
    expect(panel.stats.map((stat) => stat.label)).toEqual([
      'Capacidade',
      'Tempo restante',
      'Ciclos de carga',
      'Consumo',
    ]);
    expect(panel.stats[1]?.value).toBe('3h 05min');
  });

  it('cheia ou parada no limite de carga: sem tempo nem potência', () => {
    expect(
      batteryPanel(parseBatteryStatus('state\tfully-charged\nsize\t52Wh\n'), 'pt-BR').status,
    ).toBe('Carga completa');
    const pending = batteryPanel(
      parseBatteryStatus('state\tpending-charge\nthreshold\t75-80%\n'),
      'pt-BR',
    );
    expect(pending.status).toBe('Limite de carga · 80%');
    expect(batteryPanel(parseBatteryStatus(CHARGING), 'en').status).toBe('Charging');
    expect(pending.stats[1]?.value).toBe('—');
    expect(pending.stats[3]?.value).toBe('—');
  });

  it('campo ausente vira travessão', () => {
    expect(batteryPanel({}, 'pt-BR').stats.every((stat) => stat.value === '—')).toBe(true);
  });
});

describe('batteryGlyph', () => {
  it('carregando mostra o raio; senão o nível (design `batIcon`)', () => {
    expect(batteryGlyph(50, true)).toBe('battery-charging-fill');
    expect(batteryGlyph(96, false)).toBe('battery-full-fill');
    expect(batteryGlyph(60, false)).toBe('battery-high-fill');
    expect(batteryGlyph(21, false)).toBe('battery-medium-fill');
    expect(batteryGlyph(9, false)).toBe('battery-low-fill');
    expect(batteryGlyph(8, false)).toBe('battery-warning-fill');
  });
});

describe('parsePowerProfiles', () => {
  it('lê omarchy-powerprofiles-list --active-state, com rótulo e ícone do design', () => {
    expect(parsePowerProfiles('power-saver\t0\nbalanced\t1\nperformance\t0\n')).toEqual([
      { id: 'power-saver', label: 'Power saver', glyph: 'leaf', active: false },
      { id: 'balanced', label: 'Balanced', glyph: 'scales', active: true },
      { id: 'performance', label: 'Performance', glyph: 'lightning', active: false },
    ]);
  });

  it('sem power-profiles-daemon, lista vazia', () => {
    expect(parsePowerProfiles('')).toEqual([]);
  });
});
