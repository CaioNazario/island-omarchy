# 11 · Bateria

Origem: `design/markup.html` botão `openSystem` na pílula direita; `design/logic.js` `batColor`, `batText`, `batFillW`, `batFillBg`, `batNum`, `chgD`.

## Fonte

`UPower.displayDevice` do Quickshell (`plugin/system/BatterySource.qml`; `percentage` vem em 0–1). Sem bateria de laptop (`isLaptopBattery`) → o botão some.

## Exibição

Botão 24px de altura, padding 0 10px, gap 4px, clique abre o modo `battery`. No design v3 o ícone Phosphor + `78%` virou um desenho de bateria, depois afinado:

- **Corpo**: 26×12, borda 1px preta, raio 3, fundo `neutral-600` na parte vazia, conteúdo cortado.
- **Preenchimento**: largura = nível %, colado na borda, cor sólida da bateria, raio 2 só à esquerda (nos quatro cantos quando cheio), transição de largura 300ms.
- **Número**: nível sem `%`, centralizado sobre o corpo, 8px/600, `letter-spacing −0.02em`, dígitos tabulares, preto.
- **Polo**: 2×4 colado à direita do corpo (gap 1px), raio 0 1 1 0, `neutral-600` (preto sumiria no fundo da pílula).
- **Raio de carga**: `ph-fill ph-lightning` 11px na cor da bateria, depois do polo, só carregando.

Regra pura em `src/core/battery.ts`:

| Nível | Cor da bateria |
|---|---|
| ≥90 | `#2e9e4f` (verde sólido) |
| ≤20 | `#c62f2f` (vermelho sólido) |
| entre | `neutral-300` |
| economia de bateria ligada (perfil `power-saver`) | `#e0b122` (amarelo), vale para o botão e o painel e sobrepõe o nível |

A tabela de ícones `ph-battery-*` por nível saiu: a barra não usa mais ícone de bateria (o `ph-fill ph-battery-medium` dos dispositivos Bluetooth, spec 08, continua).

"Carregando" = estado UPower `Charging`, `FullyCharged` ou `PendingCharge` (na tomada, parado pelo limite de carga). As cores seguem o nível também carregando.

## Modo `battery`

Painel do design v5 (`battery`), fixo, 440×225 (142 sem power-profiles-daemon, sem a seção de perfis). Abre pelo botão da bateria; o desenho do botão na barra continua o desta spec (o v5 não muda o botão, e o usuário pediu para mantê-lo). Padding 14px 16px:

- **Cabeçalho** 44px, gap 12: ícone 26px (`batteryGlyph`: carregando `ph-fill ph-battery-charging`; senão por nível, `full` ≥95, `high` ≥60, `medium` >20, `low` >8, `warning`) na cor do nível desta spec (verde ≥90, vermelho ≤20, `neutral-300` entre); "Bateria" 14px/500; legenda 10.5px maiúscula `neutral-400` com o estado; à direita o nível `27%` 32px/500, `letter-spacing −.02em`.
  - Estado: "Carregando", "Carga completa", "Limite de carga · 80%" (parada no limite configurado, com o teto de `threshold`) ou "Na bateria".
- **Barra** 6px raio 3 (margin-top 10): nível em vermelho até 20%, verde acima, largura animada em 600ms.
- **Estatísticas** em duas colunas (gap 28, margin-top 14), linhas de 20px 12px, rótulo `neutral-500` e valor `neutral-200`: Capacidade (`29 Wh`), "Até carga total" ou "Tempo restante" (`1h 18min`), Ciclos de carga, "Potência de carga" ou "Consumo" (`16.9 W`). Cheia ou parada no limite, tempo e potência viram "—".
- **Perfil de energia**: divisor (margin 12px 0 10px), rótulo e três botões de 36px raio 10 com ícone 14px: Economia (`ph ph-leaf`), Equilibrado (`ph ph-scales`), Desempenho (`ph ph-lightning`); o ativo em `accent-900` com anel `accent-700`. Clicar roda `omarchy-powerprofiles-set ac|battery PERFIL` (guarda o perfil para a fonte atual, como o painel de energia do Omarchy).
- Dados: `omarchy-battery-status --shell` (linhas `chave<TAB>valor`: percentage, state, rate, size, time, cycles, threshold) e `omarchy-powerprofiles-list --active-state` (`perfil<TAB>0|1`), lidos ao abrir, a cada 5s com o modo aberto, ao ligar/desligar a tomada e depois de trocar o perfil. Uma leitura vazia (acontece na troca da tomada) mantém a anterior, como no Omarchy. O nível do cabeçalho e da barra vem do UPower, como o botão.

## Critérios de aceite

- [x] Testes de `battery.ts` atualizados para o desenho: largura do preenchimento, faixas de cor e raio de carga.
- [ ] Ligar/desligar o carregador mostra/esconde o raio em até 2s; o preenchimento acompanha o nível.
