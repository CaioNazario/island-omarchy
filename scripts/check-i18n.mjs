#!/usr/bin/env node
// Confere o catálogo pt-BR (src/core/i18nPtBr.ts) contra o código
// (specs/13-preferencias.md "Idioma"): todo texto marcado tem tradução, e o
// catálogo não guarda texto que ninguém usa mais. As marcas são
// `I18n.tr("…")` e `I18n.count(n, "…", "…")` no QML, e `tr(lang, '…')`,
// `trCount(lang, n, '…', '…')` e `msg('…')` no core. Lê o catálogo já
// compilado: `node scripts/check-i18n.mjs <dist>/core`.

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('..', import.meta.url).pathname;
const coreDir = resolve(process.argv[2] ?? '');
const { PT_BR } = await import(pathToFileURL(join(coreDir, 'i18nPtBr.mjs')).href);

const STRING = String.raw`(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')`;
const MARKS = [
  String.raw`I18n\.tr\(\s*${STRING}`,
  String.raw`\btr\(\s*[\w.]+,\s*${STRING}`,
  String.raw`\bmsg\(\s*${STRING}`,
  String.raw`I18n\.count\([^,]+,\s*${STRING},\s*${STRING}`,
  String.raw`\btrCount\(\s*[\w.]+,\s*[^,]+,\s*${STRING},\s*${STRING}`,
].map((source) => new RegExp(source, 'g'));

function sourceFiles(dir, ext) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path, ext);
    return ext.test(entry.name) && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

function markedTexts() {
  const files = [
    ...sourceFiles(join(ROOT, 'plugin'), /\.qml$/),
    ...sourceFiles(join(ROOT, 'src', 'core'), /\.ts$/),
  ];
  const found = new Set();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const pattern of MARKS) {
      for (const match of text.matchAll(pattern)) {
        for (const group of match.slice(1)) {
          if (group !== undefined) found.add(group.replace(/\\(.)/g, '$1'));
        }
      }
    }
  }
  return found;
}

const marked = markedTexts();
const missing = [...marked].filter((text) => !(text in PT_BR));
const unused = Object.keys(PT_BR).filter((text) => !marked.has(text));
if (missing.length > 0 || unused.length > 0) {
  if (missing.length > 0) console.error(`check-i18n: missing in PT_BR:\n  ${missing.join('\n  ')}`);
  if (unused.length > 0) console.error(`check-i18n: unused in PT_BR:\n  ${unused.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-i18n: ${marked.size} texts, all translated`);
