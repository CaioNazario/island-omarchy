// Grupo de hardware da pílula direita (specs/10-hardware.md; design/logic.js
// `hw`, ~286): leitura de /proc, contas por delta, limiares e formatação.

export type HardwareBlockId = 'cpu' | 'ram' | 'gpu' | 'temp' | 'net';

/** `busy`: CPU ≥60% (`accent-300`); `hot`: TEMP ≥70° (vermelho de alerta). */
export type HardwareTone = 'normal' | 'busy' | 'hot';

export interface HardwareBlock {
  id: HardwareBlockId;
  label: string;
  value: string;
  tone: HardwareTone;
}

/** Valor mais largo de cada bloco, usado para fixar a largura (dígitos tabulares). */
export const WIDEST_VALUE: Record<HardwareBlockId, string> = {
  cpu: '100%',
  ram: '99.9G',
  gpu: '100%',
  temp: '100°',
  net: '↓99.9',
};

// Ordem em que os blocos somem por falta de espaço (specs/02-barra.md, largura
// mínima). CPU e RAM nunca somem.
const DROP_ORDER: readonly HardwareBlockId[] = ['net', 'gpu', 'temp'];

/**
 * Blocos de `ids` que cabem em `budget` px com `gap` entre eles, na ordem de
 * `ids`. Tira NET → GPU → TEMP até caber; CPU e RAM ficam mesmo sem caber.
 */
export function fittingBlocks(
  ids: readonly HardwareBlockId[],
  widthOf: (id: HardwareBlockId) => number,
  budget: number,
  gap: number,
): HardwareBlockId[] {
  const width = (shown: readonly HardwareBlockId[]): number =>
    shown.reduce((sum, id) => sum + widthOf(id), 0) + gap * Math.max(0, shown.length - 1);
  let shown = [...ids];
  for (const dropped of DROP_ORDER) {
    if (width(shown) <= budget) break;
    shown = shown.filter((id) => id !== dropped);
  }
  return shown;
}

const CPU_BUSY = 60;
const TEMP_HOT = 70;
const GIB = 1024 ** 3;
const MB = 1000 ** 2;

export interface CpuTimes {
  idle: number;
  total: number;
}

/**
 * Linha `cpu` de /proc/stat. O total soma user…steal; `guest`/`guest_nice`
 * já estão contados em user/nice. Idle inclui `iowait`.
 */
export function parseCpuTimes(stat: string): CpuTimes | null {
  const line = stat.split('\n').find((l) => l.startsWith('cpu '));
  if (!line) return null;
  const fields = line.trim().split(/\s+/).slice(1, 9).map(Number);
  if (fields.length < 5 || fields.some((n) => !Number.isFinite(n))) return null;
  const [, , , idle = 0, iowait = 0] = fields;
  return { idle: idle + iowait, total: fields.reduce((a, b) => a + b, 0) };
}

/** `1 − Δidle/Δtotal`, em %. Sem avanço dos contadores, 0. */
export function cpuUsage(prev: CpuTimes, cur: CpuTimes): number {
  const total = cur.total - prev.total;
  if (total <= 0) return 0;
  return clampPercent((1 - (cur.idle - prev.idle) / total) * 100);
}

export interface Memory {
  totalBytes: number;
  usedBytes: number;
}

/** /proc/meminfo: usada = `MemTotal − MemAvailable`. */
export function parseMeminfo(meminfo: string): Memory | null {
  const kib = (key: string): number | null => {
    const match = new RegExp(`^${key}:\\s+(\\d+)\\s*kB`, 'm').exec(meminfo);
    return match ? Number(match[1]) * 1024 : null;
  };
  const total = kib('MemTotal');
  const available = kib('MemAvailable');
  if (total === null || available === null) return null;
  return { totalBytes: total, usedBytes: Math.max(0, total - available) };
}

/** `100 − Δidle_ms/Δt_ms × 100` (RC6 do i915, `idle_residency_ms` do xe). */
export function busyFromIdleResidency(prevMs: number, curMs: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return clampPercent(100 - ((curMs - prevMs) / elapsedMs) * 100);
}

const VIRTUAL_INTERFACE = /^(lo|docker|veth|br-|virbr|tun|wg)/;

export function isPhysicalInterface(name: string): boolean {
  return !VIRTUAL_INTERFACE.test(name);
}

export interface NetBytes {
  rx: number;
}

/** /proc/net/dev: soma os bytes recebidos das interfaces físicas. */
export function parseNetDev(netDev: string): NetBytes {
  const sum = { rx: 0 };
  for (const line of netDev.split('\n')) {
    const counters = parseNetDevLine(line);
    if (!counters) continue;
    sum.rx += counters.rx;
  }
  return sum;
}

// `iface: rx_bytes …`; cabeçalho e interface virtual dão `null`.
function parseNetDevLine(line: string): NetBytes | null {
  const colon = line.indexOf(':');
  if (colon < 0 || !isPhysicalInterface(line.slice(0, colon).trim())) return null;
  const fields = line
    .slice(colon + 1)
    .trim()
    .split(/\s+/)
    .map(Number);
  const rx = fields[0];
  return rx !== undefined && Number.isFinite(rx) ? { rx } : null;
}

export interface NetRates {
  downBytesPerSecond: number;
}

/** Contador que volta (interface recriada) conta como 0, não negativo. */
export function netRates(prev: NetBytes, cur: NetBytes, elapsedMs: number): NetRates {
  if (elapsedMs <= 0) return { downBytesPerSecond: 0 };
  return { downBytesPerSecond: (Math.max(0, cur.rx - prev.rx) * 1000) / elapsedMs };
}

export interface HardwareReading {
  cpu: number;
  memory: Memory;
  /** `null`: nenhuma GPU reconhecida, o bloco some. */
  gpu: number | null;
  /** °C; `null`: nenhum sensor, o bloco some. */
  temp: number | null;
  net: NetRates;
}

export function hardwareBlocks(reading: HardwareReading): HardwareBlock[] {
  return [
    cpuBlock(reading.cpu),
    ramBlock(reading.memory),
    reading.gpu === null ? null : gpuBlock(reading.gpu),
    reading.temp === null ? null : tempBlock(reading.temp),
    netBlock(reading.net),
  ].filter((block) => block !== null);
}

function cpuBlock(percent: number): HardwareBlock {
  const cpu = Math.round(clampPercent(percent));
  const tone = cpu >= CPU_BUSY ? 'busy' : 'normal';
  return { id: 'cpu', label: 'CPU', value: `${cpu}%`, tone };
}

function ramBlock(memory: Memory): HardwareBlock {
  const used = oneDecimal(memory.usedBytes / GIB);
  return { id: 'ram', label: 'RAM', value: `${used}G`, tone: 'normal' };
}

function gpuBlock(percent: number): HardwareBlock {
  const gpu = Math.round(clampPercent(percent));
  return { id: 'gpu', label: 'GPU', value: `${gpu}%`, tone: 'normal' };
}

function tempBlock(celsius: number): HardwareBlock {
  const temp = Math.round(celsius);
  const tone = temp >= TEMP_HOT ? 'hot' : 'normal';
  return { id: 'temp', label: 'TEMP', value: `${temp}°`, tone };
}

function netBlock(net: NetRates): HardwareBlock {
  const down = megabytes(net.downBytesPerSecond);
  return { id: 'net', label: 'NET', value: `↓${down}`, tone: 'normal' };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function oneDecimal(value: number): string {
  return value.toFixed(1);
}

/** MB/s com 1 casa; ≥100 sem casa. Decide pelo valor arredondado: 99.96 vira `100`, não `100.0`. */
function megabytes(bytesPerSecond: number): string {
  const tenths = Math.round((bytesPerSecond / MB) * 10) / 10;
  return tenths >= 100 ? tenths.toFixed(0) : tenths.toFixed(1);
}
