import { describe, expect, it } from 'vitest';
import { identifySource, isBrowserApp } from './notificationSource.js';

// Payloads reais no GNOME 50 (spike S1): `new Notification(título, {body:
// "oi"})` em web.whatsapp.com, vistos pelo `dbus-monitor`. `appName` é o
// título da fonte no Shell, o `Name=` do `.desktop` do `desktop-entry`.
// Chromium: domínio na primeira linha do corpo e uma linha em branco.
const BRAVE_WHATSAPP = { appName: 'Brave', body: 'web.whatsapp.com\n\noi' };
const CHROME_WHATSAPP = { appName: 'Google Chrome', body: 'web.whatsapp.com\n\noi' };
// Firefox: só o corpo, sem a origem em nenhum campo nem hint.
const FIREFOX_WHATSAPP = { appName: 'Firefox', body: 'oi' };

const fromBrave = (domain: string, text = 'oi') => identifySource('Brave', `${domain}\n\n${text}`);

describe('identifySource', () => {
  it('site da tabela: nome e ícone da tabela, sem a linha do domínio', () => {
    expect(identifySource(BRAVE_WHATSAPP.appName, BRAVE_WHATSAPP.body)).toEqual({
      name: 'WhatsApp',
      glyph: 'whatsapp-logo-fill',
      body: 'oi',
    });
  });

  it.each([
    ['music.youtube.com', 'YouTube Music', 'youtube-logo-fill'],
    ['www.youtube.com', 'YouTube', 'youtube-logo-fill'],
    ['open.spotify.com', 'Spotify', 'spotify-logo-fill'],
  ])('%s → %s', (domain, name, glyph) => {
    expect(fromBrave(domain)).toMatchObject({ name, glyph });
  });

  it('ignora o www.', () => {
    expect(fromBrave('www.youtube.com').name).toBe('YouTube');
    expect(fromBrave('www.github.com').name).toBe('Github');
  });

  it('casa o subdomínio mais específico primeiro', () => {
    expect(fromBrave('music.youtube.com').name).toBe('YouTube Music');
    expect(fromBrave('m.youtube.com').name).toBe('YouTube');
  });

  it('domínio fora da tabela: rótulo registrável capitalizado e globo', () => {
    expect(fromBrave('twitch.tv')).toEqual({ name: 'Twitch', glyph: 'globe', body: 'oi' });
    expect(fromBrave('www.github.com').name).toBe('Github');
    expect(fromBrave('gist.github.com').name).toBe('Github');
  });

  it('sufixo de segundo nível não vira o nome', () => {
    expect(fromBrave('g1.globo.com.br').name).toBe('Globo');
    expect(fromBrave('www.bbc.co.uk').name).toBe('Bbc');
  });

  it('ignora a porta', () => {
    expect(fromBrave('app.example.com:8443').name).toBe('Example');
  });

  it('corpo com várias linhas mantém as linhas depois do domínio', () => {
    expect(fromBrave('web.whatsapp.com', 'Fulano\nboa noite').body).toBe('Fulano\nboa noite');
  });

  it('só o domínio, sem corpo', () => {
    expect(identifySource('Brave', 'web.whatsapp.com').body).toBe('');
  });

  it('domínio em link com body-markup', () => {
    const body = '<a href="https://web.whatsapp.com/">web.whatsapp.com</a>\n\noi';
    expect(identifySource('Brave', body)).toMatchObject({ name: 'WhatsApp', body: 'oi' });
  });

  it('Chrome usa a mesma regra do Brave', () => {
    expect(identifySource(CHROME_WHATSAPP.appName, CHROME_WHATSAPP.body)).toEqual({
      name: 'WhatsApp',
      glyph: 'whatsapp-logo-fill',
      body: 'oi',
    });
  });

  it('Chromium usa a mesma regra do Brave', () => {
    expect(identifySource('Chromium', 'web.whatsapp.com\n\noi').name).toBe('WhatsApp');
  });

  it('navegador sem domínio na primeira linha fica como app', () => {
    expect(identifySource('Brave', 'Download concluído\n\narquivo.zip')).toEqual({
      name: 'Brave',
      glyph: null,
      body: 'Download concluído\n\narquivo.zip',
    });
  });

  it('app nativo fica com o próprio nome e ícone, mesmo com domínio no corpo', () => {
    expect(identifySource('Thunderbird', 'github.com\n\nnovo e-mail')).toEqual({
      name: 'Thunderbird',
      glyph: null,
      body: 'github.com\n\nnovo e-mail',
    });
  });

  it('Firefox fica como app: não manda a origem', () => {
    expect(identifySource(FIREFOX_WHATSAPP.appName, FIREFOX_WHATSAPP.body)).toEqual({
      name: 'Firefox',
      glyph: null,
      body: 'oi',
    });
  });
});

describe('isBrowserApp', () => {
  it.each(['Brave', 'Google Chrome', 'Chromium', 'Firefox'])('%s é navegador', (appName) => {
    expect(isBrowserApp(appName)).toBe(true);
  });

  it('app nativo não é navegador', () => {
    expect(isBrowserApp('Telegram')).toBe(false);
  });
});
