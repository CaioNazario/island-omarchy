import { describe, expect, it } from 'vitest';
import {
  dnsDetail,
  networkStats,
  parseNetworkStatus,
  parseQr,
  parseResolvedServers,
  parseSpeedLine,
  speedProgress,
  speedStatus,
  wifiPanelHeight,
} from './wifiPanel.js';

const STATUS =
  'iface\twlp2s0\nip\t10.0.0.103\nprefix\t24\ngateway\t10.0.0.1\nrx_bytes\t2951270597\ntx_bytes\t192820618\ntype\twifi\nssid\tCasa\nrouter_ping_ms\t10.1\ninternet_ping_ms\t14.1\n';

describe('parseNetworkStatus', () => {
  it('lê omarchy-network-status --verbose com o instante da leitura', () => {
    expect(parseNetworkStatus(STATUS, 1000)).toEqual({
      atMs: 1000,
      iface: 'wlp2s0',
      ip: '10.0.0.103',
      gateway: '10.0.0.1',
      rxBytes: 2951270597,
      txBytes: 192820618,
      routerPingMs: 10.1,
      internetPingMs: 14.1,
    });
  });

  it('sem interface (desconectado) dá null', () => {
    expect(parseNetworkStatus('', 0)).toBeNull();
  });
});

describe('networkStats', () => {
  const first = parseNetworkStatus(STATUS, 0);
  const second = first && {
    ...first,
    atMs: 2000,
    rxBytes: first.rxBytes + 2_662_400,
    txBytes: first.txBytes + 2048,
  };

  it('oito linhas; as taxas saem do delta entre duas leituras', () => {
    const rows = networkStats(first, second);
    expect(rows).toEqual([
      { label: 'Ping', value: '14 ms' },
      { label: 'Ping do roteador', value: '10 ms' },
      { label: 'Recebendo', value: '1.3 MB/s' },
      { label: 'Enviando', value: '1.0 KB/s' },
      { label: 'Baixado', value: '2.95 GB' },
      { label: 'Enviado', value: '192.8 MB' },
      { label: 'Endereço IP', value: '10.0.0.103' },
      { label: 'Gateway', value: '10.0.0.1' },
    ]);
  });

  it('com uma leitura só, as taxas ficam em travessão', () => {
    expect(networkStats(null, first)[2]?.value).toBe('—');
  });

  it('sem conexão, tudo em travessão', () => {
    expect(networkStats(null, null).every((row) => row.value === '—')).toBe(true);
  });
});

describe('DNS', () => {
  it('detalhe de cada provedor do omarchy-dns', () => {
    expect(dnsDetail('DHCP', '10.0.0.1', [])).toBe('Automático · 10.0.0.1');
    expect(dnsDetail('Cloudflare', '', [])).toBe('1.1.1.1 · 1.0.0.1');
    expect(dnsDetail('Google', '', [])).toBe('8.8.8.8 · 8.8.4.4');
    expect(dnsDetail('Custom', '', ['9.9.9.9', '149.112.112.112', '2620:fe::fe'])).toBe(
      '9.9.9.9 · 149.112.112.112',
    );
    expect(dnsDetail('Custom', '', [])).toBe('Personalizado');
  });

  it('servidores da linha DNS= do resolved.conf, sem o nome TLS', () => {
    expect(
      parseResolvedServers('[Resolve]\nDNS=9.9.9.9#dns.quad9.net 1.1.1.1\nFallbackDNS=8.8.8.8\n'),
    ).toEqual(['9.9.9.9', '1.1.1.1']);
    expect(parseResolvedServers('[Resolve]\nDNSOverTLS=no\n')).toEqual([]);
  });
});

describe('teste de velocidade', () => {
  it('lê os Mbps de cada linha do omarchy-network-speedtest', () => {
    expect(parseSpeedLine('412.3')).toBe(412.3);
    expect(parseSpeedLine('erro')).toBeNull();
    expect(parseSpeedLine('-1')).toBeNull();
  });

  it('progresso: download até 55% em 5s, upload até 100% nos 5s seguintes', () => {
    expect(speedProgress('down', 0)).toBe(0);
    expect(speedProgress('down', 2500)).toBeCloseTo(0.275);
    expect(speedProgress('up', 5000)).toBe(1);
    expect(speedProgress('done', 0)).toBe(1);
    expect(speedProgress('idle', 0)).toBe(0);
  });

  it('texto do estado', () => {
    expect(speedStatus('down', null)).toBe('Medindo download…');
    expect(speedStatus('up', null)).toBe('Medindo upload…');
    expect(speedStatus('done', 14.1)).toBe('Concluído · ping 14 ms');
    expect(speedStatus('failed', null)).toBe('Falhou');
  });
});

describe('parseQr', () => {
  it('cabeçalho meta e matriz quadrada de 0/1 (omarchy-network-qr --meta)', () => {
    expect(parseQr('meta\twlp2s0\tWPA\tCasa\n101\n010\n111\n')).toEqual({
      iface: 'wlp2s0',
      secured: true,
      ssid: 'Casa',
      rows: ['101', '010', '111'],
    });
  });

  it('matriz torta não vira QR', () => {
    expect(parseQr('meta\tw\tnopass\tAberta\n10\n1\n').rows).toEqual([]);
    expect(parseQr('meta\tw\tnopass\tAberta\n11\n11\n').secured).toBe(false);
  });
});

describe('wifiPanelHeight', () => {
  it('fórmula do design v5 com redes conhecidas e outras', () => {
    // 46 + 9 + 56 + 88 + 11 + 58 + 11 + (20 + 1·40 + 20 + 3·34) + 10
    expect(wifiPanelHeight({ known: 1, other: 3 })).toBe(
      46 + 9 + 56 + 88 + 11 + 58 + 11 + 182 + 10,
    );
  });

  it('a lista para em 196px (+ senha) e rola', () => {
    expect(wifiPanelHeight({ known: 3, other: 9 })).toBe(
      46 + 9 + 56 + 88 + 11 + 58 + 11 + 196 + 10,
    );
    expect(wifiPanelHeight({ known: 3, other: 9, passwordField: 'error' })).toBe(
      46 + 9 + 56 + 88 + 11 + 58 + 11 + 196 + 76 + 10,
    );
  });

  it('energia, DNS personalizado e rádio desligado', () => {
    const base = wifiPanelHeight({ known: 1, other: 0 });
    expect(wifiPanelHeight({ known: 1, other: 0, energyOpen: true })).toBe(base + 48);
    expect(wifiPanelHeight({ known: 1, other: 0, customDns: true })).toBe(base + 38);
    expect(wifiPanelHeight({ known: 1, other: 0, radioOn: false })).toBe(46 + 9 + 56 + 160);
  });

  it('sem redes conhecidas, o rótulo delas some', () => {
    expect(wifiPanelHeight({ known: 0, other: 1 })).toBe(46 + 9 + 56 + 88 + 11 + 58 + 11 + 54 + 10);
  });
});
