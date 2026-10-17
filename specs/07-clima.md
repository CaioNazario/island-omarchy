# 07 · Clima

Origem: `design/markup.html` item de clima fixo `☀ 22°` na ilha compacta.

Código: `plugin/system/WeatherSource.qml`, regras em `src/core/weather.ts` e `weatherIcon.ts`.

## Fonte

Open-Meteo (`api.open-meteo.com/v1/forecast`, bloco `current`: `temperature_2m`, `weather_code`, `is_day`), sem chave de API, por `curl` como o widget de clima do Omarchy.

### Cadeia de localização

Resolvida na ordem, parando na primeira que der resultado:

1. **Cidade das preferências da Island** (spec 13; nome + latitude/longitude).
2. **Cidade do Omarchy**: `~/.local/state/omarchy/settings/weather.json` (`omarchy weather location`), vigiado: mudar a cidade no Omarchy atualiza a ilha.
3. Nada → o clima **some** da ilha compacta (fica `hora · dia`).

Sem geolocalização por IP (o widget do Omarchy usa o wttr.in por IP quando não há cidade; a Island não). Sem coordenadas no `weather.json`, conta como sem cidade.

### Primeira execução sem localização

Uma única vez, a Island emite uma notificação própria: "Configure sua cidade para ver o clima". Entra com as preferências (spec 13), que é onde o clique leva.

## Exibição

- Temperatura em **°C**, arredondada, sem casa decimal (`22°`).
- Atualização a cada 30 min e ao retomar da suspensão (salto no relógio maior que dois tiques de 1 min).
- Falha de rede: mantém o último valor por até 3h; depois some.
- Clicar no clima não faz nada.

### Condição → ícone (`ph-fill`, cor `accent-300`, 15px)

Pelo código WMO do Open-Meteo e `is_day`:

| Condição (códigos WMO) | Dia | Noite |
|---|---|---|
| céu limpo (0) | `ph-sun` | `ph-moon` |
| poucas nuvens (1, 2) | `ph-cloud-sun` | `ph-cloud-moon` |
| nublado (3) | `ph-cloud` | `ph-cloud` |
| névoa / neblina (45, 48) | `ph-cloud-fog` | `ph-cloud-fog` |
| garoa / chuva / pancadas (51–67, 80–82) | `ph-cloud-rain` | `ph-cloud-rain` |
| neve (71–77, 85, 86) | `ph-snowflake` | `ph-snowflake` |
| tempestade (95, 96, 99) | `ph-cloud-lightning` | `ph-cloud-lightning` |

Código desconhecido → o clima some. O mapeamento é uma função pura em `src/core/weatherIcon.ts`.

## Critérios de aceite

- [x] Testes de `weatherIcon.ts` cobrem todos os grupos de código e dia/noite; testes de `weather.ts` cobrem a resposta do Open-Meteo e o `weather.json`.
- [x] Com cidade nas preferências, a ilha mostra ícone + temperatura dessa cidade (captura no `make dev`).
- [ ] Sem cidade na Island nem no Omarchy: a ilha mostra só hora e dia, e a notificação de dica aparece uma única vez.
- [ ] Trocar a cidade (Island ou `omarchy weather location`) atualiza a ilha sem reiniciar o shell.
