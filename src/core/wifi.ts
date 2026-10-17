// Regras da lista de redes do modo `wifi` (specs/08-controles-rapidos.md).
// A fonte (`NM.Client`) vive em src/system/wifi.ts e traduz cada AP para
// `AccessPointInfo`; aqui só entra dado puro.

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

export function headerStatus(radioOn: boolean, active: ActiveNetwork | null): string {
  if (!radioOn) return 'Desligado';
  if (!active) return 'Desconectado';
  return active.status === 'connecting' ? 'Conectando…' : `Conectado a ${active.ssid}`;
}
