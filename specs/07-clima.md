# 07 · Clima

Origem: `design/markup.html` item de clima fixo `☀ 22°` na ilha compacta.

Código: `plugin/system/WeatherSource.qml`, regras em `src/core/weather.ts` e `weatherIcon.ts`.

## Fonte

Open-Meteo (`api.open-meteo.com/v1/forecast`, bloco `current`: `temperature_2m`, `weather_code`, `is_day`), sem chave de API, por `curl` como o widget de clima do Omarchy. As respostas do Open-Meteo e do wttr.in passam por `--max-filesize` de 1 MB (`MAX_RESPONSE_BYTES`); o GitHub (spec 16), pelo mesmo teto no `HttpGet.qml`.

### Cadeia de localização

Igual ao widget de clima do Omarchy (`plugins/panels/weather`), resolvida na ordem:

1. **Cidade das preferências da Island** (spec 13; nome + latitude/longitude).
2. **Cidade do Omarchy com coordenadas**: `~/.local/state/omarchy/settings/weather.json` (`omarchy weather location`), vigiado: mudar a cidade no Omarchy atualiza a ilha.
3. **Sem coordenadas**: o wttr.in acha a área (`https://wttr.in/<nome>?format=j1` com o nome do `weather.json`, ou `https://wttr.in/?format=j1`, que detecta o lugar pela IP, quando o arquivo não existe — o padrão do Omarchy). As coordenadas de `nearest_area[0]` vão para o Open-Meteo, como o painel do Omarchy faz na detecção automática. A área é buscada de novo a cada atualização.
4. wttr.in fora do ar ou sem área: o clima **some** da ilha compacta (fica `hora · dia`) até a próxima tentativa.

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
