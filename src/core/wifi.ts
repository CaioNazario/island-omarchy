// Regras da lista de redes do modo `wifi` (specs/08-controles-rapidos.md).
// A fonte (`Quickshell.Networking`) vive em plugin/system/WifiSource.qml e
// traduz cada rede para `AccessPointInfo`; aqui só entra dado puro.

import { msg, tr, type Language } from './i18n.js';

export type WifiSecurity = 'open' | 'personal' | 'enterprise';

export type NetworkStatus = 'idle' | 'connecting' | 'connected';

export interface AccessPointInfo {
  ssid: string;
  /** 0–100. */
  strength: number;
  security: WifiSecurity;
  /** Há um perfil salvo no NM compatível com este AP. */
  hasProfile: boolean;
}

export interface ActiveNetwork {
  ssid: string;
  status: Exclude<NetworkStatus, 'idle'>;
}

export interface WifiNetwork extends AccessPointInfo {
  status: NetworkStatus;
}

export type SignalLevel = 'high' | 'medium' | 'low';

export type ClickAction = 'none' | 'activate' | 'password' | 'settings';

export const MIN_PASSWORD_LENGTH = 8;

/** Deduplica por SSID (fica o sinal mais forte), ativa primeiro e depois por sinal. */
export function buildNetworkList(
  accessPoints: readonly AccessPointInfo[],
  active: ActiveNetwork | null,
): WifiNetwork[] {
  const bySsid = new Map<string, WifiNetwork>();
  for (const ap of accessPoints) {
    if (ap.ssid === '') continue;
    const current = bySsid.get(ap.ssid);
    const hasProfile = ap.hasProfile || (current?.hasProfile ?? false);
    if (!current || ap.strength > current.strength) {
      bySsid.set(ap.ssid, { ...ap, hasProfile, status: 'idle' });
    } else {
      current.hasProfile = hasProfile;
    }
  }

  if (active) {
    const network = bySsid.get(active.ssid);
    if (network) network.status = active.status;
  }

  return [...bySsid.values()].sort((a, b) => {
    const aActive = a.status !== 'idle' ? 1 : 0;
    const bActive = b.status !== 'idle' ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return b.strength - a.strength;
  });
}

/**
 * "Redes conhecidas" e "Outras redes" do design v5. A ativa conta como
 * conhecida mesmo antes do NetworkManager marcar o perfil novo.
 */
export function splitNetworks(list: readonly WifiNetwork[]): {
  known: WifiNetwork[];
  other: WifiNetwork[];
} {
  const isKnown = (network: WifiNetwork) => network.hasProfile || network.status !== 'idle';
  return { known: list.filter(isKnown), other: list.filter((network) => !isKnown(network)) };
}

export function signalLevel(strength: number): SignalLevel {
  if (strength >= 67) return 'high';
  if (strength >= 34) return 'medium';
  return 'low';
}

export function clickAction(network: WifiNetwork): ClickAction {
  if (network.status !== 'idle') return 'none';
  if (network.security === 'open' || network.hasProfile) return 'activate';
  if (network.security === 'enterprise') return 'settings';
  return 'password';
}

export function validatePassword(password: string): 'too-short' | null {
  return password.length < MIN_PASSWORD_LENGTH ? 'too-short' : null;
}

/** Erro de `too-short` no painel de senha, em inglês: a UI traduz ao mostrar. */
export const PASSWORD_TOO_SHORT = msg('Password must be at least 8 characters');

export interface WifiHeader {
  title: string;
  status: string;
  glyph: string;
  /** Ícone em `accent`; desligado, `neutral-500`. */
  on: boolean;
}

/** Cabeçalho do design v5: a rede como título, o estado em maiúsculas embaixo. */
export function wifiHeader(
  radioOn: boolean,
  active: ActiveNetwork | null,
  lang: Language,
): WifiHeader {
  if (!radioOn)
    return { title: 'Wi‑Fi', status: tr(lang, 'Off'), glyph: 'wifi-slash-fill', on: false };
  if (!active)
    return { title: 'Wi‑Fi', status: tr(lang, 'Disconnected'), glyph: 'wifi-high-fill', on: true };
  const status =
    active.status === 'connecting' ? tr(lang, 'Connecting…') : tr(lang, 'Transmitting packets');
  return { title: active.ssid, status, glyph: 'wifi-high-fill', on: true };
}

const OPEN_TYPES = new Set(['Open', 'Owe']);
const ENTERPRISE_TYPES = new Set(['WpaEap', 'Wpa2Eap', 'Wpa3SuiteB192', 'Leap', 'DynamicWep']);

/** Nome do `WifiSecurityType` do Quickshell (`WifiSecurityType.toString`). */
export function securityFromQuickshell(name: string): WifiSecurity {
  if (OPEN_TYPES.has(name)) return 'open';
  if (ENTERPRISE_TYPES.has(name)) return 'enterprise';
  return 'personal';
}

// Mesma leitura do painel de rede do Omarchy (plugins/panels/network/Model.js
// `shouldRepromptPassphrase`, 4.0.4): numa rede com senha, PSK recusada chega
// como falta de segredo ou como autenticação expirada.
const WRONG_PASSWORD_REASONS = new Set(['NoSecrets', 'WifiAuthTimeout']);

/** Falha sem motivo conhecido, também a do tempo esgotado em WifiSource.qml. */
export const CONNECT_FAILED = msg("Couldn't connect");

/**
 * Nome do `ConnectionFailReason` do Quickshell → texto do painel de senha, em
 * inglês: a UI traduz na hora de mostrar.
 */
export function connectFailureMessage(reason: string): string {
  return WRONG_PASSWORD_REASONS.has(reason) ? msg('Wrong password') : CONNECT_FAILED;
}
