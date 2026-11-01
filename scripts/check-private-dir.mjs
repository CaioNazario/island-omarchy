#!/usr/bin/env node
// Roda o script das pastas privadas (src/core/privateDir.ts, specs/13) contra
// uma pasta de instalação antiga (0755, JSON 0644) e uma nova, e falha se
// alguma não terminar em 0700 com os JSON em 0600. Fica no `make lint` para
// rodar na CI; o `make smoke` confere o mesmo no motor real.
// Uso: `node scripts/check-private-dir.mjs <dist>/core`.

import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const coreDir = resolve(process.argv[2] ?? '');
const { PRIVATE_DIR_SCRIPT } = await import(pathToFileURL(join(coreDir, 'privateDir.mjs')).href);

const mode = (path) => (statSync(path).mode & 0o777).toString(8);
const root = mkdtempSync(join(tmpdir(), 'island-private-'));
try {
  const old = join(root, 'old island');
  mkdirSync(old, { mode: 0o755 });
  chmodSync(old, 0o755);
  writeFileSync(join(old, 'settings.json'), '{}', { mode: 0o644 });
  const fresh = join(root, 'new', 'island');
  for (const dir of [old, fresh]) execFileSync('sh', ['-c', PRIVATE_DIR_SCRIPT, 'sh', dir]);
  const found = {
    old: mode(old),
    oldJson: mode(join(old, 'settings.json')),
    fresh: mode(fresh),
  };
  if (found.old !== '700' || found.oldJson !== '600' || found.fresh !== '700') {
    console.error(`check-private-dir: expected 700/600/700, got ${JSON.stringify(found)}`);
    process.exit(1);
  }
  console.log('check-private-dir: old and new folders end up 0700, JSON 0600');
} finally {
  rmSync(root, { recursive: true, force: true });
}
