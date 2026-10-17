#!/usr/bin/env bash
# Instala a Island como plugin de barra do Omarchy. A Island assume as
# notificações e o OSD (specs/14-spikes.md, S7): os plugins do Omarchy que
# respondem pelos mesmos alvos IPC ficam desligados enquanto ela estiver ativa.
set -euo pipefail

PLUGIN_ID="caionazario.island"
TARGET_DIR="$HOME/.config/omarchy/plugins/$PLUGIN_ID"
REPLACED_PLUGINS=(omarchy.notifications omarchy.osd)

usage() {
  echo "Uso: $0 [--uninstall]"
  exit 1
}

require_shell() {
  omarchy-shell shell ping >/dev/null 2>&1 && return 0
  echo "O omarchy-shell não está rodando; abra a sessão do Omarchy e tente de novo." >&2
  exit 1
}

uninstall() {
  require_shell
  # A barra volta primeiro: sem ela, o shell cairia na padrão de qualquer jeito.
  omarchy plugin enable omarchy.bar
  for id in "${REPLACED_PLUGINS[@]}"; do omarchy plugin enable "$id"; done
  if [[ -d "$TARGET_DIR" ]]; then
    rm -rf "$TARGET_DIR"
    echo "Removido: $TARGET_DIR"
  fi
  omarchy-shell shell rescanPlugins >/dev/null
}

install() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  require_shell
  make -C "$script_dir" build
  omarchy plugin validate "$script_dir/dist/$PLUGIN_ID"

  rm -rf "$TARGET_DIR"
  mkdir -p "$TARGET_DIR"
  cp -r "$script_dir/dist/$PLUGIN_ID/." "$TARGET_DIR/"
  omarchy-shell shell rescanPlugins >/dev/null

  for id in "${REPLACED_PLUGINS[@]}"; do omarchy plugin disable "$id"; done
  omarchy plugin enable "$PLUGIN_ID"
  echo "Instalado em: $TARGET_DIR"
  echo "Para voltar à barra do Omarchy: $0 --uninstall"
}

case "${1:-}" in
  --uninstall) uninstall ;;
  "") install ;;
  *) usage ;;
esac
