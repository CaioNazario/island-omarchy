import { describe, expect, it } from 'vitest';
import {
  enabledBuiltins,
  matchesExpected,
  pluginToggleArgs,
  REPLACED_PLUGIN_IDS,
  shouldPromptTakeover,
  takeoverPrompt,
  takeoverStatus,
} from './takeover.js';

// Formato de `omarchy plugin list --json` (Omarchy 4.0.4): um item por plugin.
const entry = (id: string, enabled: boolean) => ({
  id,
  name: id,
  kinds: ['service'],
  enabled,
  active: enabled,
  canDisable: true,
  firstParty: true,
  clonedFrom: '',
});
const list = (...entries: object[]) => JSON.stringify(entries);

describe('enabledBuiltins', () => {
  it('lista só os built-ins que a Island substitui e que estão ligados', () => {
    const json = list(
      entry('omarchy.notifications', true),
      entry('omarchy.osd', false),
      entry('omarchy.clipboard', true),
      entry('caionazario.island', true),
    );
    expect(enabledBuiltins(json)).toEqual(['omarchy.notifications']);
  });

  it('os dois desligados (instalação por install.sh) → lista vazia', () => {
    const json = list(entry('omarchy.notifications', false), entry('omarchy.osd', false));
    expect(enabledBuiltins(json)).toEqual([]);
  });

  it('built-in que nem aparece na lista não conta como ligado', () => {
    expect(enabledBuiltins(list(entry('omarchy.osd', true)))).toEqual(['omarchy.osd']);
  });

  it('só `enabled: true` conta: "true" e 1 são formato inesperado, não ligado', () => {
    const json = JSON.stringify([
      { id: 'omarchy.notifications', enabled: 'true' },
      { id: 'omarchy.osd', enabled: 1 },
    ]);
    expect(enabledBuiltins(json)).toEqual([]);
  });

  it.each([['<html>'], ['{}'], ['null'], ['"x"'], ['']])('JSON %j inesperado → null', (text) => {
    expect(enabledBuiltins(text)).toBeNull();
  });

  it('ignora itens que não são objeto, sem derrubar a lista', () => {
    const json = JSON.stringify([null, 3, 'x', entry('omarchy.osd', true)]);
    expect(enabledBuiltins(json)).toEqual(['omarchy.osd']);
  });
});

describe('takeoverStatus', () => {
  it('lista ainda não lida → unknown', () => {
    expect(takeoverStatus(null)).toBe('unknown');
  });

  it('algum built-in ligado → builtin: o Omarchy cuida', () => {
    expect(takeoverStatus(['omarchy.osd'])).toBe('builtin');
    expect(takeoverStatus([...REPLACED_PLUGIN_IDS])).toBe('builtin');
  });

  it('nenhum ligado → island: ela cuida', () => {
    expect(takeoverStatus([])).toBe('island');
  });
});

describe('shouldPromptTakeover', () => {
  it('pergunta uma vez, quando o Omarchy ainda cuida', () => {
    expect(shouldPromptTakeover(false, 'builtin')).toBe(true);
  });

  it('não repete depois de mostrada (mesmo apagada sem querer: os ajustes religam)', () => {
    expect(shouldPromptTakeover(true, 'builtin')).toBe(false);
  });

  it('não pergunta quando a Island já cuida nem enquanto o estado é desconhecido', () => {
    expect(shouldPromptTakeover(false, 'island')).toBe(false);
    expect(shouldPromptTakeover(false, 'unknown')).toBe(false);
  });
});

describe('takeoverPrompt', () => {
  it('fala em inglês por padrão e em pt-BR quando pedido', () => {
    expect(takeoverPrompt('en').title).toBe('Notifications');
    expect(takeoverPrompt('en').body).toContain('Click');
    expect(takeoverPrompt('pt-BR').title).toBe('Notificações');
    expect(takeoverPrompt('pt-BR').body).not.toBe(takeoverPrompt('en').body);
  });
});

describe('pluginToggleArgs', () => {
  it('um comando por plugin: o `omarchy plugin disable` ignora ids além do primeiro', () => {
    expect(pluginToggleArgs('disable', ['omarchy.notifications', 'omarchy.osd'])).toEqual([
      ['plugin', 'disable', 'omarchy.notifications'],
      ['plugin', 'disable', 'omarchy.osd'],
    ]);
  });

  it('sem plugins, sem comandos', () => {
    expect(pluginToggleArgs('enable', [])).toEqual([]);
  });

  it('só aceita ids que a Island substitui: nunca desliga outro plugin', () => {
    expect(pluginToggleArgs('disable', ['omarchy.bar', 'omarchy.osd', 'x; rm -rf ~'])).toEqual([
      ['plugin', 'disable', 'omarchy.osd'],
    ]);
  });
});

describe('matchesExpected', () => {
  it('mesmos built-ins ligados, em qualquer ordem → confere', () => {
    expect(
      matchesExpected(['omarchy.osd', 'omarchy.notifications'], [...REPLACED_PLUGIN_IDS]),
    ).toBe(true);
    expect(matchesExpected([], [])).toBe(true);
  });

  it('o shell ainda não aplicou tudo (só um dos dois mudou) → não confere', () => {
    expect(matchesExpected(['omarchy.osd'], [])).toBe(false);
    expect(matchesExpected(['omarchy.notifications'], [...REPLACED_PLUGIN_IDS])).toBe(false);
  });

  it('lista que não veio (null) nunca confere: não dá para dar a troca como feita', () => {
    expect(matchesExpected(null, [])).toBe(false);
  });
});
