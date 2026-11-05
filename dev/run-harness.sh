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
# O `omarchy plugin enable|disable` real mexeria nos plugins do shell do
# usuário: o harness usa um falso, sobre um arquivo em `$xdg/state`.
export ISLAND_OMARCHY_CLI="$(cd "$(dirname "$0")" && pwd)/fake-omarchy.sh"
# Sem o portal: o Qt o ativa neste D-Bus privado e o
# xdg-desktop-portal-hyprland dele morre com SIGSEGV em `exit()` (libwayland-client,
# `wl_proxy_marshal_flags`) quando o Hyprland aninhado cai, e o Omarchy mostra uma
# mensagem de crash para cada core do usuário (um por `make smoke`/`make dev`).
# Sem barramento de acessibilidade também: o atk-bridge só avisaria.
NO_AT_BRIDGE=1 QT_NO_XDG_DESKTOP_PORTAL=1 QT_QPA_PLATFORMTHEME=generic \
  ISLAND_PLUGIN_DIR="$plugin_dir" exec qs -p "$harness" >"$log" 2>&1
