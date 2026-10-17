// Regras da lista de redes do modo `wifi` (specs/08-controles-rapidos.md).
// A fonte (`Quickshell.Networking`) vive em plugin/system/WifiSource.qml e
// traduz cada rede para `AccessPointInfo`; aqui só entra dado puro.
export const MIN_PASSWORD_LENGTH = 8;
/** Deduplica por SSID (fica o sinal mais forte), ativa primeiro e depois por sinal. */
export function buildNetworkList(accessPoints, active) {
    var _a;
    const bySsid = new Map();
    for (const ap of accessPoints) {
        if (ap.ssid === '')
            continue;
        const current = bySsid.get(ap.ssid);
        const hasProfile = ap.hasProfile || ((_a = current === null || current === void 0 ? void 0 : current.hasProfile) !== null && _a !== void 0 ? _a : false);
        if (!current || ap.strength > current.strength) {
            bySsid.set(ap.ssid, Object.assign(Object.assign({}, ap), { hasProfile, status: 'idle' }));
        }
        else {
            current.hasProfile = hasProfile;
        }
    }
    if (active) {
        const network = bySsid.get(active.ssid);
        if (network)
            network.status = active.status;
    }
    return [...bySsid.values()].sort((a, b) => {
        const aActive = a.status !== 'idle' ? 1 : 0;
        const bActive = b.status !== 'idle' ? 1 : 0;
        if (aActive !== bActive)
            return bActive - aActive;
        return b.strength - a.strength;
    });
}
/**
 * "Redes conhecidas" e "Outras redes" do design v5. A ativa conta como
 * conhecida mesmo antes do NetworkManager marcar o perfil novo.
 */
export function splitNetworks(list) {
    const isKnown = (network) => network.hasProfile || network.status !== 'idle';
    return { known: list.filter(isKnown), other: list.filter((network) => !isKnown(network)) };
}
export function signalLevel(strength) {
    if (strength >= 67)
        return 'high';
    if (strength >= 34)
        return 'medium';
    return 'low';
}
export function clickAction(network) {
    if (network.status !== 'idle')
        return 'none';
    if (network.security === 'open' || network.hasProfile)
        return 'activate';
    if (network.security === 'enterprise')
        return 'settings';
    return 'password';
}
export function validatePassword(password) {
    return password.length < MIN_PASSWORD_LENGTH ? 'too-short' : null;
}
/** Cabeçalho do design v5: a rede como título, o estado em maiúsculas embaixo. */
export function wifiHeader(radioOn, active) {
    if (!radioOn)
        return { title: 'Wi‑Fi', status: 'Desligado', glyph: 'wifi-slash-fill', on: false };
    if (!active)
        return { title: 'Wi‑Fi', status: 'Desconectado', glyph: 'wifi-high-fill', on: true };
    const status = active.status === 'connecting' ? 'Conectando…' : 'Transmitindo pacotes';
    return { title: active.ssid, status, glyph: 'wifi-high-fill', on: true };
}
const OPEN_TYPES = new Set(['Open', 'Owe']);
const ENTERPRISE_TYPES = new Set(['WpaEap', 'Wpa2Eap', 'Wpa3SuiteB192', 'Leap', 'DynamicWep']);
/** Nome do `WifiSecurityType` do Quickshell (`WifiSecurityType.toString`). */
export function securityFromQuickshell(name) {
    if (OPEN_TYPES.has(name))
        return 'open';
    if (ENTERPRISE_TYPES.has(name))
        return 'enterprise';
    return 'personal';
}
// Mesma leitura do painel de rede do Omarchy (plugins/panels/network/Model.js
// `shouldRepromptPassphrase`, 4.0.4): numa rede com senha, PSK recusada chega
// como falta de segredo ou como autenticação expirada.
const WRONG_PASSWORD_REASONS = new Set(['NoSecrets', 'WifiAuthTimeout']);
/** Nome do `ConnectionFailReason` do Quickshell → texto do painel de senha. */
export function connectFailureMessage(reason) {
    return WRONG_PASSWORD_REASONS.has(reason) ? 'Senha incorreta' : 'Não foi possível conectar';
}
