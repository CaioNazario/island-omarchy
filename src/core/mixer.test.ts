import { describe, expect, it } from 'vitest';
import {
  MIXER_MAX_HEIGHT,
  mixerHeight,
  outputDevice,
  streamApp,
  wheelVolumeSteps,
} from './mixer.js';

describe('outputDevice', () => {
  it('alto-falante interno: ícone de notebook e "Integrado"', () => {
    expect(
      outputDevice({
        name: 'alsa_output.pci-0000_00_1f.3.analog-stereo',
        description: 'Built-in Audio Analog Stereo',
      }),
    ).toEqual({ label: 'Analog Stereo', glyph: 'laptop', sub: 'Integrado' });
  });

  it('fone Bluetooth: ícone de fone e "Bluetooth"', () => {
    expect(outputDevice({ name: 'bluez_output.AA_BB.1', description: 'AirPods Pro' })).toEqual({
      label: 'AirPods Pro',
      glyph: 'headphones-fill',
      sub: 'Bluetooth',
    });
  });

  it('caixa Bluetooth sem cara de fone: ícone de Bluetooth', () => {
    expect(outputDevice({ name: 'bluez_output.CC_DD.1', description: 'JBL Flip 5' }).glyph).toBe(
      'bluetooth-fill',
    );
  });

  it('HDMI: ícone de monitor e "HDMI", com o apelido do nó', () => {
    expect(
      outputDevice({
        name: 'alsa_output.hdmi-stereo',
        description: 'HDMI / DisplayPort',
        nickname: 'LG HDR 4K',
      }),
    ).toEqual({ label: 'LG HDR 4K', glyph: 'monitor', sub: 'HDMI' });
  });

  it('limpa os prefixos e sufixos do ALSA como o painel de áudio do Omarchy', () => {
    expect(outputDevice({ name: 'x', description: 'sof-soundwire Speaker Output' }).label).toBe(
      'Speaker',
    );
  });
});

describe('streamApp', () => {
  it('Spotify: nome bonito, ícone da marca e a faixa como sub', () => {
    expect(streamApp({ appName: 'spotify', mediaName: 'Get Lucky' })).toEqual({
      label: 'Spotify',
      glyph: 'spotify-logo-fill',
      sub: 'Get Lucky',
    });
  });

  it('navegador: ícone de navegador, aba como sub', () => {
    expect(streamApp({ appName: 'Firefox', mediaName: 'YouTube — Lo-fi' }).glyph).toBe('browser');
  });

  it('Discord e sons do sistema têm ícone próprio', () => {
    expect(streamApp({ appName: 'WEBRTC VoiceEngine', binary: 'Discord' }).glyph).toBe(
      'discord-logo-fill',
    );
    expect(streamApp({ appName: 'libcanberra', mediaName: 'bell' }).glyph).toBe('bell-simple-fill');
  });

  it('sem nome de app: cai na descrição e no ícone genérico; sub repetida some', () => {
    expect(streamApp({ description: 'mpv', mediaName: 'mpv' })).toEqual({
      label: 'mpv',
      glyph: 'speaker-high-fill',
      sub: '',
    });
  });
});

describe('mixerHeight', () => {
  it('soma cabeçalho, volume geral, saídas, apps e microfone', () => {
    // 12 + 26 + 8 + 42 · saída 29 + 3×36 · apps 29 + 2×42 · entrada 29 + 42 · 10
    expect(mixerHeight({ outputs: 3, apps: 2, hasMic: true })).toBe(419);
  });

  it('sem apps nem microfone, as seções somem', () => {
    expect(mixerHeight({ outputs: 1, apps: 0, hasMic: false })).toBe(163);
  });

  it('não passa da altura máxima do design (a lista rola)', () => {
    expect(mixerHeight({ outputs: 4, apps: 9, hasMic: true })).toBe(MIXER_MAX_HEIGHT);
  });
});

describe('wheelVolumeSteps', () => {
  it('120 unidades = um passo de 5%, como a barra do Omarchy', () => {
    expect(wheelVolumeSteps(0, 120)).toEqual({ steps: 1, remainder: 0 });
    expect(wheelVolumeSteps(0, -120)).toEqual({ steps: -1, remainder: 0 });
  });

  it('acumula o touchpad e zera ao inverter o sentido', () => {
    expect(wheelVolumeSteps(0, 40)).toEqual({ steps: 0, remainder: 40 });
    expect(wheelVolumeSteps(100, 40)).toEqual({ steps: 1, remainder: 20 });
    expect(wheelVolumeSteps(100, -40)).toEqual({ steps: 0, remainder: -40 });
  });

  it('um entalhe gigante conta como um passo só', () => {
    expect(wheelVolumeSteps(0, 600)).toEqual({ steps: 1, remainder: 0 });
  });
});
