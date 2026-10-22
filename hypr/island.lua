-- Atalhos e gestos da Island (specs 03, 04 e 15). O install.sh copia este
-- arquivo para ~/.config/hypr/island.lua e liga com `require("hypr.island")`
-- no fim do hyprland.lua; a próxima instalação sobrescreve. Ajustes pessoais
-- vão em ~/.config/hypr/bindings.lua ou input.lua, não aqui.

-- `Super+S` é o scratchpad do Omarchy 4.0.4: o unbind tira esse bind antes.
hl.unbind("SUPER + S")
o.bind("SUPER + S", "Island: controles", "omarchy-shell island toggleQuick")

-- `Super+Ctrl+Alt+←/→` não tem bind padrão no Omarchy (spec 15).
o.bind("SUPER + CTRL + ALT + RIGHT", "Island: próximo ambiente", "omarchy-shell island nextEnvironment")
o.bind("SUPER + CTRL + ALT + LEFT", "Island: ambiente anterior", "omarchy-shell island previousEnvironment")

-- Três dedos: para baixo só abre a lista de notificações, para cima só fecha
-- (repetir o gesto não alterna; spec 04).
hl.gesture({ fingers = 3, direction = "down", action = function() hl.exec_cmd("omarchy-shell island openStack") end })
hl.gesture({ fingers = 3, direction = "up", action = function() hl.exec_cmd("omarchy-shell island closeStack") end })
