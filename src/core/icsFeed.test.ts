import { describe, expect, it } from 'vitest';
import { curlConfigLine, feedUrlFromSecret, isIcsFeed, MAX_FEED_BYTES } from './icsFeed.js';

describe('feedUrlFromSecret', () => {
  it('aceita https, tira espaço e \\n do fim', () => {
    expect(
      feedUrlFromSecret(' https://calendar.google.com/calendar/ical/x/private-k/basic.ics\n'),
    ).toBe('https://calendar.google.com/calendar/ical/x/private-k/basic.ics');
  });

  it('webcal:// vira https://', () => {
    expect(feedUrlFromSecret('webcal://example.com/a.ics')).toBe('https://example.com/a.ics');
  });

  it('http puro, vazio ou lixo não é URL do feed (a credencial iria em claro)', () => {
    expect(feedUrlFromSecret('http://example.com/a.ics')).toBeNull();
    expect(feedUrlFromSecret('')).toBeNull();
    expect(feedUrlFromSecret('não é url')).toBeNull();
  });

  it('URL com espaço ou aspas no meio é recusada', () => {
    expect(feedUrlFromSecret('https://a.com/x y.ics')).toBeNull();
    expect(feedUrlFromSecret('https://a.com/x".ics')).toBeNull();
  });
});

describe('curlConfigLine', () => {
  it('uma linha `url = "..."` para o `curl -K -`', () => {
    expect(curlConfigLine('https://a.com/b.ics')).toBe('url = "https://a.com/b.ics"\n');
  });
});

describe('isIcsFeed', () => {
  it('reconhece um VCALENDAR e recusa página de login', () => {
    expect(isIcsFeed('BEGIN:VCALENDAR\nVERSION:2.0')).toBe(true);
    expect(isIcsFeed('<!doctype html>')).toBe(false);
  });
});

describe('MAX_FEED_BYTES', () => {
  // O servidor do feed é de terceiros: uma resposta gigante não pode virar
  // o texto que a thread da UI analisa.
  it('feed maior que o limite não é aceito', () => {
    const body = 'BEGIN:VCALENDAR\n' + 'x'.repeat(MAX_FEED_BYTES);
    expect(isIcsFeed(body)).toBe(false);
  });

  it('o limite cabe um feed real com folga (o de 3000 eventos tem 1,4 MB)', () => {
    expect(MAX_FEED_BYTES).toBeGreaterThanOrEqual(5 * 1024 * 1024);
  });
});
