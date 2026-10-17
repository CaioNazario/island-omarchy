import { describe, expect, it } from 'vitest';
import type { Mode } from './island.js';
import {
  formatRelativeTime,
  notificationText,
  routeNotification,
  type IncomingNotification,
} from './notifications.js';

const normal: IncomingNotification = {
  critical: false,
  low: false,
  acknowledged: false,
  bannersAllowed: true,
  fromBrowser: false,
};

const island = (mode: Mode, cardOpen = false) => ({ mode, cardOpen });

describe('routeNotification', () => {
  it('compact sem cartão abre notif', () => {
    expect(routeNotification(normal, island('compact'))).toBe('notif');
  });

  it('notif troca o conteúdo pela nova', () => {
    expect(routeNotification(normal, island('notif'))).toBe('notif');
  });

  it('stack recebe a nova no topo da lista', () => {
    expect(routeNotification(normal, island('stack'))).toBe('stack');
  });

  it('qualquer outro modo vira banner', () => {
    const others: Mode[] = [
      'music',
      'volume',
      'brightness',
      'calendar',
      'quick',
      'wifi',
      'bt',
      'ai',
    ];
    for (const mode of others) expect(routeNotification(normal, island(mode))).toBe('banner');
  });

  it('cartão central aberto vira banner, mesmo em compact', () => {
    expect(routeNotification(normal, island('compact', true))).toBe('banner');
  });

  it('não perturbe manda direto para a lista', () => {
    const dnd = { ...normal, bannersAllowed: false };
    expect(routeNotification(dnd, island('compact'))).toBe('list');
    expect(routeNotification(dnd, island('stack'))).toBe('list');
    expect(routeNotification(dnd, island('wifi'))).toBe('list');
  });

  it('urgência crítica fura o não perturbe e segue a tabela', () => {
    const critical = { ...normal, critical: true, bannersAllowed: false };
    expect(routeNotification(critical, island('compact'))).toBe('notif');
    expect(routeNotification(critical, island('stack'))).toBe('stack');
    expect(routeNotification(critical, island('wifi'))).toBe('banner');
  });

  it('urgência baixa e notificação já reconhecida vão só para a lista, como no Shell', () => {
    expect(routeNotification({ ...normal, low: true }, island('compact'))).toBe('list');
    expect(routeNotification({ ...normal, acknowledged: true }, island('compact'))).toBe('list');
  });
});

describe('formatRelativeTime', () => {
  const MIN = 60_000;

  it('"agora" abaixo de 1 min', () => {
    expect(formatRelativeTime(0)).toBe('agora');
    expect(formatRelativeTime(MIN - 1)).toBe('agora');
  });

  it('"há N min" abaixo de 60 min', () => {
    expect(formatRelativeTime(MIN)).toBe('há 1 min');
    expect(formatRelativeTime(59 * MIN + 59_000)).toBe('há 59 min');
  });

  it('"há N h" a partir de 60 min', () => {
    expect(formatRelativeTime(60 * MIN)).toBe('há 1 h');
    expect(formatRelativeTime(26 * 60 * MIN)).toBe('há 26 h');
  });

  it('relógio andando para trás conta como "agora"', () => {
    expect(formatRelativeTime(-5 * MIN)).toBe('agora');
  });
});

describe('notificationText', () => {
  it('junta título e corpo como no design ("Lucas: Bora no cinema hoje?")', () => {
    expect(notificationText('Telegram', 'Lucas', 'Bora no cinema hoje?', false)).toBe(
      'Lucas: Bora no cinema hoje?',
    );
  });

  it('usa só o que existir quando falta título ou corpo', () => {
    expect(notificationText('GitHub', '', 'ci: add dynamic island widget', false)).toBe(
      'ci: add dynamic island widget',
    );
    expect(notificationText('Discord', 'Nova mensagem', '', false)).toBe('Nova mensagem');
  });

  it('omite o título quando ele repete o nome do app', () => {
    expect(notificationText('Slack', 'Slack', 'Deploy concluído', false)).toBe('Deploy concluído');
  });

  it('achata quebras de linha e espaços em uma linha', () => {
    expect(notificationText('App', 'Oi', 'linha 1\n\n  linha 2\t', false)).toBe(
      'Oi: linha 1 linha 2',
    );
  });

  it('com markup, remove as tags e decodifica as entidades', () => {
    expect(
      notificationText(
        'App',
        'Oi',
        '<b>negrito</b> &amp; <a href="x">link</a> &lt;3 &#39;ok&#x27;',
        true,
      ),
    ).toBe("Oi: negrito & link <3 'ok'");
  });

  it('entidade numérica fora do Unicode fica literal, sem lançar', () => {
    expect(notificationText('App', '', 'a &#99999999; b', true)).toBe('a &#99999999; b');
  });

  it('sem markup, mantém o texto literal', () => {
    expect(notificationText('App', '', '<b>x</b> &amp;', false)).toBe('<b>x</b> &amp;');
  });
});
