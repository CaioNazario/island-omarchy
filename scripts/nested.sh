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

# A Island é dona de `org.freedesktop.Notifications` neste D-Bus privado?
notifications_owned() {
  busctl --address="$(cat "$DIST/bus")" call org.freedesktop.DBus /org/freedesktop/DBus \
    org.freedesktop.DBus NameHasOwner s org.freedesktop.Notifications 2>/dev/null | awk '{print $2}'
}

# Onde o compositor pôs a janela da faixa do widget de plugin, em pixels do
# monitor virtual (o `hyprctl layers` dá coordenadas globais).
strip_window_x() {
  # shellcheck source=/dev/null
  source "$STATE"
  local offset
  offset="$(HYPRLAND_INSTANCE_SIGNATURE="$NESTED_INSTANCE" hyprctl monitors -j | jq -r '.[] | select(.name=="HEADLESS-ISLAND") | .x')"
  HYPRLAND_INSTANCE_SIGNATURE="$NESTED_INSTANCE" hyprctl layers -j |
    jq -r --argjson offset "$offset" '.["HEADLESS-ISLAND"].levels | to_entries[] | .value[] | select(.namespace == "island-plugin-widget") | .x - $offset'
}

# Janelas da tela de pausa do Pomodoro (spec 20) no monitor virtual.
break_layers() {
  # shellcheck source=/dev/null
  source "$STATE"
  HYPRLAND_INSTANCE_SIGNATURE="$NESTED_INSTANCE" hyprctl layers -j |
    jq -r '[.["HEADLESS-ISLAND"].levels | to_entries[] | .value[] | select(.namespace == "island-break")] | length'
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
  printf '{"environments": [["Semente","coffee",["pomodoro","note"],["hw","plugin:dev.fake"]],["Faixa","code",["plugin:dev.fake","music"],["hw"]]], "environmentIndex": 0, "appearance": {"shape": "square", "fill": "xadrez"}, "pomodoro": {"cycleLen": 2, "durationMode": "individual", "plan": [{"focusMin": 45, "breakMin": 9}, {"focusMin": 15, "breakMin": 3}]}}\n' \
    >"$DIST/xdg/config/island/settings.json"
}

smoke() {
  trap stop EXIT
  seed_settings
  # `pw-play` falso (spec 20 "Som"): guarda o arquivo pedido, sem tocar nada.
  mkdir -p "$DIST/stub-bin"
  : >"$DIST/sound.log"
  printf '#!/bin/sh\necho "$1" >>"%s"\n' "$DIST/sound.log" >"$DIST/stub-bin/pw-play"
  chmod +x "$DIST/stub-bin/pw-play"
  export PATH="$DIST/stub-bin:$PATH"
  start
  wait_for '[[ "$(harness_status)" == *"\"bar\":true"* ]]' "the bar to load"
  wait_for '[[ "$(harness_ipc environments)" == *"\"name\":\"Semente\""*"\"left\":[\"pomodoro\",\"note\"]"* ]]' "the environments saved in settings.json to load"
  wait_for '[[ "$(harness_ipc appearance)" == *"\"fill\":\"solid\""*"\"shape\":\"square\""* ]]' "the appearance saved in settings.json to load"
  # Regressão (AGENTS.md "Hurdles"): o plano do Pomodoro também é uma lista do
  # arquivo, que o JsonAdapter entrega sem ser `Array`; lida com `Array.isArray`
  # a Island subia com o plano padrão e a gravação seguinte apagava o do usuário.
  wait_for '[[ "$(harness_ipc pomodoro "" "")" == *"\"cycleLen\":2"*"\"plan\":[{\"focusMin\":45,\"breakMin\":9},{\"focusMin\":15,\"breakMin\":3}]"* ]]' "the pomodoro plan saved in settings.json to load"
  # Regressão: a nota e os ambientes ficavam legíveis por outros usuários
  # (pasta 0755 e arquivo 0644 com o umask 022). A semente cria a pasta como
  # uma instalação antiga; as duas pastas da Island têm de virar 0700.
  wait_for '[[ "$(stat -c %a "$DIST/xdg/config/island")" == 700 && "$(stat -c %a "$DIST/xdg/state/island")" == 700 ]]' "private settings and state folders"
  # Quem cuida das notificações (spec 04, S7): com os built-ins do `omarchy`
  # falso ligados a Island não cria o servidor (nem pede o nome D-Bus nem os
  # alvos IPC), e a pergunta aparece uma vez. Ligar passa pelo `omarchy plugin
  # disable` (um por plugin) e então a Island recebe as notificações. Ao
  # devolver, ela larga os alvos antes de religar os built-ins. O nome D-Bus
  # fica com o processo (o Quickshell 0.3.2 não o solta ao destruir o
  # servidor), então o que se confere depois do primeiro "ligar" é a entrega.
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"status\":\"builtin\""*"\"claimsNotifications\":false"*"\"claimsOsd\":false"* ]]' "the plugin list (built-ins on, Island not claiming)"
  wait_for '[[ "$(notifications_owned)" == false ]]' "the notifications name to stay free while the built-in handles them"
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"shown\":true"*"\"entries\":1"* ]]' "the one-time takeover prompt"
  # A pergunta fica 5000ms no card aberto (os avisos comuns, 2500ms): passados
  # 3,4s ainda está aberta, e depois fecha sozinha.
  timeout 3.4 tail -f /dev/null || true
  [[ "$(harness_ipc mode)" == notif ]] || {
    echo "smoke: the takeover prompt closed before 5 s (mode: $(harness_ipc mode))" >&2
    exit 1
  }
  wait_for '[[ "$(harness_ipc mode)" == compact ]]' "the takeover prompt to close by itself"
  harness_ipc takeover enable >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"status\":\"island\""*"\"claimsNotifications\":true"*"\"claimsOsd\":true"* ]]' "the Island to claim both targets"
  wait_for '[[ "$(notifications_owned)" == true ]]' "the Island to own the notifications name"
  # `-t 0`: não expira, como um aviso de crash ou uma notificação crítica. As que
  # expiram sozinhas somem do Quickshell antes de o próximo servidor nascer.
  notify -t 0 "after takeover" >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"entries\":2"* ]]' "a notification to reach the Island after the takeover"
  # Um aviso de crash do Omarchy: `critical` e sem expiração, não some sozinho.
  notify -u critical -t 0 "crash-like notice" >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"entries\":3"* ]]' "a critical notification to reach the Island"
  harness_ipc takeover handback >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"status\":\"builtin\""*"\"claimsNotifications\":false"*"\"claimsOsd\":false"* ]]' "the Island to give the targets back"
  # Ao devolver, o servidor que nasce no lugar (o do Omarchy) não pode receber de
  # volta o que a Island já recebeu: o Quickshell entrega ao servidor novo o que
  # o anterior ainda rastreia. (Os toasts "Process crashed" que voltavam ao
  # desligar o interruptor na sessão real eram outra coisa: popups persistidos
  # pelo próprio Omarchy.)
  harness_ipc omarchySimulator on >/dev/null
  timeout 2 tail -f /dev/null || true
  [[ "$(harness_ipc omarchySimulator status)" == 0 ]] || {
    echo "smoke: the server that takes over on hand-back got $(harness_ipc omarchySimulator status) old notification(s) replayed" >&2
    exit 1
  }
  harness_ipc omarchySimulator off >/dev/null
  # As notificações do servidor morrem com ele (a referência perde o `dismiss`):
  # só a pergunta interna fica na lista.
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"entries\":1"* ]]' "the server's notifications to leave the list on the way back"
  # Falha no meio do liga/desliga: nada de erro mudo, e o estado volta a ser lido.
  touch "$DIST/xdg/state/fake-plugins.fail"
  harness_ipc takeover enable >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"status\":\"builtin\""*"\"failed\":true"* ]]' "a failed takeover to be reported"
  rm -f "$DIST/xdg/state/fake-plugins.fail"
  # O código de saída mente nos dois sentidos: quem manda é a lista lida depois.
  # `exit 0` sem aplicar não é sucesso; `exit 1` com a troca aplicada (o shell
  # ocupado estoura os 2 s do wrapper) não é falha.
  touch "$DIST/xdg/state/fake-plugins.noop"
  harness_ipc takeover enable >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"status\":\"builtin\""*"\"busy\":false"*"\"failed\":true"* ]]' "a takeover that exits 0 without applying to be reported as failed"
  rm -f "$DIST/xdg/state/fake-plugins.noop"
  touch "$DIST/xdg/state/fake-plugins.applyfail"
  harness_ipc takeover enable >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"status\":\"island\""*"\"busy\":false"*"\"failed\":false"* ]]' "a takeover that applied but exited 1 to count as done"
  rm -f "$DIST/xdg/state/fake-plugins.applyfail"
  harness_ipc takeover enable >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"status\":\"island\""*"\"failed\":false"* ]]' "the takeover to work again after the failure"
  # O servidor da Island que nasce de novo não recebe de volta a notificação sem
  # expiração de antes: a lista tem só a pergunta (1). (O servidor que assume ao
  # devolver recebia: ver o `omarchySimulator` acima.)
  timeout 2 tail -f /dev/null || true
  [[ "$(harness_ipc takeover status)" == *"\"entries\":1"* ]] || {
    echo "smoke: notifications from the old server came back after taking over again: $(harness_ipc takeover status)" >&2
    exit 1
  }
  notify "after second takeover" >/dev/null
  wait_for '[[ "$(harness_ipc takeover status)" == *"\"entries\":2"* ]]' "one entry per notification after taking over again"
  # Regressão: a janela da faixa de um widget de plugin ficava onde a primeira
  # mudança de margem de uma rajada a deixou. Com a música entrando à direita
  # dele, a largura do slot muda duas vezes em 12ms; a janela aceitava a
  # primeira, perdia a segunda e o widget era desenhado por cima do título. O
  # QML sempre calculou a posição certa (`marginLeft`): quem erra é a janela.
  # Vem antes da aparência de vidro (o blur repinta a janela o tempo todo e
  # esconde o problema) e depois do bloco de notificações, cujos tempos (o
  # aviso de 5s) não aceitam um passo longo no meio.
  harness_ipc editorDo switch 1 >/dev/null
  wait_for '[[ "$(harness_ipc pluginWidget status)" == *"\"opened\":false"* ]]' "the plugin widget on the environment with music"
  # A janela recém-criada ainda recebe mudanças de margem: o problema aparece
  # com ela parada, como na barra de quem abre um vídeo depois de um tempo.
  timeout 3 tail -f /dev/null || true
  DBUS_SESSION_BUS_ADDRESS="$(cat "$DIST/bus")" python3 "$ROOT/dev/fake-mpris.py" >/dev/null 2>&1 &
  local mpris_pid=$!
  timeout 2 tail -f /dev/null || true
  wait_for '[[ "$(strip_window_x)" == "$(harness_ipc pluginWidget status | jq -r .marginLeft)" ]]' "the plugin widget window to follow its slot when the music starts"
  kill "$mpris_pid"
  timeout 2 tail -f /dev/null || true
  wait_for '[[ "$(strip_window_x)" == "$(harness_ipc pluginWidget status | jq -r .marginLeft)" ]]' "the plugin widget window to follow its slot when the music stops"
  harness_ipc editorDo switch 0 >/dev/null
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
  # Português e zoom grande nos hot-reloads (specs/13 "Idioma", 02 "Tamanho"):
  # cada texto traduzido e as regiões com zoom passam pelo motor real.
  harness_ipc editorDo language pt-BR >/dev/null
  harness_ipc editorDo barSize large >/dev/null
  wait_for '[[ "$(harness_ipc prefs)" == *"\"language\":\"pt-BR\""*"\"barSize\":\"large\""* ]]' "the language and bar size saved in settings.json"
  for i in $(seq 1 "$SMOKE_RELOADS"); do
    harness_ipc reload >/dev/null
    wait_for '[[ "$(harness_status)" == *"\"bar\":true"*"\"reloads\":$i"* ]]' "reload $i"
  done
  # Depois dos hot-reloads (o contador deles é conferido no laço), já em português
  # e com zoom grande. Tela de pausa do Pomodoro (spec 20): "Testar pausa" fecha a ilha e abre uma
  # janela `overlay` por monitor sem mexer no ciclo; a pausa real sobrevive ao
  # hot-reload e a Urgência a fecha sem parar o tempo.
  harness_ipc open pomodoro >/dev/null
  harness_ipc pomodoro settings "" >/dev/null
  harness_ipc pomodoro preview "" >/dev/null
  wait_for '[[ "$(break_layers)" == 1 ]]' "the break screen preview window"
  # A barra recém-recriada leva até 250ms para achar o serviço: a ilha fecha depois.
  wait_for '[[ "$(harness_ipc pomodoro "" "")" == *"\"mode\":\"compact\""* ]]' "the island to close for the break preview"
  [[ "$(harness_ipc pomodoro "" "")" == *"\"session\":1"*"\"completed\":0"* ]] || {
    echo "smoke: the break preview changed the cycle: $(harness_ipc pomodoro "" "")" >&2
    exit 1
  }
  harness_ipc pomodoro endPreview "" >/dev/null
  wait_for '[[ "$(break_layers)" == 0 ]]' "the break screen preview to close"
  harness_ipc pomodoro skip "" >/dev/null
  wait_for '[[ "$(break_layers)" == 1 ]]' "the break screen of a real break"
  harness_ipc reload >/dev/null
  wait_for '[[ "$(harness_status)" == *"\"bar\":true"* && "$(break_layers)" == 1 ]]' "the break screen to survive a hot-reload"
  harness_ipc pomodoro release "" >/dev/null
  wait_for '[[ "$(break_layers)" == 0 ]]' "the emergency exit to close the break screen"
  [[ "$(harness_ipc pomodoro "" "")" == *"\"phase\":\"break\""*"\"running\":true"* ]] || {
    echo "smoke: the emergency exit stopped the break timer: $(harness_ipc pomodoro "" "")" >&2
    exit 1
  }
  harness_ipc pomodoro restart "" >/dev/null
  # Som do fim da pausa (spec 20): escolher um toque o pré-ouve pelo `pw-play`;
  # "Desligado" fica em silêncio.
  harness_ipc pomodoro sound bell >/dev/null
  wait_for '[[ "$(cat "$DIST/sound.log")" == */complete.oga ]]' "the bell sound to reach pw-play"
  harness_ipc pomodoro sound off >/dev/null
  [[ "$(wc -l <"$DIST/sound.log")" == 1 ]] || {
    echo "smoke: the 'off' sound played something: $(cat "$DIST/sound.log")" >&2
    exit 1
  }
  # Engrenagem do widget com controles (spec 20): abre o card nas configurações
  # e, com ele já aberto, não o fecha.
  harness_ipc pomodoro barSettings "" >/dev/null
  [[ "$(harness_ipc pomodoro "" "")" == *"\"mode\":\"pomodoro\""*"\"settingsOpen\":true"* ]] || {
    echo "smoke: the widget gear did not open the Pomodoro settings: $(harness_ipc pomodoro "" "")" >&2
    exit 1
  }
  harness_ipc pomodoro barSettings "" >/dev/null
  [[ "$(harness_ipc pomodoro "" "")" == *"\"mode\":\"pomodoro\""*"\"settingsOpen\":true"* ]] || {
    echo "smoke: the widget gear closed the island that was already open: $(harness_ipc pomodoro "" "")" >&2
    exit 1
  }
  [[ "$(harness_ipc pomodoro "" "")" == *"\"plan\":[{\"focusMin\":45,\"breakMin\":9},{\"focusMin\":15,\"breakMin\":3}]"* ]] || {
    echo "smoke: the pomodoro plan changed across hot-reloads: $(harness_ipc pomodoro "" "")" >&2
    exit 1
  }
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
