#!/usr/bin/env bash
# Sobe o harness dentro do Hyprland aninhado (scripts/nested.sh), num D-Bus
# de sessão próprio: no barramento do usuário, o NotificationServer do
# harness disputaria org.freedesktop.Notifications com o omarchy-shell real.
#   run-harness.sh <plugin dir> <harness shell.qml> <log> <arquivo do bus>
set -euo pipefail

if [[ -z "${DBUS_ISLAND_PRIVATE:-}" ]]; then
  exec env DBUS_ISLAND_PRIVATE=1 dbus-run-session -- "$0" "$@"
fi

plugin_dir="$1" harness="$2" log="$3" bus_file="$4"
echo "$DBUS_SESSION_BUS_ADDRESS" >"$bus_file"
# Preferências e estado da Island ficam no build, não em ~/.config nem
# ~/.local/state do usuário. Credenciais de CLI e a cidade do Omarchy seguem
# lidas do HOME real, só leitura.
xdg="$(dirname "$log")/xdg"
mkdir -p "$xdg/config" "$xdg/state"
export XDG_CONFIG_HOME="$xdg/config" XDG_STATE_HOME="$xdg/state"
# Sem barramento de acessibilidade no D-Bus privado: o atk-bridge só avisaria.
NO_AT_BRIDGE=1 ISLAND_PLUGIN_DIR="$plugin_dir" exec qs -p "$harness" >"$log" 2>&1
