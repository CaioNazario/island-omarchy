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

-- Volume e brilho. No Omarchy 4.5 estas teclas são atalhos globais que o
-- shell trata por dentro e chamam o OSD pelo `summon` direto, sem passar pelo
-- alvo IPC `osd` que a Island atende: com `omarchy.osd` desligado só sai o
-- aviso "summon: plugin not enabled" e o slider não abre. Aqui cada tecla roda o
-- comando que o Omarchy usava até o 4.4 (e ainda é o fallback do helpers.lua),
-- que termina em `omarchy-osd`. Rótulos e opções são os do Omarchy.
local key_options = { locked = true, repeating = true }
hl.unbind("XF86AudioRaiseVolume")
o.bind("XF86AudioRaiseVolume", "Volume up", "omarchy-audio-output-volume raise", key_options)
hl.unbind("XF86AudioLowerVolume")
o.bind("XF86AudioLowerVolume", "Volume down", "omarchy-audio-output-volume lower", key_options)
hl.unbind("XF86AudioMute")
o.bind("XF86AudioMute", "Mute", "omarchy-audio-output-volume mute-toggle", { locked = true })
hl.unbind("XF86MonBrightnessUp")
o.bind("XF86MonBrightnessUp", "Brightness up", "omarchy-brightness-display +5%", key_options)
hl.unbind("XF86MonBrightnessDown")
o.bind("XF86MonBrightnessDown", "Brightness down", "omarchy-brightness-display 5%-", key_options)
