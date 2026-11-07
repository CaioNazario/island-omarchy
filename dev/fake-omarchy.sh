#!/usr/bin/env bash
# `omarchy` de mentira do harness (`ISLAND_OMARCHY_CLI`): só `plugin list
# --json`, `plugin enable <id>` e `plugin disable <id>`, sobre um arquivo de
# estado em `$XDG_STATE_HOME` (os ids ligados, um por linha). O real pede ao
# omarchy-shell do usuário para gravar o shell.json dele, e o harness nunca
# pode fazer isso (AGENTS.md "Nunca sem perguntar"). Sem arquivo, os dois
# built-ins começam ligados, como numa instalação por `omarchy plugin add`.
# Com `fake-plugins.fail` ao lado do estado, enable/disable saem com 1 sem
# aplicar; com `.noop`, saem com 0 sem aplicar; com `.applyfail`, aplicam e saem
# com 1 (o que o wrapper `omarchy-shell` faz quando o shell, ocupado
# reconstruindo os painéis, não responde em 2 s: a troca vale e o código mente).
set -euo pipefail

state="${XDG_STATE_HOME:?XDG_STATE_HOME is required}/fake-plugins"
known=(omarchy.notifications omarchy.osd)
[[ -f "$state" ]] || printf '%s\n' "${known[@]}" >"$state"

entry() {
  local id="$1" enabled=false
  grep -qxF "$id" "$state" && enabled=true
  printf '{"id":"%s","name":"%s","kinds":["service"],"enabled":%s,"active":%s,"canDisable":true,"firstParty":true,"clonedFrom":""}' \
    "$id" "$id" "$enabled" "$enabled"
}

list() {
  printf '['
  entry omarchy.notifications
  printf ','
  entry omarchy.osd
  printf ',{"id":"caionazario.island","name":"Island Desktop","kinds":["bar","service"],"enabled":true,"active":true,"canDisable":false,"firstParty":false,"clonedFrom":""}]\n'
}

toggle() {
  local verb="$1" id="${2:-}"
  [[ -e "$state.fail" ]] && { echo "fake-omarchy: forced failure" >&2; exit 1; }
  [[ -e "$state.noop" ]] && exit 0
  [[ " ${known[*]} " == *" $id "* ]] || { echo "fake-omarchy: unknown plugin '$id'" >&2; exit 1; }
  grep -vxF "$id" "$state" >"$state.tmp" || true
  [[ "$verb" == enable ]] && echo "$id" >>"$state.tmp"
  mv "$state.tmp" "$state"
  [[ -e "$state.applyfail" ]] && { echo "omarchy-shell is not responding" >&2; exit 1; }
  return 0
}

case "${1:-} ${2:-}" in
  "plugin list") list ;;
  "plugin enable") toggle enable "${3:-}" ;;
  "plugin disable") toggle disable "${3:-}" ;;
  *) echo "fake-omarchy: unsupported: $*" >&2; exit 1 ;;
esac
