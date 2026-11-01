#!/usr/bin/env node
// Regras do QML do plugin para dado de terceiros, que o Vitest não alcança
// (revisão do marketplace, #13501). Uso: `node scripts/check-qml-rules.mjs plugin`.
//
// - Todo `Text`/`TextEdit` declara `textFormat` como texto puro (specs/01
//   "Tipografia"): no `AutoText` padrão do Qt, um `<img src="http://…">` num
//   título de notificação, numa música ou num nome de rede vira um pedido de
//   rede a cada exibição.
// - Toda `Image` declara `sourceSize` (specs/05 "Capa"): a capa vem do player
//   no tamanho que ele quiser, e sem o teto a imagem decodifica inteira.
// - Todo `curl` leva `--max-filesize` (specs/06 e 07): o servidor é de
//   terceiros e a resposta inteira vai para a thread da UI.

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

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** Elementos `Tipo {` cujo bloco não casa com `required`. */
function blocksMissing(file, text, types, required, message) {
  const found = [];
  for (const match of text.matchAll(new RegExp(`^\\s*(${types})\\s*\\{`, 'gm'))) {
    const at = match.index + match[0].indexOf(match[1]);
    const body = blockAt(text, match.index + match[0].lastIndexOf('{'));
    if (!required.test(body)) found.push(`${file}:${lineOf(text, at)}: ${match[1]} ${message}`);
  }
  return found;
}

function curlsMissing(file, text) {
  return text
    .split('\n')
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => /"curl"/.test(line) && !/^\s*\/\//.test(line))
    .filter(({ line }) => !line.includes('"--max-filesize"'))
    .map(({ i }) => `${file}:${i + 1}: curl without --max-filesize`);
}

const problems = qmlFiles(dir).flatMap((file) => {
  const text = readFileSync(file, 'utf8');
  return [
    ...blocksMissing(
      file,
      text,
      'Text|TextEdit',
      /textFormat:\s*(Text|TextEdit)\.PlainText/,
      'without textFormat PlainText',
    ),
    ...blocksMissing(file, text, 'Image', /sourceSize:/, 'without sourceSize'),
    ...curlsMissing(file, text),
  ];
});
if (problems.length > 0) {
  console.error(`check-qml-rules:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('check-qml-rules: plain text, bounded images and capped curl everywhere');
