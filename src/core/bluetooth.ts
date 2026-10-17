// Regras das listas do modo `bt` (specs/08-controles-rapidos.md). A fonte
// (`GnomeBluetooth.Client`) vive em src/system/bluetooth.ts e traduz cada
// dispositivo para `BtDeviceInfo`; aqui só entra dado puro.

export type DeviceKind =
  'headphones' | 'mouse' | 'keyboard' | 'speaker' | 'phone' | 'computer' | 'gamepad' | 'other';

export type BtOperationKind = 'connecting' | 'disconnecting' | 'pairing';

export interface BtOperation {
  path: string;
  kind: BtOperationKind;
}

export interface BtDeviceInfo {
  /** Caminho D-Bus do `org.bluez.Device1`: identifica o dispositivo. */
  path: string;
  name: string;
  /** O dispositivo anunciou um nome; sem ele, `name` é só o endereço. */
  hasName: boolean;
  kind: DeviceKind;
  paired: boolean;
  connected: boolean;
  /** 0–100, ou null se o nível não é conhecido. */
  battery: number | null;
}

export type DeviceStatus = 'connected' | 'disconnected' | 'pair' | BtOperationKind;

export interface BtDevice extends BtDeviceInfo {
  status: DeviceStatus;
}

export interface BtDeviceLists {
  paired: BtDevice[];
  nearby: BtDevice[];
}

export type BtClickAction = 'none' | 'connect' | 'disconnect' | 'pair';

/**
 * "Meus dispositivos" (pareados, conectados primeiro) e "Disponíveis" (não
 * pareados). Não pareado sem nome não entra: a busca acha de tudo por perto,
 * e uma lista de endereços não serve pra escolher o que parear.
 */
export function buildDeviceLists(
  devices: readonly BtDeviceInfo[],
  operation: BtOperation | null,
): BtDeviceLists {
  const paired: BtDevice[] = [];
  const nearby: BtDevice[] = [];
  for (const device of devices) {
    const status = deviceStatus(device, operation);
    if (device.paired) paired.push({ ...device, status });
    else if (device.hasName) nearby.push({ ...device, status });
  }
  paired.sort((a, b) => Number(b.connected) - Number(a.connected));
  return { paired, nearby };
}

function deviceStatus(device: BtDeviceInfo, operation: BtOperation | null): DeviceStatus {
  if (operation?.path === device.path) return operation.kind;
  if (!device.paired) return 'pair';
  return device.connected ? 'connected' : 'disconnected';
}

/** "Só uma operação por vez; cliques durante uma operação são ignorados." */
export function btClickAction(device: BtDevice, busy: boolean): BtClickAction {
  if (busy) return 'none';
  switch (device.status) {
    case 'connected':
      return 'disconnect';
    case 'disconnected':
      return 'connect';
    case 'pair':
      return 'pair';
    default:
      return 'none';
  }
}

/** Bateria só com o dispositivo conectado e o nível conhecido. */
export function visibleBattery(device: BtDevice): number | null {
  return device.connected ? device.battery : null;
}

export function btHeaderStatus(radioOn: boolean, connectedCount: number): string {
  if (!radioOn) return 'Desligado';
  return connectedCount === 1 ? '1 conectado' : `${connectedCount} conectados`;
}
