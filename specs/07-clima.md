# 07 · Clima

Origem: `design/markup.html` item de clima fixo `☀ 22°` na ilha compacta.

Código: `plugin/system/WeatherSource.qml`, regras em `src/core/weather.ts` e `weatherIcon.ts`.

## Fonte

Open-Meteo (`api.open-meteo.com/v1/forecast`, bloco `current`: `temperature_2m`, `weather_code`, `is_day`), sem chave de API, por `curl` como o widget de clima do Omarchy. As respostas do Open-Meteo e do wttr.in passam por `--max-filesize` de 1 MB (`MAX_RESPONSE_BYTES`); o GitHub (spec 16), pelo mesmo teto no `HttpGet.qml`. O `make lint` (`scripts/check-qml-rules.mjs`) falha com um `curl` sem `--max-filesize`.

### Cadeia de localização

Igual ao widget de clima do Omarchy (`plugins/panels/weather`), resolvida na ordem:

1. **Cidade das preferências da Island** (spec 13; nome + latitude/longitude).
2. **Cidade do Omarchy com coordenadas**: `~/.local/state/omarchy/settings/weather.json` (`omarchy weather location`), vigiado: mudar a cidade no Omarchy atualiza a ilha.
3. **Sem coordenadas**: o wttr.in acha a área (`https://wttr.in/<nome>?format=j1` com o nome do `weather.json`, ou `https://wttr.in/?format=j1`, que detecta o lugar pela IP, quando o arquivo não existe — o padrão do Omarchy). As coordenadas de `nearest_area[0]` vão para o Open-Meteo, como o painel do Omarchy faz na detecção automática. A área é buscada de novo a cada atualização.
   Sem nome no `weather.json`, o wttr.in fora do ar ou sem área cai para a geolocalização por IP do ipwho.is (`https://ipwho.is/`, `latitude`/`longitude`); com nome, só o wttr.in o resolve.
4. Nenhuma fonte deu área: o clima **some** da ilha compacta (fica `hora · dia`) até a próxima tentativa, e a **notificação de dica** aparece (abaixo).

### Dica e escolha da cidade

- Sem cidade da Island, sem cidade do Omarchy e com todas as fontes de área falhas **depois de falar com algum servidor** (`curl` com saída 0 ou 22, `reachedServer`; DNS, conexão e tempo esgotado são "sem rede" e não contam) em **2 rodadas seguidas** (`HINT_AFTER_ROUNDS`, uma por minuto), a Island empurra uma notificação interna "Clima · Não achei sua cidade. Clique para escolher uma." (`WeatherHint.qml`, `hintMessage` no core). Ela só aparece **uma vez**: `weatherHintShown` no `state.json` vira `true` antes de a notificação sair e nunca volta a `false`.
- Clicar nela (no banner, no `notif` ou na lista) abre o editor na aba **Clima** (spec 17).
- A aba Clima mostra a cidade em uso e a origem (`weatherOrigin`: Escolhida aqui · Do Omarchy · Automático · Nenhuma cidade), busca por nome (`geocoding-api.open-meteo.com`, `count=20`, mesmo `--max-filesize`) e **Limpar**, que apaga `weatherLocation` e volta à cadeia. A cidade escolhida vale na hora e é saneada ao ler (`parseWeatherLocation`).

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
- [x] Sem cidade na Island nem no Omarchy: a ilha mostra só hora e dia, e a notificação de dica aparece uma única vez.
- [ ] Na aba Clima: buscar, escolher e limpar uma cidade troca a ilha sem reiniciar (captura no `make dev`).
- [ ] Trocar a cidade (Island ou `omarchy weather location`) atualiza a ilha sem reiniciar o shell.
