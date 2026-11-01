#!/usr/bin/env node
// Todo `Text`/`TextEdit` do plugin declara `textFormat` como texto puro
// (specs/01-design-tokens.md "Tipografia"). No `AutoText` padrão do Qt, um
// `<img src="http://…">` num título de notificação, numa música ou num nome
// de rede vira um pedido de rede a cada exibição. Os textos da Island passam
// pelo `IslandText`, que já é puro; este script barra um `Text {` novo sem a
// regra. Uso: `node scripts/check-plain-text.mjs plugin`.

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? '');

function qmlFiles(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return qmlFiles(child);
    return entry.name.endsWith('.qml') ? [child] : [];
  });
}

/** O corpo `{…}` que começa em `open`, contando chaves. */
function blockAt(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}' && --depth === 0) return text.slice(open, i + 1);
  }
  return text.slice(open);
}

const problems = [];
for (const file of qmlFiles(dir)) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/^\s*(Text|TextEdit)\s*\{/gm)) {
    const body = blockAt(text, match.index + match[0].lastIndexOf('{'));
    if (!/textFormat:\s*(Text|TextEdit)\.PlainText/.test(body)) {
      const at = match.index + match[0].indexOf(match[1]);
      const line = text.slice(0, at).split('\n').length;
      problems.push(`${file}:${line}: ${match[1]} without textFormat: ${match[1]}.PlainText`);
    }
  }
}
if (problems.length > 0) {
  console.error(`check-plain-text:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('check-plain-text: every Text and TextEdit is plain text');
