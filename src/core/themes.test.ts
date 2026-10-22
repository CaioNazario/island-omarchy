import { describe, expect, it } from 'vitest';
import { ACCENT_IDS, THEME_IDS, themeColors, withAlpha } from './themes.js';

describe('themeColors', () => {
  it('os dois temas, todos com 9 neutros e 9 passos de acento', () => {
    expect(THEME_IDS).toEqual(['Nocturne', 'Alto contraste']);
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

  it('Alto contraste usa o fundo quase preto e o acento mais claro', () => {
    const theme = themeColors('Alto contraste');
    expect(theme.bg).toBe('#0b0c12');
    expect(theme.accent).toBe('#b5acfa');
  });

  it('tema desconhecido cai no Nocturne', () => {
    expect(themeColors('Rosa choque')).toEqual(themeColors('Nocturne'));
  });

  it('os temas removidos (Vidro fosco, Sólido, Claro) guardados no arquivo caem no Nocturne', () => {
    for (const id of ['Vidro fosco', 'Sólido', 'Claro']) {
      expect(themeColors(id)).toEqual(themeColors('Nocturne'));
    }
  });
});

describe('cor de realce', () => {
  it('Roxo e Branco, e o Roxo é o padrão', () => {
    expect(ACCENT_IDS).toEqual(['Roxo', 'Branco']);
    expect(themeColors('Nocturne')).toEqual(themeColors('Nocturne', 'Roxo'));
  });

  it('Branco troca só o acento: escala cinza e `accent` quase branco', () => {
    const roxo = themeColors('Nocturne', 'Roxo');
    const branco = themeColors('Nocturne', 'Branco');
    expect(branco.accents[0]).toBe('#f5f5f5');
    expect(branco.accents[8]).toBe('#292929');
    expect(branco.accent).toBe('#e8e8e8');
    expect(branco.bg).toBe(roxo.bg);
    expect(branco.neutrals).toEqual(roxo.neutrals);
  });

  it('Branco no Alto contraste também deixa o `accent` quase branco', () => {
    const theme = themeColors('Alto contraste', 'Branco');
    expect(theme.accent).toBe('#e8e8e8');
    expect(theme.bg).toBe('#0b0c12');
  });

  it('realce desconhecido cai no Roxo', () => {
    expect(themeColors('Nocturne', 'Verde')).toEqual(themeColors('Nocturne', 'Roxo'));
  });
});

describe('botões da linha de controles', () => {
  it('Nocturne Roxo mantém as cores do design', () => {
    const theme = themeColors('Nocturne', 'Roxo');
    expect(theme.tileOn).toBe(theme.accents[5]);
    expect(theme.tileOnIcon).toBe(theme.neutrals[0]);
    expect(theme.tileOff).toBe(theme.neutrals[7]);
    expect(theme.tileOffIcon).toBe(theme.neutrals[2]);
  });

  // Regressão: no Alto contraste e no Branco o `accent-600` é claro ou cinza e
  // os botões ligados ficavam com ícone claro sobre fundo claro.
  it.each([
    ['Alto contraste', 'Roxo'],
    ['Alto contraste', 'Branco'],
    ['Nocturne', 'Branco'],
  ])('%s %s: ligado é o acento cheio com ícone escuro', (id, accentId) => {
    const theme = themeColors(id, accentId);
    expect(theme.tileOn).toBe(theme.accent);
    expect(theme.tileOnIcon).toBe(theme.bg);
  });

  it('Alto contraste: desligado é fundo escuro com ícone claro', () => {
    const theme = themeColors('Alto contraste', 'Branco');
    expect(theme.tileOff).toBe('#262938');
    expect(theme.tileOffIcon).toBe('#f7f8fc');
  });
});

describe('withAlpha', () => {
  it('porcentagem vira o byte de alfa na frente', () => {
    expect(withAlpha('#161826', 100)).toBe('#ff161826');
    expect(withAlpha('#161826', 0)).toBe('#00161826');
  });
});
