# 07 · Clima

Origem: `design/markup.html` linha 33 (item de clima fixo `☀ 22°` na ilha compacta).

## Fonte

`GWeather-4.0` direto na extensão (dados MET Norway, sem chave de API). Não depende do app GNOME Weather.

### Cadeia de localização

Resolvida na ordem, parando na primeira que der resultado:

1. **Cidade das preferências da Island** (`weather-location`, spec 13; busca de cidade via `GWeather.Location`).
2. **Cidades que o GNOME já conhece**: `org.gnome.shell.weather` `locations`, depois `org.gnome.Weather` `locations`, se os schemas existirem.
3. **Geoclue**, só se a localização do sistema estiver ligada (`org.gnome.system.location enabled`).
4. Nada → o clima **some** da ilha compacta (fica `hora · dia`).

Sem geolocalização por IP nem outro serviço externo.

### Primeira execução sem localização

Uma única vez (flag `weather-hint-shown` no GSettings), a Island emite uma notificação própria: "Configure sua cidade para ver o clima". Clicar nela abre as preferências na seção Clima.

## Exibição

- Temperatura em **°C**, arredondada, sem casa decimal (`22°`).
- Atualização a cada 30 min e ao retomar da suspensão.
- Falha de rede: mantém o último valor por até 3h; depois some.
- Clicar no clima não faz nada.

### Condição → ícone (`ph-fill`, cor `accent-300`, 15px)

| Condição GWeather | Dia | Noite |
|---|---|---|
| céu limpo | `ph-sun` | `ph-moon` |
| poucas nuvens | `ph-cloud-sun` | `ph-cloud-moon` |
| nublado | `ph-cloud` | `ph-cloud` |
| névoa / neblina | `ph-cloud-fog` | `ph-cloud-fog` |
| chuva / garoa | `ph-cloud-rain` | `ph-cloud-rain` |
| tempestade | `ph-cloud-lightning` | `ph-cloud-lightning` |
| neve / granizo | `ph-snowflake` | `ph-snowflake` |

O mapeamento é uma função pura em `src/core/weatherIcon.ts`.

## Critérios de aceite

- [x] Testes de `weatherIcon.ts` cobrem todas as condições e dia/noite.
- [x] Com cidade nas preferências, a ilha mostra ícone + temperatura dessa cidade.
- [x] Sem cidade, sem locations do GNOME e com localização desligada: a ilha mostra só hora e dia, e a notificação de dica aparece uma única vez.
- [x] Trocar a cidade nas preferências atualiza a ilha sem reiniciar a extensão.
