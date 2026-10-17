#!/usr/bin/env node
// Carrega todos os módulos do core no motor JS do QML (V4), sem compositor
// (`QT_QPA_PLATFORM=offscreen`). O V4 recusa sintaxe que o Node aceita
// (specs/14-spikes.md, S5); o Vitest não pegaria isso.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const QML = process.env.QML ?? '/usr/lib/qt6/bin/qml';
const coreDir = resolve(process.argv[2] ?? '');
const modules = readdirSync(coreDir).filter((name) => name.endsWith('.mjs'));
if (modules.length === 0) throw new Error(`no .mjs modules in "${coreDir}"; run make build first`);

const imports = modules.map((name, i) => `import "file://${join(coreDir, name)}" as M${i}`);
const checks = modules.map((_, i) => `Object.keys(M${i}).length`).join(' + ');
const source = `import QtQml\n${imports.join('\n')}\nQtObject {\n  Component.onCompleted: { console.log("modules ok", ${checks}); Qt.exit(0); }\n}\n`;

const dir = mkdtempSync(join(tmpdir(), 'island-core-'));
const file = join(dir, 'check.qml');
writeFileSync(file, source);
try {
  const output = execFileSync(QML, [file], {
    env: { ...process.env, QT_QPA_PLATFORM: 'offscreen' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 20000,
  });
  console.log(`check-core: ${modules.length} modules load in the QML engine ${output.trim()}`);
} catch (error) {
  console.error(
    `check-core: a core module failed to load in the QML engine\n${error.stderr ?? error}`,
  );
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
