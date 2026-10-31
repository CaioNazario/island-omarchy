// Seção nova do modo `wifi` (specs/08-controles-rapidos.md "Modo `wifi`";
// design v5): estatísticas, QR, teste de velocidade e DNS. Os dados vêm dos
// comandos que os painéis de rede, QR e velocidade do Omarchy usam:
// `omarchy-network-status --verbose`, `omarchy-network-qr --meta`,
// `omarchy-network-speedtest down|up` e `omarchy-dns`.
import { msg, tr } from './i18n.mjs';
import { parseKeyValues } from './keyValue.mjs';
function numberOrNull(value) {
    const parsed = value === undefined ? NaN : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
export function parseNetworkStatus(raw, atMs) {
    var _a, _b, _c, _d;
    const status = parseKeyValues(raw);
    if (!status.iface)
        return null;
    return {
        atMs,
        iface: status.iface,
        ip: (_a = status.ip) !== null && _a !== void 0 ? _a : '',
        gateway: (_b = status.gateway) !== null && _b !== void 0 ? _b : '',
        rxBytes: (_c = numberOrNull(status.rx_bytes)) !== null && _c !== void 0 ? _c : 0,
        txBytes: (_d = numberOrNull(status.tx_bytes)) !== null && _d !== void 0 ? _d : 0,
        routerPingMs: numberOrNull(status.router_ping_ms),
        internetPingMs: numberOrNull(status.internet_ping_ms),
    };
}
const DASH = '—';
/** Design: KB/s até 1024, depois MB/s, uma casa. */
function formatRate(bytesPerSecond) {
    const kb = bytesPerSecond / 1024;
    return kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB/s' : kb.toFixed(1) + ' KB/s';
}
function formatBytes(bytes) {
    return bytes >= 1e9 ? (bytes / 1e9).toFixed(2) + ' GB' : (bytes / 1e6).toFixed(1) + ' MB';
}
function formatPing(ms) {
    return ms === null ? DASH : `${Math.round(ms)} ms`;
}
function rate(prev, cur, pick) {
    if (!prev || prev.iface !== cur.iface || cur.atMs <= prev.atMs)
        return DASH;
    const delta = pick(cur) - pick(prev);
    return delta < 0 ? DASH : formatRate((delta * 1000) / (cur.atMs - prev.atMs));
}
/**
 * Oito linhas em duas colunas. O design mostra perda de pacotes, que o
 * `omarchy-network-status` não mede; no lugar entra o ping do roteador. Os
 * rótulos saem em inglês: a UI traduz na hora de mostrar.
 */
export function networkStats(prev, cur) {
    const labels = [
        msg('Ping'),
        msg('Router ping'),
        msg('Receiving'),
        msg('Sending'),
        msg('Downloaded'),
        msg('Uploaded'),
        msg('IP address'),
        msg('Gateway'),
    ];
    if (!cur)
        return labels.map((label) => ({ label, value: DASH }));
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
    return labels.map((label, i) => { var _a; return ({ label, value: (_a = values[i]) !== null && _a !== void 0 ? _a : DASH }); });
}
/** `label` em inglês: a UI traduz na hora de mostrar. */
export const DNS_OPTIONS = [
    { id: 'DHCP', label: 'DHCP' },
    { id: 'Cloudflare', label: 'Cloudflare' },
    { id: 'Google', label: 'Google' },
    { id: 'Custom', label: msg('Custom') },
];
/** Servidores da linha `DNS=` do /etc/systemd/resolved.conf, sem o `#nome` do TLS. */
export function parseResolvedServers(conf) {
    const line = conf.split('\n').find((entry) => /^\s*DNS\s*=/.test(entry));
    if (!line)
        return [];
    return line
        .replace(/^\s*DNS\s*=/, '')
        .trim()
        .split(/\s+/)
        .filter((server) => server !== '')
        .map((server) => server.replace(/#.*$/, ''));
}
/** Texto à direita de "Servidor DNS"; IPv4 primeiro, dois no máximo. */
export function dnsDetail(provider, gateway, customServers, lang) {
    if (provider === 'Cloudflare')
        return '1.1.1.1 · 1.0.0.1';
    if (provider === 'Google')
        return '8.8.8.8 · 8.8.4.4';
    if (provider === 'Custom') {
        const shown = customServers.filter((server) => !server.includes(':')).slice(0, 2);
        return shown.length > 0 ? shown.join(' · ') : tr(lang, 'Custom');
    }
    return gateway ? tr(lang, 'Automatic · {gateway}', { gateway }) : tr(lang, 'Automatic');
}
/** Cada fase dura 5s, como o painel de velocidade do Omarchy. */
export const SPEED_PHASE_MS = 5000;
export function parseSpeedLine(line) {
    const value = Number.parseFloat(line);
    return Number.isFinite(value) && value >= 0 ? value : null;
}
/** Download preenche até 55%, upload o resto (design `spProg`). */
export function speedProgress(phase, elapsedMs) {
    const k = Math.min(1, Math.max(0, elapsedMs / SPEED_PHASE_MS));
    if (phase === 'down')
        return k * 0.55;
    if (phase === 'up')
        return 0.55 + k * 0.45;
    return phase === 'done' ? 1 : 0;
}
export function speedStatus(phase, pingMs, lang) {
    if (phase === 'down')
        return tr(lang, 'Measuring download…');
    if (phase === 'up')
        return tr(lang, 'Measuring upload…');
    if (phase === 'failed')
        return tr(lang, 'Failed');
    if (phase === 'done')
        return pingMs === null
            ? tr(lang, 'Complete')
            : tr(lang, 'Complete · ping {ms} ms', { ms: Math.round(pingMs) });
    return '';
}
/** `meta<TAB>iface<TAB>segurança<TAB>ssid` e a matriz (wifiqr/Model.js do Omarchy). */
export function parseQr(raw) {
    var _a, _b, _c, _d, _e, _f;
    const lines = raw
        .trim()
        .split(/\r?\n/)
        .filter((line) => line !== '');
    const qr = { iface: '', ssid: '', secured: false, rows: [] };
    if ((_a = lines[0]) === null || _a === void 0 ? void 0 : _a.startsWith('meta\t')) {
        const fields = ((_b = lines.shift()) !== null && _b !== void 0 ? _b : '').split('\t');
        qr.iface = (_c = fields[1]) !== null && _c !== void 0 ? _c : '';
        qr.secured = ((_d = fields[2]) !== null && _d !== void 0 ? _d : '') !== '' && fields[2] !== 'nopass';
        qr.ssid = fields.slice(3).join('\t');
    }
    const size = (_f = (_e = lines[0]) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0;
    const square = size > 0 &&
        lines.length === size &&
        lines.every((line) => line.length === size && /^[01]+$/.test(line));
    qr.rows = square ? lines : [];
    return qr;
}
const LIST_MAX = 196;
/**
 * `renderVals()` do design v5: controles 46 (+48 energia) · divisor 9 ·
 * cabeçalho 56 · ligado: vista 88, divisor 11, DNS 58 (+38 personalizado),
 * divisor 11, lista até 196 (+ senha), 10; desligado: 160.
 */
export function wifiPanelHeight(parts) {
    const top = 46 + (parts.energyOpen ? 48 : 0) + 9 + 56;
    if (parts.radioOn === false)
        return top + 160;
    const password = parts.passwordField === 'error' ? 76 : parts.passwordField === 'normal' ? 58 : 0;
    const rows = (parts.known > 0 ? 20 + parts.known * 40 : 0) + (parts.other > 0 ? 20 + parts.other * 34 : 0);
    const list = Math.min(rows + password, LIST_MAX + password);
    return top + 88 + 11 + 58 + (parts.customDns ? 38 : 0) + 11 + list + 10;
}
