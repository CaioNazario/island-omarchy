import { describe, expect, it } from 'vitest';
import { entrySettings, pluginCatalog, widgetInfo } from './pluginWidgets.js';

const registry = {
  omaplug: {
    component: {},
    metadata: { displayName: 'Plugin Manager', description: 'Manage plugins', firstParty: false },
  },
  'omarchy.clock': { component: {}, metadata: { displayName: 'Clock', firstParty: true } },
  'io.github.x.settings': { component: {}, metadata: { displayName: 'alpha settings' } },
  'bad id': { component: {}, metadata: { displayName: 'Bad' } },
  'no.component': { component: null, metadata: { displayName: 'Ghost' } },
};

describe('pluginCatalog', () => {
  it('lists third-party widgets with a component, sorted by name', () => {
    expect(pluginCatalog(registry)).toEqual([
      {
        id: 'plugin:io.github.x.settings',
        name: 'alpha settings',
        icon: 'puzzle-piece',
        description: '',
      },
      {
        id: 'plugin:omaplug',
        name: 'Plugin Manager',
        icon: 'puzzle-piece',
        description: 'Manage plugins',
      },
    ]);
  });

  it('falls back to the plugin id when there is no display name', () => {
    expect(pluginCatalog({ omaplug: { component: {}, metadata: {} } })[0]?.name).toBe('omaplug');
  });

  it.each([null, undefined, 3, 'x'])('gives an empty catalog for the registry %j', (value) => {
    expect(pluginCatalog(value)).toEqual([]);
  });
});

describe('widgetInfo', () => {
  const catalog = pluginCatalog(registry);

  it('describes an Island widget from its catalog', () => {
    expect(widgetInfo('ai', catalog)).toEqual({
      name: 'Uso de IA',
      icon: 'sparkle',
      description: 'Sessão e limite semanal',
    });
  });

  it('describes a loaded plugin widget', () => {
    expect(widgetInfo('plugin:omaplug', catalog)).toMatchObject({ name: 'Plugin Manager' });
  });

  it('names a plugin widget that is not loaded by its id', () => {
    expect(widgetInfo('plugin:gone', catalog)).toEqual({
      name: 'gone',
      icon: 'puzzle-piece',
      description: 'Plugin não carregado',
    });
  });

  it('gives null for an unknown id', () => {
    expect(widgetInfo('clock', catalog)).toBeNull();
  });
});

describe('entrySettings', () => {
  const layout = {
    left: [{ id: 'omarchy.menu' }, { id: 'omaplug', label: 'P', size: 2 }],
    center: [],
    right: [{ id: 'other' }],
  };

  it('returns the inline settings of the entry, without the id', () => {
    expect(entrySettings(layout, 'omaplug')).toEqual({ label: 'P', size: 2 });
  });

  it('gives an empty object for a plugin not in the layout', () => {
    expect(entrySettings(layout, 'missing')).toEqual({});
  });

  it('reads list-like sections as the JsonAdapter hands them', () => {
    const left = { length: 1, 0: { id: 'omaplug', label: 'P' } };
    expect(entrySettings({ left }, 'omaplug')).toEqual({ label: 'P' });
  });

  it.each([null, undefined, 'x', { left: 3 }])(
    'gives an empty object for the layout %j',
    (value) => {
      expect(entrySettings(value, 'omaplug')).toEqual({});
    },
  );
});
