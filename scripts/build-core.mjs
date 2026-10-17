#!/usr/bin/env node
// Transforma a saída do `tsc` em módulos que o QML importa: o motor do QML só
// trata `.mjs` como módulo ES (specs/14-spikes.md, S5). Renomeia cada `.js` e
// reescreve os imports relativos `./x.js` para `./x.mjs`.

import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RELATIVE_IMPORT = /(from\s+['"]\.{1,2}\/[^'"]+)\.js(['"])/g;

function convert(dir) {
  const files = readdirSync(dir).filter((name) => name.endsWith('.js'));
  if (files.length === 0) throw new Error(`no .js files in ${dir}; run tsc first`);
  for (const name of files) {
    const source = join(dir, name);
    const text = readFileSync(source, 'utf8').replace(RELATIVE_IMPORT, '$1.mjs$2');
    writeFileSync(source, text);
    renameSync(source, source.replace(/\.js$/, '.mjs'));
  }
  return files.length;
}

const dir = process.argv[2];
if (!dir) throw new Error('usage: build-core.mjs <tsc outDir>, got no argument');
console.log(`build-core: ${convert(dir)} modules in ${dir}`);
