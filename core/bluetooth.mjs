// Regras das listas do modo `bt` (specs/08-controles-rapidos.md). A fonte
// (`Quickshell.Bluetooth`) vive em plugin/system/BluetoothSource.qml e traduz
// cada dispositivo para `BtDeviceInfo`; aqui só entra dado puro.
// Propriedade `Icon` do `org.bluez.Device1`, que o Quickshell expõe como
// `BluetoothDevice.icon` (nomes freedesktop derivados da classe do aparelho).
const KIND_BY_BLUEZ_ICON = {
    'audio-headset': 'headphones',
    'audio-headphones': 'headphones',
    'audio-card': 'speaker',
    'input-mouse': 'mouse',
    'input-keyboard': 'keyboard',
    'input-gaming': 'gamepad',
    phone: 'phone',
    computer: 'computer',
};
export function kindFromBluezIcon(icon) {
    var _a;
    return (_a = KIND_BY_BLUEZ_ICON[icon]) !== null && _a !== void 0 ? _a : 'other';
}
/**
 * "Meus dispositivos" (pareados, conectados primeiro) e "Disponíveis" (não
 * pareados). Não pareado sem nome não entra: a busca acha de tudo por perto,
 * e uma lista de endereços não serve pra escolher o que parear.
 */
export function buildDeviceLists(devices, operation) {
    const paired = [];
    const nearby = [];
    for (const device of devices) {
        const status = deviceStatus(device, operation);
        if (device.paired)
            paired.push(Object.assign(Object.assign({}, device), { status }));
        else if (device.hasName)
            nearby.push(Object.assign(Object.assign({}, device), { status }));
    }
    paired.sort((a, b) => Number(b.connected) - Number(a.connected));
    return { paired, nearby };
}
function deviceStatus(device, operation) {
    if ((operation === null || operation === void 0 ? void 0 : operation.path) === device.path)
        return operation.kind;
    if (!device.paired)
        return 'pair';
    return device.connected ? 'connected' : 'disconnected';
}
/** "Só uma operação por vez; cliques durante uma operação são ignorados." */
export function btClickAction(device, busy) {
    if (busy)
        return 'none';
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
export function visibleBattery(device) {
    return device.connected ? device.battery : null;
}
export function btHeaderStatus(radioOn, connectedCount) {
    if (!radioOn)
        return 'Desligado';
    return connectedCount === 1 ? '1 conectado' : `${connectedCount} conectados`;
}
