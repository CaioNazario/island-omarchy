import { describe, expect, it } from 'vitest';
import {
  cycleTotalMinutes,
  defaultPomodoroConfig,
  formatCycleTotal,
  minutesFor,
  parseCycleLength,
  sanitizePomodoroConfig,
  stepGlobalMinutes,
  stepPlanMinutes,
  withAutoStart,
  withBarControls,
  withBreakSound,
  withoutCustomWallpaper,
  withCycleLength,
  withDurationMode,
  withWallpaper,
} from './pomodoroConfig.js';

describe('pomodoro config defaults', () => {
  it('traz 4 sessões com o plano do protótipo', () => {
    const config = defaultPomodoroConfig();
    expect(config.cycleLen).toBe(4);
    expect(config.durationMode).toBe('global');
    expect(config.autoStart).toBe(true);
    expect(config.plan).toEqual([
      { focusMin: 25, breakMin: 5 },
      { focusMin: 25, breakMin: 5 },
      { focusMin: 25, breakMin: 10 },
      { focusMin: 25, breakMin: 20 },
    ]);
    expect(config.wallpaper).toBe('noite');
  });

  it('cada chamada devolve um objeto novo', () => {
    expect(defaultPomodoroConfig()).not.toBe(defaultPomodoroConfig());
    expect(defaultPomodoroConfig().plan).not.toBe(defaultPomodoroConfig().plan);
  });
});

describe('minutesFor', () => {
  it('global usa as durações globais para toda sessão', () => {
    const config = { ...defaultPomodoroConfig(), focusMin: 30, breakMin: 7 };
    expect(minutesFor(config, 'focus', 3)).toBe(30);
    expect(minutesFor(config, 'break', 3)).toBe(7);
  });

  it('individual usa o plano da sessão', () => {
    const config = withDurationMode(defaultPomodoroConfig(), 'individual');
    expect(minutesFor(config, 'break', 3)).toBe(10);
    expect(minutesFor(config, 'break', 4)).toBe(20);
  });

  it('sessão fora do plano cai na duração global', () => {
    const config = withDurationMode(defaultPomodoroConfig(), 'individual');
    expect(minutesFor(config, 'focus', 99)).toBe(25);
  });
});

describe('withCycleLength', () => {
  it('estende com as durações globais, sem atividade', () => {
    const base = { ...defaultPomodoroConfig(), focusMin: 30, breakMin: 8 };
    const config = withCycleLength(base, 6);
    expect(config.cycleLen).toBe(6);
    expect(config.plan.slice(4)).toEqual([
      { focusMin: 30, breakMin: 8 },
      { focusMin: 30, breakMin: 8 },
    ]);
  });

  it('trunca no fim', () => {
    const config = withCycleLength(defaultPomodoroConfig(), 3);
    expect(config.plan).toHaveLength(3);
    expect(config.plan[2]).toEqual({ focusMin: 25, breakMin: 10 });
  });

  it('limita a 1–24', () => {
    expect(withCycleLength(defaultPomodoroConfig(), 0).cycleLen).toBe(1);
    expect(withCycleLength(defaultPomodoroConfig(), 99).cycleLen).toBe(24);
    expect(withCycleLength(defaultPomodoroConfig(), 99).plan).toHaveLength(24);
  });
});

describe('parseCycleLength', () => {
  it('"30" vira 24 e vazio volta ao anterior', () => {
    expect(parseCycleLength('30', 4)).toBe(24);
    expect(parseCycleLength('', 4)).toBe(4);
    expect(parseCycleLength('abc', 4)).toBe(4);
    expect(parseCycleLength(' 6 ', 4)).toBe(6);
    expect(parseCycleLength('0', 4)).toBe(1);
  });
});

describe('passos de duração', () => {
  it('foco global anda de 5 em 5, entre 5 e 180', () => {
    let config = defaultPomodoroConfig();
    config = stepGlobalMinutes(config, 'focus', 1);
    expect(config.focusMin).toBe(30);
    config = stepGlobalMinutes({ ...config, focusMin: 5 }, 'focus', -1);
    expect(config.focusMin).toBe(5);
    config = stepGlobalMinutes({ ...config, focusMin: 180 }, 'focus', 1);
    expect(config.focusMin).toBe(180);
  });

  it('pausa global anda de 1 em 1, entre 1 e 60', () => {
    let config = stepGlobalMinutes(defaultPomodoroConfig(), 'break', 1);
    expect(config.breakMin).toBe(6);
    config = stepGlobalMinutes({ ...config, breakMin: 1 }, 'break', -1);
    expect(config.breakMin).toBe(1);
    config = stepGlobalMinutes({ ...config, breakMin: 60 }, 'break', 1);
    expect(config.breakMin).toBe(60);
  });

  it('o plano anda com os mesmos passos e só mexe na linha pedida', () => {
    const config = stepPlanMinutes(defaultPomodoroConfig(), 3, 'break', 1);
    expect(config.plan[2]).toEqual({ focusMin: 25, breakMin: 11 });
    expect(config.plan[1]).toEqual({ focusMin: 25, breakMin: 5 });
    expect(stepPlanMinutes(config, 1, 'focus', -1).plan[0]?.focusMin).toBe(20);
  });

  it('sessão fora do plano não muda nada', () => {
    const config = defaultPomodoroConfig();
    expect(stepPlanMinutes(config, 9, 'focus', 1)).toEqual(config);
  });

  it('alternar Global → Individual → Global preserva os dois conjuntos', () => {
    let config = stepGlobalMinutes(defaultPomodoroConfig(), 'focus', 1);
    config = stepPlanMinutes(withDurationMode(config, 'individual'), 2, 'focus', 1);
    config = withDurationMode(config, 'global');
    expect(config.focusMin).toBe(30);
    expect(config.plan[1]?.focusMin).toBe(30);
  });
});

describe('total do ciclo', () => {
  it('soma foco e pausa de todas as linhas', () => {
    expect(cycleTotalMinutes(defaultPomodoroConfig())).toBe(140);
    expect(formatCycleTotal(140)).toBe('2h 20m');
  });

  it('formata horas cheias e só minutos', () => {
    expect(formatCycleTotal(120)).toBe('2h');
    expect(formatCycleTotal(45)).toBe('45m');
    expect(formatCycleTotal(61)).toBe('1h 1m');
  });
});

describe('controles na barra', () => {
  it('começa desligado: o widget da barra é a pílula compacta', () => {
    expect(defaultPomodoroConfig().barControls).toBe(false);
  });

  it('liga e desliga sem mexer no resto', () => {
    const on = withBarControls(defaultPomodoroConfig(), true);
    expect(on.barControls).toBe(true);
    expect(withBarControls(on, false)).toEqual(defaultPomodoroConfig());
  });

  it('lê só booleano; o resto volta ao padrão', () => {
    expect(sanitizePomodoroConfig({ barControls: true }).barControls).toBe(true);
    expect(sanitizePomodoroConfig({ barControls: 'sim' }).barControls).toBe(false);
    expect(sanitizePomodoroConfig({}).barControls).toBe(false);
  });
});

describe('som do fim da pausa', () => {
  it('o padrão é o toque suave', () => {
    expect(defaultPomodoroConfig().breakSound).toBe('chime');
  });

  it('troca sem mexer no resto', () => {
    const bell = withBreakSound(defaultPomodoroConfig(), 'bell');
    expect(bell.breakSound).toBe('bell');
    expect(withBreakSound(bell, 'chime')).toEqual(defaultPomodoroConfig());
  });

  it('lê só um id conhecido; o resto volta ao padrão', () => {
    expect(sanitizePomodoroConfig({ breakSound: 'off' }).breakSound).toBe('off');
    expect(sanitizePomodoroConfig({ breakSound: 'alarm' }).breakSound).toBe('alarm');
    expect(sanitizePomodoroConfig({ breakSound: 'foghorn' }).breakSound).toBe('chime');
    expect(sanitizePomodoroConfig({ breakSound: 3 }).breakSound).toBe('chime');
    expect(sanitizePomodoroConfig({}).breakSound).toBe('chime');
  });
});

describe('opções simples', () => {
  it('início automático e wallpaper', () => {
    expect(withAutoStart(defaultPomodoroConfig(), false).autoStart).toBe(false);
    expect(withWallpaper(defaultPomodoroConfig(), 'brasa', '').wallpaper).toBe('brasa');
  });

  it('imagem própria só vale com caminho', () => {
    const custom = withWallpaper(defaultPomodoroConfig(), 'custom', '/home/u/foto.jpg');
    expect(custom.wallpaper).toBe('custom');
    expect(custom.wallpaperPath).toBe('/home/u/foto.jpg');
    expect(withWallpaper(defaultPomodoroConfig(), 'custom', '').wallpaper).toBe('noite');
    expect(withWallpaper(defaultPomodoroConfig(), 'inexistente', '').wallpaper).toBe('noite');
  });

  it('trocar para um preset guarda o caminho da imagem própria', () => {
    const custom = withWallpaper(defaultPomodoroConfig(), 'custom', '/home/u/foto.jpg');
    const preset = withWallpaper(custom, 'grafite', '');
    expect(preset.wallpaper).toBe('grafite');
    expect(preset.wallpaperPath).toBe('/home/u/foto.jpg');
  });
});

describe('withoutCustomWallpaper', () => {
  const custom = withWallpaper(defaultPomodoroConfig(), 'custom', '/home/u/foto.jpg');

  it('esquece o caminho e, se a imagem estava escolhida, volta ao padrão', () => {
    const cleared = withoutCustomWallpaper(custom);
    expect(cleared.wallpaperPath).toBe('');
    expect(cleared.wallpaper).toBe('noite');
  });

  it('com um preset escolhido, só esquece o caminho guardado', () => {
    const preset = withWallpaper(custom, 'brasa', '');
    const cleared = withoutCustomWallpaper(preset);
    expect(cleared.wallpaper).toBe('brasa');
    expect(cleared.wallpaperPath).toBe('');
  });

  it('não mexe no resto da configuração', () => {
    expect(withoutCustomWallpaper(custom)).toEqual(defaultPomodoroConfig());
  });
});

describe('sanitizePomodoroConfig', () => {
  it('valor ausente ou de tipo errado vira o padrão', () => {
    expect(sanitizePomodoroConfig(null)).toEqual(defaultPomodoroConfig());
    expect(sanitizePomodoroConfig('x')).toEqual(defaultPomodoroConfig());
    expect(sanitizePomodoroConfig([])).toEqual(defaultPomodoroConfig());
  });

  it('campo inválido cai no padrão e preserva o resto', () => {
    const config = sanitizePomodoroConfig({
      cycleLen: 99,
      focusMin: 50,
      breakMin: 'dez',
      durationMode: 'sideways',
      autoStart: false,
    });
    expect(config.cycleLen).toBe(4);
    expect(config.focusMin).toBe(50);
    expect(config.breakMin).toBe(5);
    expect(config.durationMode).toBe('global');
    expect(config.autoStart).toBe(false);
  });

  it('durações fora dos limites ou fracionárias caem no padrão', () => {
    const config = sanitizePomodoroConfig({ focusMin: 400, breakMin: 2.5 });
    expect(config.focusMin).toBe(25);
    expect(config.breakMin).toBe(5);
  });

  it('o plano segue o tamanho do ciclo, completando com as globais', () => {
    const config = sanitizePomodoroConfig({
      cycleLen: 3,
      focusMin: 30,
      breakMin: 6,
      plan: [{ focusMin: 40, breakMin: 9 }],
    });
    expect(config.plan).toEqual([
      { focusMin: 40, breakMin: 9 },
      { focusMin: 30, breakMin: 6 },
      { focusMin: 30, breakMin: 6 },
    ]);
  });

  it('linha do plano inválida usa as globais só nela', () => {
    const config = sanitizePomodoroConfig({
      cycleLen: 2,
      plan: [{ focusMin: 'x', breakMin: 7 }, { focusMin: 35 }],
    });
    expect(config.plan).toEqual([
      { focusMin: 25, breakMin: 7 },
      { focusMin: 35, breakMin: 5 },
    ]);
  });

  it('lê a lista tipo array do JsonAdapter (Array.isArray dá false)', () => {
    const adapterList = {
      length: 2,
      0: { focusMin: 45, breakMin: 9 },
      1: { focusMin: 15, breakMin: 3 },
    };
    expect(Array.isArray(adapterList)).toBe(false);
    const config = sanitizePomodoroConfig({ cycleLen: 2, plan: adapterList });
    expect(config.plan).toEqual([
      { focusMin: 45, breakMin: 9 },
      { focusMin: 15, breakMin: 3 },
    ]);
  });

  it('wallpaper desconhecido ou imagem própria sem caminho volta ao padrão', () => {
    expect(sanitizePomodoroConfig({ wallpaper: 'rosa' }).wallpaper).toBe('noite');
    expect(sanitizePomodoroConfig({ wallpaper: 'custom' }).wallpaper).toBe('noite');
    const custom = sanitizePomodoroConfig({ wallpaper: 'custom', wallpaperPath: '/a/b.png' });
    expect(custom.wallpaper).toBe('custom');
    expect(custom.wallpaperPath).toBe('/a/b.png');
  });

  it('aceita o que o próprio saneamento produz', () => {
    const config = withCycleLength(withDurationMode(defaultPomodoroConfig(), 'individual'), 7);
    expect(sanitizePomodoroConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
  });
});
