// Seção nova do modo `wifi` (specs/08-controles-rapidos.md "Modo `wifi`";
// design v5): estatísticas, QR, teste de velocidade e DNS. Os dados vêm dos
// comandos que os painéis de rede, QR e velocidade do Omarchy usam:
// `omarchy-network-status --verbose`, `omarchy-network-qr --meta`,
// `omarchy-network-speedtest down|up` e `omarchy-dns`.

import { parseKeyValues } from './keyValue.js';

export interface NetworkSample {
  atMs: number;
  iface: string;
  ip: string;
  gateway: string;
  rxBytes: number;
  txBytes: number;
  routerPingMs: number | null;
  internetPingMs: number | null;
}

function numberOrNull(value: string | undefined): number | null {
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseNetworkStatus(raw: string, atMs: number): NetworkSample | null {
  const status = parseKeyValues(raw);
  if (!status.iface) return null;
  return {
    atMs,
    iface: status.iface,
    ip: status.ip ?? '',
    gateway: status.gateway ?? '',
    rxBytes: numberOrNull(status.rx_bytes) ?? 0,
    txBytes: numberOrNull(status.tx_bytes) ?? 0,
    routerPingMs: numberOrNull(status.router_ping_ms),
    internetPingMs: numberOrNull(status.internet_ping_ms),
  };
}

const DASH = '—';

/** Design: KB/s até 1024, depois MB/s, uma casa. */
function formatRate(bytesPerSecond: number): string {
  const kb = bytesPerSecond / 1024;
  return kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB/s' : kb.toFixed(1) + ' KB/s';
}

function formatBytes(bytes: number): string {
  return bytes >= 1e9 ? (bytes / 1e9).toFixed(2) + ' GB' : (bytes / 1e6).toFixed(1) + ' MB';
}

function formatPing(ms: number | null): string {
  return ms === null ? DASH : `${Math.round(ms)} ms`;
}

function rate(
  prev: NetworkSample | null,
  cur: NetworkSample,
  pick: (s: NetworkSample) => number,
): string {
  if (!prev || prev.iface !== cur.iface || cur.atMs <= prev.atMs) return DASH;
  const delta = pick(cur) - pick(prev);
  return delta < 0 ? DASH : formatRate((delta * 1000) / (cur.atMs - prev.atMs));
}

export interface StatRow {
  label: string;
  value: string;
}

/**
 * Oito linhas em duas colunas. O design mostra perda de pacotes, que o
 * `omarchy-network-status` não mede; no lugar entra o ping do roteador.
 */
export function networkStats(prev: NetworkSample | null, cur: NetworkSample | null): StatRow[] {
  const labels = [
    'Ping',
    'Ping do roteador',
    'Recebendo',
    'Enviando',
    'Baixado',
    'Enviado',
    'Endereço IP',
    'Gateway',
  ];
  if (!cur) return labels.map((label) => ({ label, value: DASH }));
  const values = [
    formatPing(cur.internetPingMs),
    formatPing(cur.routerPingMs),
    rate(prev, cur, (s) => s.rxBytes),
    rate(prev, cur, (s) => s.txBytes),
    formatBytes(cur.rxBytes),
    formatBytes(cur.txBytes),
    cur.ip || DASH,
    cur.gateway || DASH,
  ];
  return labels.map((label, i) => ({ label, value: values[i] ?? DASH }));
}

export type DnsProvider = 'DHCP' | 'Cloudflare' | 'Google' | 'Custom';

export const DNS_OPTIONS: { id: DnsProvider; label: string }[] = [
  { id: 'DHCP', label: 'DHCP' },
  { id: 'Cloudflare', label: 'Cloudflare' },
  { id: 'Google', label: 'Google' },
  { id: 'Custom', label: 'Personalizado' },
];

/** Servidores da linha `DNS=` do /etc/systemd/resolved.conf, sem o `#nome` do TLS. */
export function parseResolvedServers(conf: string): string[] {
  const line = conf.split('\n').find((entry) => /^\s*DNS\s*=/.test(entry));
  if (!line) return [];
  return line
    .replace(/^\s*DNS\s*=/, '')
    .trim()
    .split(/\s+/)
    .filter((server) => server !== '')
    .map((server) => server.replace(/#.*$/, ''));
}

/** Texto à direita de "Servidor DNS"; IPv4 primeiro, dois no máximo. */
export function dnsDetail(provider: string, gateway: string, customServers: string[]): string {
  if (provider === 'Cloudflare') return '1.1.1.1 · 1.0.0.1';
  if (provider === 'Google') return '8.8.8.8 · 8.8.4.4';
  if (provider === 'Custom') {
    const shown = customServers.filter((server) => !server.includes(':')).slice(0, 2);
    return shown.length > 0 ? shown.join(' · ') : 'Personalizado';
  }
  return gateway ? `Automático · ${gateway}` : 'Automático';
}

export type SpeedPhase = 'idle' | 'down' | 'up' | 'done' | 'failed';

/** Cada fase dura 5s, como o painel de velocidade do Omarchy. */
export const SPEED_PHASE_MS = 5000;

export function parseSpeedLine(line: string): number | null {
  const value = Number.parseFloat(line);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Download preenche até 55%, upload o resto (design `spProg`). */
export function speedProgress(phase: SpeedPhase, elapsedMs: number): number {
  const k = Math.min(1, Math.max(0, elapsedMs / SPEED_PHASE_MS));
  if (phase === 'down') return k * 0.55;
  if (phase === 'up') return 0.55 + k * 0.45;
  return phase === 'done' ? 1 : 0;
}

export function speedStatus(phase: SpeedPhase, pingMs: number | null): string {
  if (phase === 'down') return 'Medindo download…';
  if (phase === 'up') return 'Medindo upload…';
  if (phase === 'failed') return 'Falhou';
  if (phase === 'done')
    return pingMs === null ? 'Concluído' : `Concluído · ping ${Math.round(pingMs)} ms`;
  return '';
}

export interface WifiQr {
  iface: string;
  ssid: string;
  secured: boolean;
  /** Linhas de `0`/`1`, já com a margem branca; vazia se a matriz não for quadrada. */
  rows: string[];
}

/** `meta<TAB>iface<TAB>segurança<TAB>ssid` e a matriz (wifiqr/Model.js do Omarchy). */
export function parseQr(raw: string): WifiQr {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter((line) => line !== '');
  const qr: WifiQr = { iface: '', ssid: '', secured: false, rows: [] };
  if (lines[0]?.startsWith('meta\t')) {
    const fields = (lines.shift() ?? '').split('\t');
    qr.iface = fields[1] ?? '';
    qr.secured = (fields[2] ?? '') !== '' && fields[2] !== 'nopass';
    qr.ssid = fields.slice(3).join('\t');
  }
  const size = lines[0]?.length ?? 0;
  const square =
    size > 0 &&
    lines.length === size &&
    lines.every((line) => line.length === size && /^[01]+$/.test(line));
  qr.rows = square ? lines : [];
  return qr;
}

export interface WifiPanelParts {
  known: number;
  other: number;
  radioOn?: boolean;
  energyOpen?: boolean;
  customDns?: boolean;
  passwordField?: 'none' | 'normal' | 'error';
}

const LIST_MAX = 196;

/**
 * `renderVals()` do design v5: controles 46 (+48 energia) · divisor 9 ·
 * cabeçalho 56 · ligado: vista 88, divisor 11, DNS 58 (+38 personalizado),
 * divisor 11, lista até 196 (+ senha), 10; desligado: 160.
 */
export function wifiPanelHeight(parts: WifiPanelParts): number {
  const top = 46 + (parts.energyOpen ? 48 : 0) + 9 + 56;
  if (parts.radioOn === false) return top + 160;
  const password = parts.passwordField === 'error' ? 76 : parts.passwordField === 'normal' ? 58 : 0;
  const rows =
    (parts.known > 0 ? 20 + parts.known * 40 : 0) + (parts.other > 0 ? 20 + parts.other * 34 : 0);
  const list = Math.min(rows + password, LIST_MAX + password);
  return top + 88 + 11 + 58 + (parts.customDns ? 38 : 0) + 11 + list + 10;
}
