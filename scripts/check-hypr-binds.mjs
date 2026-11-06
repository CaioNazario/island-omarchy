#!/usr/bin/env node
// Teclas de volume e brilho em `hypr/island.lua` (specs/08 "OSD do
// Omarchy"). O Omarchy 4.5 trata essas teclas por atalho global dentro do shell,
// que chama o OSD pelo `summon` direto, sem passar pelo alvo IPC `osd` que a
// Island atende: com `omarchy.osd` desligado nada aparece. Cada tecla tem de
// ser refeita (`hl.unbind` antes do `o.bind`) com o comando que termina em
// `omarchy-osd`. Uso: `node scripts/check-hypr-binds.mjs hypr/island.lua`.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const KEYS = [
  ['XF86AudioRaiseVolume', 'omarchy-audio-output-volume raise'],
  ['XF86AudioLowerVolume', 'omarchy-audio-output-volume lower'],
  ['XF86AudioMute', 'omarchy-audio-output-volume mute-toggle'],
  ['XF86MonBrightnessUp', 'omarchy-brightness-display +5%'],
  ['XF86MonBrightnessDown', 'omarchy-brightness-display 5%-'],
];

const file = resolve(process.argv[2] ?? '');
const lines = readFileSync(file, 'utf8').split('\n');

const problems = KEYS.flatMap(([key, command]) => {
  const unbind = lines.findIndex((line) => line.includes(`hl.unbind("${key}")`));
  const bind = lines.findIndex(
    (line) => line.includes(`o.bind("${key}"`) && line.includes(`"${command}"`),
  );
  if (unbind === -1)
    return [`${key}: sem hl.unbind("${key}"), o Omarchy e a Island rodariam juntos`];
  if (bind === -1) return [`${key}: sem o.bind("${key}", …, "${command}")`];
  if (bind < unbind) return [`${key}: o.bind vem antes do hl.unbind e seria desfeito`];
  return [];
});

if (problems.length > 0) {
  console.error(`check-hypr-binds: ${file}\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-hypr-binds: ${KEYS.length} volume and brightness keys reach omarchy-osd`);
