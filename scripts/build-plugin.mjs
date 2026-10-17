#!/usr/bin/env node
// Monta o plugin em `<dest>`: copia `plugin/` e `icons/` e gera um `qmldir`
// por pasta de QML. Com `qmldir`, uma importação de diretório só enxerga os
// tipos listados nele; gerar evita esquecer um componente novo. Arquivos com
// `pragma Singleton` entram como `singleton`.

import { cpSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

function qmlTypes(dir) {
  return readdirSync(dir)
    .filter((name) => /^[A-Z]\w*\.qml$/.test(name))
    .sort();
}

function qmldirLine(dir, file) {
  const type = file.replace(/\.qml$/, '');
  const singleton = /^\s*pragma\s+Singleton\b/m.test(readFileSync(join(dir, file), 'utf8'));
  return `${singleton ? 'singleton ' : ''}${type} 1.0 ${file}`;
}

function writeQmldirs(dir) {
  const types = qmlTypes(dir);
  // A raiz tem as entradas do plugin (Bar.qml, Service.qml), que o host
  // carrega por URL; um qmldir ali não serve a ninguém.
  if (types.length > 0 && dir !== DEST) {
    const lines = types.map((file) => qmldirLine(dir, file));
    writeFileSync(join(dir, 'qmldir'), lines.join('\n') + '\n');
  }
  for (const name of readdirSync(dir)) {
    const child = join(dir, name);
    if (statSync(child).isDirectory()) writeQmldirs(child);
  }
}

const DEST = process.argv[2];
if (!DEST) throw new Error('usage: build-plugin.mjs <dest dir>, got no argument');
cpSync(join(ROOT, 'plugin'), DEST, { recursive: true });
cpSync(join(ROOT, 'icons'), join(DEST, 'icons'), { recursive: true });
writeQmldirs(DEST);
console.log(`build-plugin: plugin assembled in ${DEST}`);
