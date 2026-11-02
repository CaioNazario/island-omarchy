#!/usr/bin/env node
// Roda o parser do feed ICS no motor JS do QML (V4), onde ele roda no shell.
// O V4 difere do Node no que o Vitest não vê: `split` com regex estoura a
// pilha num feed grande, escrever fora de um `Uint8Array` lança em módulo,
// e o mesmo código é 15–30× mais lento. Feeds hostis da revisão do
// marketplace (#13501) precisam terminar rápido aqui, não só no Node.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const QML = process.env.QML ?? '/usr/lib/qt6/bin/qml';
const coreDir = resolve(process.argv[2] ?? '');
const icsEvents = join(coreDir, 'icsEvents.mjs');
if (!existsSync(icsEvents))
  throw new Error(`no icsEvents.mjs in "${coreDir}"; run make build first`);

// Folga larga para a CI: na 0.7.6 os feeds hostis levavam de segundos a
// minutos. O feed de 700 mil linhas só confere que não lança: ler um feed
// desse tamanho custa segundos no V4 (linear no tamanho, sem amplificação).
const MAX_MS = 3000;

const helpers = String.raw`
  const simple = 'BEGIN:VEVENT\nUID:a\nSUMMARY:Dentista\nDTSTART:20261018T120000Z\nDTEND:20261018T130000Z\nEND:VEVENT';
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const ords = ['', '1', '2', '3', '4', '5', '-1', '-2', '-3', '-4', '-5'];
  const allByDay = ords.reduce((all, o) => all.concat(days.map((d) => o + d)), []).join(',');
  const heavy = 'FREQ=YEARLY;COUNT=999999999;BYMONTH=1,2,3,4,5,6,7,8,9,10,11,12;BYDAY=' + allByDay;
  const repeat = (n, make) => { const out = []; for (let i = 0; i < n; i++) out.push(make(i)); return out.join('\n'); };
  const calendar = (body) => 'BEGIN:VCALENDAR\n' + body + '\nEND:VCALENDAR';
  const hostile = (i, extra) => 'BEGIN:VEVENT\nUID:h' + i + '\nSUMMARY:x\n' + extra + 'DTSTART:19000101T090000Z\nDTEND:19000101T100000Z\nRRULE:' + heavy + '\nEND:VEVENT';
`;

/** Nome → [expressão que monta o feed, teto em ms ou `null`]. Cada um roda num processo próprio: o lixo de um feed grande deixava o seguinte lento. */
const SCENARIOS = {
  'feed de 700 mil linhas': [
    String.raw`calendar(repeat(700000, () => 'X-A:1') + '\n' + simple)`,
    null,
  ],
  'BYMONTHDAY=-31 em fevereiro': [
    String.raw`calendar('BEGIN:VEVENT\nUID:m\nSUMMARY:Dentista\nDTSTART:20260131T120000Z\nRRULE:FREQ=MONTHLY;BYMONTHDAY=-31\nEND:VEVENT\n' + simple)`,
    MAX_MS,
  ],
  '1000 séries YEARLY com todos os BYDAY': [
    String.raw`calendar(repeat(1000, (i) => hostile(i, '')) + '\n' + simple)`,
    MAX_MS,
  ],
  '1000 séries YEARLY com 100 linhas extras cada': [
    String.raw`calendar(repeat(1000, (i) => hostile(i, repeat(100, () => 'X-A:1') + '\n')) + '\n' + simple)`,
    MAX_MS,
  ],
  'fuso com regras pesadas × 1000 eventos': [
    String.raw`calendar('BEGIN:VTIMEZONE\nTZID:H\n' + repeat(10, (i) => 'BEGIN:DAYLIGHT\nTZOFFSETFROM:-0300\nTZOFFSETTO:-0200\nDTSTART:' + (1970 + i) + '0101T000000\nRRULE:' + heavy + '\nEND:DAYLIGHT') + '\nEND:VTIMEZONE\n' + repeat(1000, (i) => 'BEGIN:VEVENT\nUID:e' + i + '\nSUMMARY:Dentista\nDTSTART;TZID=H:20261018T090000\nDURATION:PT1H\nEND:VEVENT'))`,
    MAX_MS,
  ],
  // Evento simples não gasta o orçamento da recorrência: o teto é de eventos.
  '100 mil eventos simples no mesmo dia': [
    String.raw`calendar(simple + '\n' + repeat(100000, (i) => 'BEGIN:VEVENT\nUID:p' + i + '\nDTSTAMP:20261018T000000Z\nSUMMARY:x\nDTSTART:20261018T120000Z\nEND:VEVENT'))`,
    MAX_MS,
  ],
  '30 mil VCALENDAR': [
    String.raw`calendar(simple) + '\n' + repeat(30000, () => 'BEGIN:VCALENDAR\nBEGIN:X\nEND:X\nEND:VCALENDAR')`,
    MAX_MS,
  ],
};

function qmlSource(build, maxMs) {
  return `import QtQml
import "file://${icsEvents}" as Ics
QtObject {
  function feed() {${helpers}  return ${build};
  }
  Component.onCompleted: {
    const text = feed();
    const started = Date.now();
    try {
      const events = Ics.parseIcsEvents(text, new Date(2026, 9, 18), new Date(2026, 9, 19));
      const ms = Date.now() - started;
      const ok = events.some((e) => e.summary === 'Dentista') && (${maxMs} === null || ms < ${maxMs});
      console.log((ok ? 'ok  ' : 'FAIL') + ' ' + ms + ' ms, ' + events.length + ' eventos');
      Qt.exit(ok ? 0 : 1);
    } catch (error) {
      console.log('FAIL ' + error);
      Qt.exit(1);
    }
  }
}
`;
}

function runScenario(dir, name, [build, maxMs]) {
  const file = join(dir, 'check.qml');
  writeFileSync(file, qmlSource(build, maxMs));
  const run = spawnSync(QML, [file], {
    env: { ...process.env, QT_QPA_PLATFORM: 'offscreen', QT_FORCE_STDERR_LOGGING: '1' },
    encoding: 'utf8',
    timeout: 60000,
  });
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}${run.error ?? ''}`.trim();
  return { ok: run.status === 0, line: `${name} (teto ${maxMs ?? '—'} ms): ${output}` };
}

const dir = mkdtempSync(join(tmpdir(), 'island-ics-'));
try {
  const results = Object.entries(SCENARIOS).map(([name, scenario]) =>
    runScenario(dir, name, scenario),
  );
  const report = results.map((r) => r.line).join('\n');
  if (results.every((r) => r.ok))
    console.log(`check-ics-engine: the ICS parser holds up in the QML engine\n${report}`);
  else {
    console.error(`check-ics-engine: the ICS parser failed in the QML engine\n${report}`);
    process.exitCode = 1;
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
