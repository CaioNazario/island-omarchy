#!/usr/bin/env bash
# Hyprland aninhado (uma janela na sessão atual) rodando o harness dev/ com o
# plugin de dist/. Nada é instalado na sessão do usuário (AGENTS.md "Nunca
# sem perguntar").
#
#   nested.sh dev     sobe e espera o Hyprland aninhado fechar
#   nested.sh smoke   sobe, força hot-reloads, captura a tela e falha com erro no log
#   nested.sh shot    captura a instância aberta por `dev` em dist/shot.png
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
PLUGIN_DIR="$DIST/caionazario.island"
HARNESS="$ROOT/dev/shell.qml"
STATE="$DIST/nested.env"
LOG="$DIST/dev.log"
SMOKE_RELOADS="${SMOKE_RELOADS:-5}"

wayland_sockets() {
  find "$XDG_RUNTIME_DIR" -maxdepth 1 -name 'wayland-[0-9]*' ! -name '*.lock' -printf '%f\n' | sort
}

write_config() {
  # Lua: o formato .conf sai na Hyprland 0.57 (aviso da 0.56.2).
  cat >"$DIST/hyprland.lua" <<EOF
hl.config({
  misc = { disable_hyprland_logo = true, disable_splash_rendering = true },
  debug = { suppress_errors = true },
})
hl.on("hyprland.start", function()
  hl.exec_cmd("ISLAND_PLUGIN_DIR=$PLUGIN_DIR qs -p $HARNESS >$LOG 2>&1")
end)
EOF
}

# Espera até 20s por `cond`; `wait` com timeout em vez de sleep em loop.
wait_for() {
  local cond="$1" what="$2"
  for _ in $(seq 1 100); do
    eval "$cond" && return 0
    timeout 0.2 tail -f /dev/null || true
  done
  echo "nested: timed out waiting for $what" >&2
  return 1
}

start() {
  [[ -d "$PLUGIN_DIR" ]] || { echo "nested: $PLUGIN_DIR missing, run make build" >&2; exit 1; }
  write_config
  : >"$LOG"
  local before
  before="$(wayland_sockets)"
  Hyprland -c "$DIST/hyprland.lua" >"$DIST/hyprland.log" 2>&1 &
  local pid=$!
  wait_for '[[ -n "$(comm -13 <(echo "$before") <(wayland_sockets))" ]]' "the nested wayland socket"
  local socket
  socket="$(comm -13 <(echo "$before") <(wayland_sockets) | head -1)"
  printf 'NESTED_PID=%s\nNESTED_SOCKET=%s\n' "$pid" "$socket" >"$STATE"
  echo "nested: Hyprland pid $pid on $socket, log in $LOG"
}

stop() {
  [[ -f "$STATE" ]] || return 0
  # shellcheck source=/dev/null
  source "$STATE"
  kill "$NESTED_PID" 2>/dev/null || true
  rm -f "$STATE"
}

# `qs ipc -p` só enxerga instâncias do display atual (`qs list --all` mostra
# a "Display connection"): fala com o aninhado pelo socket dele.
harness_ipc() {
  # shellcheck source=/dev/null
  source "$STATE"
  WAYLAND_DISPLAY="$NESTED_SOCKET" qs ipc -p "$HARNESS" call dev "$@" 2>/dev/null
}

harness_status() {
  harness_ipc status || true
}

shot() {
  # shellcheck source=/dev/null
  source "$STATE"
  WAYLAND_DISPLAY="$NESTED_SOCKET" grim "${1:-$DIST/shot.png}"
}

log_errors() {
  # Avisos de QML saem como `WARN scene`/`WARN qml`; os de Qt sem relação com
  # a Island (portal, Gdk) ficam de fora.
  grep -E 'ERROR|TypeError|ReferenceError|WARN.*(scene|qml)' "$LOG" || true
}

smoke() {
  trap stop EXIT
  start
  wait_for '[[ "$(harness_status)" == *"\"bar\":true"* ]]' "the bar to load"
  for i in $(seq 1 "$SMOKE_RELOADS"); do
    harness_ipc reload >/dev/null
    wait_for '[[ "$(harness_status)" == *"\"bar\":true"*"\"reloads\":$i"* ]]' "reload $i"
  done
  shot "$DIST/smoke.png"
  local errors
  errors="$(log_errors)"
  if [[ -n "$errors" ]]; then
    echo "smoke: errors in $LOG:" >&2
    echo "$errors" >&2
    exit 1
  fi
  echo "smoke: ok ($SMOKE_RELOADS reloads, screenshot in $DIST/smoke.png)"
}

dev() {
  trap stop EXIT
  start
  # shellcheck source=/dev/null
  source "$STATE"
  wait "$NESTED_PID" || true
}

case "${1:-}" in
  dev) dev ;;
  smoke) smoke ;;
  shot) shot "${2:-}" ;;
  *)
    echo "usage: $0 dev|smoke|shot, got '${1:-}'" >&2
    exit 1
    ;;
esac
