import { describe, expect, it } from 'vitest';
import { oklch, parseHex, toHex } from './color.js';
import {
  POMODORO_ACCENTS,
  VIGNETTE,
  WALLPAPER_PRESETS,
  presetLayers,
  wallpaperName,
  type WallpaperLayer,
} from './pomodoroWallpapers.js';

function stopsOf(layer: WallpaperLayer) {
  return layer.kind === 'solid' ? [] : layer.stops;
}

describe('presets de wallpaper', () => {
  it('são quatro, na ordem da spec 07', () => {
    expect(WALLPAPER_PRESETS.map((preset) => preset.id)).toEqual([
      'noite',
      'aurora',
      'brasa',
      'grafite',
    ]);
  });

  it('toda cor é hex válido e as paradas crescem de 0 a 1', () => {
    for (const preset of WALLPAPER_PRESETS) {
      expect(preset.layers.length).toBeGreaterThan(0);
      for (const layer of [...preset.layers, VIGNETTE]) {
        if (layer.kind === 'solid') parseHex(layer.color);
        let last = -1;
        for (const stop of stopsOf(layer)) {
          parseHex(stop.color);
          expect(stop.at).toBeGreaterThanOrEqual(0);
          expect(stop.at).toBeLessThanOrEqual(1);
          expect(stop.at).toBeGreaterThanOrEqual(last);
          last = stop.at;
        }
      }
    }
  });

  it('Noite: elipse 120%×90% em (50%, 115%) com as paradas da spec', () => {
    const [layer] = presetLayers('noite');
    expect(layer).toMatchObject({ kind: 'radial', cx: 0.5, cy: 1.15, rx: 1.2, ry: 0.9 });
    const stops = stopsOf(layer!);
    expect(stops.map((stop) => stop.at)).toEqual([0, 0.55, 1]);
    expect(stops[0]!.color).toBe(toHex(oklch(0.34, 0.05, 178)));
    expect(stops[2]!.color).toBe('#09090a');
  });

  it('Aurora: base sólida e dois brilhos que somem sem franja escura', () => {
    const layers = presetLayers('aurora');
    expect(layers[0]).toEqual({ kind: 'solid', color: '#09090b' });
    const glows = layers.slice(1);
    expect(glows).toHaveLength(2);
    for (const glow of glows) {
      const [first, ...rest] = stopsOf(glow);
      const end = rest[rest.length - 1]!;
      expect(parseHex(end.color).a).toBe(0);
      // Mesmo matiz do começo, só sem alfa: sem isso a interpolação passa pelo preto.
      expect(toHex({ ...parseHex(end.color), a: 1 })).toBe(
        toHex({ ...parseHex(first!.color), a: 1 }),
      );
    }
  });

  it('Grafite é um degradê vertical', () => {
    expect(presetLayers('grafite')).toEqual([
      {
        kind: 'linear',
        stops: [
          { at: 0, color: '#19191c' },
          { at: 1, color: '#0a0a0b' },
        ],
      },
    ]);
  });

  it('id desconhecido ou imagem própria não tem camadas', () => {
    expect(presetLayers('custom')).toEqual([]);
    expect(presetLayers('rosa')).toEqual([]);
  });

  it('nomes nos dois idiomas', () => {
    expect(wallpaperName('brasa', 'pt-BR')).toBe('Brasa');
    expect(wallpaperName('brasa', 'en')).toBe('Ember');
    expect(wallpaperName('custom', 'en')).toBe('Your image');
  });
});

describe('acentos do Pomodoro', () => {
  it('foco âmbar e pausa teal, os padrões do protótipo', () => {
    expect(POMODORO_ACCENTS.focus).toBe(toHex(oklch(0.79, 0.135, 62)));
    expect(POMODORO_ACCENTS.break).toBe(toHex(oklch(0.8, 0.09, 178)));
  });
});
