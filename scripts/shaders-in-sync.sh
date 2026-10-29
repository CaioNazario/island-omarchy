#!/usr/bin/env bash
# Confere que cada plugin/shaders/*.frag.qsb commitado é o que o .frag compila
# (a saída do qsb é determinística: specs/14-spikes.md, S10). Assim o binário
# não carrega nada que a fonte não tenha. Mesma ideia do
# tests/static/shaders-in-sync.sh do omadock (MIT).
#
#   shaders-in-sync.sh          confere (make lint)
#   shaders-in-sync.sh --write  recompila os .qsb depois de editar um .frag
#
# Sem o qsb (pacote qt6-shadertools) a conferência é pulada, a menos que
# REQUIRE_QSB esteja definido, como na CI.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QSB=/usr/lib/qt6/bin/qsb
SHADERS="$ROOT/plugin/shaders"

compile() {
  "$QSB" --glsl "100 es,120,150" --hlsl 50 --msl 12 -o "$2" "$1" >/dev/null
}

if [[ ! -x "$QSB" ]]; then
  [[ -n "${REQUIRE_QSB:-}" ]] && { echo "shaders: $QSB missing, install qt6-shadertools" >&2; exit 1; }
  echo "shaders: skipped, $QSB missing"
  exit 0
fi

if [[ "${1:-}" == "--write" ]]; then
  for source in "$SHADERS"/*.frag; do compile "$source" "$source.qsb"; done
  echo "shaders: rebuilt"
  exit 0
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
status=0
for source in "$SHADERS"/*.frag; do
  compile "$source" "$tmp/out.qsb"
  if ! cmp -s "$tmp/out.qsb" "$source.qsb"; then
    echo "shaders: $source.qsb out of sync, run scripts/shaders-in-sync.sh --write" >&2
    status=1
  fi
done
[[ $status -eq 0 ]] && echo "shaders: in sync"
exit $status
