#!/usr/bin/env bash
# Instala a Island como plugin de barra do Omarchy. A Island assume as
# notificações e o OSD (specs/14-spikes.md, S7): os plugins do Omarchy que
# respondem pelos mesmos alvos IPC ficam desligados enquanto ela estiver ativa.
set -euo pipefail

PLUGIN_ID="caionazario.island"
TARGET_DIR="$HOME/.config/omarchy/plugins/$PLUGIN_ID"
REPLACED_PLUGINS=(omarchy.notifications omarchy.osd)
# Atalhos e gestos (hypr/island.lua): módulo próprio, ligado por uma linha no
# hyprland.lua. O resto da config do usuário fica intocado.
HYPR_DIR="$HOME/.config/hypr"
HYPR_MODULE="$HYPR_DIR/island.lua"
HYPR_MAIN="$HYPR_DIR/hyprland.lua"
HYPR_REQUIRE='require("hypr.island")'

usage() {
  echo "Uso: $0 [--uninstall]"
  exit 1
}

require_shell() {
  omarchy-shell shell ping >/dev/null 2>&1 && return 0
  echo "O omarchy-shell não está rodando; abra a sessão do Omarchy e tente de novo." >&2
  exit 1
}

install_hypr() {
  local script_dir="$1"
  cp "$script_dir/hypr/island.lua" "$HYPR_MODULE"
  if [[ ! -f "$HYPR_MAIN" ]]; then
    echo "Sem $HYPR_MAIN: adicione $HYPR_REQUIRE na sua config do Hyprland." >&2
    return
  fi
  if ! grep -qxF "$HYPR_REQUIRE" "$HYPR_MAIN"; then
    cp "$HYPR_MAIN" "$HYPR_MAIN.bak.$(date +%s)"
    printf '\n-- Atalhos e gestos da Island (install.sh).\n%s\n' "$HYPR_REQUIRE" >>"$HYPR_MAIN"
  fi
  hyprctl reload >/dev/null
}

uninstall_hypr() {
  if [[ -f "$HYPR_MAIN" ]] && grep -qxF "$HYPR_REQUIRE" "$HYPR_MAIN"; then
    cp "$HYPR_MAIN" "$HYPR_MAIN.bak.$(date +%s)"
    grep -vxF -e "$HYPR_REQUIRE" -e '-- Atalhos e gestos da Island (install.sh).' "$HYPR_MAIN" >"$HYPR_MAIN.tmp"
    mv "$HYPR_MAIN.tmp" "$HYPR_MAIN"
  fi
  rm -f "$HYPR_MODULE"
  hyprctl reload >/dev/null
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
  uninstall_hypr
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
  # Sem `Qt.clearComponentCache` (Qt 6.11), o hot-reload do shell recria a
  # barra com os componentes da instalação anterior: só um shell novo carrega
  # o build copiado.
  omarchy-restart-shell >/dev/null
  install_hypr "$script_dir"
  echo "Instalado em: $TARGET_DIR"
  echo "Atalhos e gestos em $HYPR_MODULE: Super+S (controles), Super+Ctrl+Alt+←/→ (ambiente),"
  echo "três dedos para baixo/cima (abre/fecha as notificações)."
  echo "Para voltar à barra do Omarchy: $0 --uninstall"
}

case "${1:-}" in
  --uninstall) uninstall ;;
  "") install ;;
  *) usage ;;
esac
