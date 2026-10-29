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
-- Saída virtual com tamanho e escala fixos: a janela do aninhado tem o
-- tamanho que o tiling da sessão do usuário der, e escala automática.
hl.monitor({ output = "HEADLESS-ISLAND", mode = "1600x900@60", position = "auto", scale = 1 })
hl.on("hyprland.start", function()
  hl.exec_cmd("hyprctl output create headless HEADLESS-ISLAND")
  -- Eventos automáticos da ilha vão para o monitor focado (specs/02-barra.md).
  hl.exec_cmd("sleep 0.5; hyprctl dispatch 'hl.dsp.focus({ monitor = \\"HEADLESS-ISLAND\\" })'")
  hl.exec_cmd("$ROOT/dev/run-harness.sh $PLUGIN_DIR $HARNESS $LOG $DIST/bus")
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
  local before before_instances
  before="$(wayland_sockets)"
  before_instances="$(ls "$XDG_RUNTIME_DIR/hypr" | sort)"
  # Pelo watchdog: sem ele, a Hyprland 0.56 cobre o canto da tela com um aviso.
  start-hyprland -- -c "$DIST/hyprland.lua" >"$DIST/hyprland.log" 2>&1 &
  local pid=$!
  wait_for '[[ -n "$(comm -13 <(echo "$before") <(wayland_sockets))" ]]' "the nested wayland socket"
  local socket
  socket="$(comm -13 <(echo "$before") <(wayland_sockets) | head -1)"
  # O hyprctl fala com a instância de HYPRLAND_INSTANCE_SIGNATURE, que é a da
  # sessão do usuário: guarda a do aninhado para falar com ele.
  local instance
  instance="$(comm -13 <(echo "$before_instances") <(ls "$XDG_RUNTIME_DIR/hypr" | sort) | head -1)"
  printf 'NESTED_PID=%s\nNESTED_SOCKET=%s\nNESTED_INSTANCE=%s\n' "$pid" "$socket" "$instance" >"$STATE"
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
  WAYLAND_DISPLAY="$NESTED_SOCKET" grim -o HEADLESS-ISLAND "${1:-$DIST/shot.png}"
}

log_errors() {
  # Avisos de QML saem como `WARN scene`/`WARN qml`; os de Qt sem relação com
  # a Island (portal, Gdk) ficam de fora.
  grep -E 'ERROR|TypeError|ReferenceError|WARN.*(scene|qml)' "$LOG" || true
}

# Regressão: o JsonAdapter entrega as listas do arquivo como objetos em que
# `Array.isArray` dá `false`, a leitura descartava os ambientes guardados e a
# Island subia com os iniciais depois de cada reinício (AGENTS.md "Hurdles").
# Só o motor real pega isso: o Vitest não tem o JsonAdapter. A aparência
# (spec 19) vai junto: um objeto aninhado do arquivo, com uma opção inválida.
seed_settings() {
  mkdir -p "$DIST/xdg/config/island"
  printf '{"environments": [["Semente","coffee",["pomodoro","note"],["hw","plugin:dev.fake"]]], "environmentIndex": 0, "appearance": {"shape": "square", "fill": "xadrez"}}\n' \
    >"$DIST/xdg/config/island/settings.json"
}

smoke() {
  trap stop EXIT
  seed_settings
  start
  wait_for '[[ "$(harness_status)" == *"\"bar\":true"* ]]' "the bar to load"
  wait_for '[[ "$(harness_ipc environments)" == *"\"name\":\"Semente\""*"\"left\":[\"pomodoro\",\"note\"]"* ]]' "the environments saved in settings.json to load"
  wait_for '[[ "$(harness_ipc appearance)" == *"\"fill\":\"solid\""*"\"shape\":\"square\""* ]]' "the appearance saved in settings.json to load"
  # Aparência fora do padrão nos hot-reloads (spec 19): os shaders de
  # gradiente e grão, os cantos quadrados e as regiões de blur.
  harness_ipc editorDo preset glass >/dev/null
  harness_ipc editorDo appearance 'shape "square"' >/dev/null
  harness_ipc editorDo appearance 'blur true' >/dev/null
  wait_for '[[ "$(harness_ipc appearance)" == *"\"fill\":\"gradient\""*"\"shape\":\"square\""*"\"blur\":true"* ]]' "the glass preset with square corners and blur"
  # Widget de plugin (spec 16): o painel abre logo abaixo da barra (28px +
  # 5), e um modo fixo da ilha o fecha.
  wait_for '[[ "$(harness_ipc pluginWidget status)" == *"\"opened\":false"* ]]' "the plugin widget to load"
  harness_ipc pluginWidget toggle >/dev/null
  wait_for '[[ "$(harness_ipc pluginWidget status)" == *"\"opened\":true,\"popupY\":33,\"active\":true"* ]]' "the plugin popout below the bar"
  harness_ipc open quick >/dev/null
  wait_for '[[ "$(harness_ipc pluginWidget status)" == *"\"opened\":false"*"\"active\":false"* ]]' "a fixed island mode to close the plugin popout"
  # Regressão: o componente do catálogo sumia depois que as instâncias dele
  # morriam numa troca de ambiente, e o widget não voltava.
  harness_ipc editorDo add "" >/dev/null
  wait_for '[[ "$(harness_ipc pluginWidget status)" == "{\"count\":0}" ]]' "an environment without the plugin widget"
  harness_ipc editorDo switch 0 >/dev/null
  wait_for '[[ "$(harness_ipc pluginWidget status)" == *"\"opened\":false"* ]]' "the plugin widget back after switching environments"
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

# Fica de pé em segundo plano até `nested.sh stop`: para scripts que dirigem
# a ilha por IPC (`nested.sh ipc dev open quick`) e capturam a tela.
serve() {
  start
  wait_for '[[ "$(harness_status)" == *"\"bar\":true"* ]]' "the bar to load"
  # Eventos automáticos vão para o monitor focado: espera o foco na saída virtual.
  # shellcheck source=/dev/null
  source "$STATE"
  wait_for 'HYPRLAND_INSTANCE_SIGNATURE="$NESTED_INSTANCE" hyprctl monitors | grep -A12 HEADLESS-ISLAND | grep -q "focused: yes"' "focus on the virtual output"
}

# Notificação de teste no D-Bus privado do harness:
#   nested.sh notify [notify-send args...]
notify() {
  DBUS_SESSION_BUS_ADDRESS="$(cat "$DIST/bus")" notify-send "$@"
}

ipc() {
  # shellcheck source=/dev/null
  source "$STATE"
  # `--`: métodos com nome de subcomando do qs (`show`) seguem como posicionais,
  # como no `omarchy-shell`.
  WAYLAND_DISPLAY="$NESTED_SOCKET" qs ipc -p "$HARNESS" call -- "$@"
}

case "${1:-}" in
  dev) dev ;;
  serve) serve ;;
  stop) stop ;;
  ipc) shift; ipc "$@" ;;
  notify) shift; notify "$@" ;;
  smoke) smoke ;;
  shot) shot "${2:-}" ;;
  *)
    echo "usage: $0 dev|smoke|serve|ipc|notify|shot|stop, got '${1:-}'" >&2
    exit 1
    ;;
esac
