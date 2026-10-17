import { describe, expect, it } from 'vitest';
import { THEME_IDS, themeColors, withAlpha } from './themes.js';

describe('themeColors', () => {
  it('os cinco temas do design, todos com 9 neutros e 9 passos de acento', () => {
    expect(THEME_IDS).toEqual(['Nocturne', 'Vidro fosco', 'Sólido', 'Claro', 'Alto contraste']);
    for (const id of THEME_IDS) {
      const theme = themeColors(id);
      expect(theme.neutrals).toHaveLength(9);
      expect(theme.accents).toHaveLength(9);
    }
  });

  it('Nocturne são os tokens de sempre', () => {
    const theme = themeColors('Nocturne');
    expect(theme.bg).toBe('#161826');
    expect(theme.accent).toBe('#9387dd');
    expect(theme.lane).toBe('#161826');
  });

  it('Vidro fosco deixa pílulas, ilha e neutros escuros translúcidos', () => {
    const theme = themeColors('Vidro fosco');
    expect(theme.lane).toBe('#61161826');
    expect(theme.island).toBe('#85161826');
    expect(theme.neutrals[8]).toBe('#1af3f5fe');
  });

  it('Claro inverte a escala do acento e é claro', () => {
    const theme = themeColors('Claro');
    expect(theme.light).toBe(true);
    expect(theme.accents[0]).toBe('#28253e');
    expect(theme.bg).toBe('#f5f6fb');
  });

  it('Alto contraste usa o fundo quase preto e o acento mais claro', () => {
    const theme = themeColors('Alto contraste');
    expect(theme.bg).toBe('#0b0c12');
    expect(theme.accent).toBe('#b5acfa');
  });

  it('tema desconhecido cai no Nocturne', () => {
    expect(themeColors('Rosa choque')).toEqual(themeColors('Nocturne'));
  });
});

describe('withAlpha', () => {
  it('porcentagem vira o byte de alfa na frente', () => {
    expect(withAlpha('#161826', 100)).toBe('#ff161826');
    expect(withAlpha('#161826', 0)).toBe('#00161826');
  });
});
