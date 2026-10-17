#!/usr/bin/env node
// Monta o plugin em `<dest>`: copia `plugin/` e `icons/` e gera um `qmldir`
// por pasta de QML. Com `qmldir`, uma importação de diretório só enxerga os
// tipos listados nele; gerar evita esquecer um componente novo. Arquivos com
// `pragma Singleton` entram como `singleton`. Os ícones saem brancos: o
// `MultiEffect` só tinge com a cor exata a partir do branco (preto continua
// preto), e os SVGs extraídos do design não têm `fill`.

import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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

function writeWhiteIcons(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from).filter((file) => file.endsWith('.svg'))) {
    const svg = readFileSync(join(from, name), 'utf8');
    if (!svg.startsWith('<svg '))
      throw new Error(`${name}: expected to start with "<svg ", got "${svg.slice(0, 20)}"`);
    writeFileSync(join(to, name), svg.replace('<svg ', '<svg fill="#ffffff" '));
  }
}

const DEST = process.argv[2];
if (!DEST) throw new Error('usage: build-plugin.mjs <dest dir>, got no argument');
cpSync(join(ROOT, 'plugin'), DEST, { recursive: true });
writeWhiteIcons(join(ROOT, 'icons'), join(DEST, 'icons'));
writeQmldirs(DEST);
console.log(`build-plugin: plugin assembled in ${DEST}`);
