# 10 · Hardware

Origem: `design/components/TopbarWidget.html` (parte `w.isHw`); `design/logic.js` `hw`, `widgetData('hw')` e o tick de `componentDidMount`.

Os blocos são o widget `hw` (spec 16). No ambiente Padrão ele fica na pílula direita, como na v1.0.

## Blocos

Cinco blocos de duas linhas, gap 2px, sem entrelinha:
- Rótulo: 8.5px/500, `letter-spacing .08em`, `neutral-500`.
- Valor: 11.5px/500, dígitos tabulares.
- Largura fixa por bloco, medida para o valor mais largo possível, para a barra não "pular": CPU `100%`, RAM `99.9G`, GPU `100%`, TEMP `100°`, NET `↓99.9`.
- Sem tooltip. Clique no widget abre/fecha `quick` (spec 16).

| Bloco | Valor | Cor |
|---|---|---|
| CPU | `12%` | `accent-300` se ≥60%, senão `text` |
| RAM | `7.2G` (usada, GiB, 1 casa) | `text` |
| GPU | `8%` | `text` |
| TEMP | `54°` | `#f75d59` se ≥70°, senão `text` |
| NET | `↓1.2` (MB/s, 1 casa; ≥100 sem casa) | `text` |

Os limiares, a formatação e os cálculos por delta ficam em `src/core/hardware.ts`. Leitura de arquivos em `src/system/hardware.ts`, sempre assíncrona.

## Fontes

Amostragem a cada **1s**.

- **CPU**: delta de `/proc/stat` (linha `cpu`), `1 − Δidle/Δtotal`, onde idle inclui `iowait`.
- **RAM**: `/proc/meminfo`, `MemTotal − MemAvailable`.
- **GPU**, primeira que existir:
  1. `amdgpu`: `/sys/class/drm/card*/device/gpu_busy_percent`
  2. `i915`: `100 − Δrc6_residency_ms / Δt_ms × 100` de `/sys/class/drm/card*/power/rc6_residency_ms`
     - RC6 mede o tempo em que a GPU está acordada, não ocupada: em repouso o valor fica acima do `Render/3D` do `intel_gpu_top`. Ocupação por engine só existe no PMU do i915 (`perf_event_open`, fora do alcance da extensão).
  3. `xe`: mesma conta com `/sys/class/drm/card*/device/tile0/gt0/gtidle/idle_residency_ms`
  4. nenhuma (inclui NVIDIA, fora da v1) → o bloco GPU some
- **TEMP**, primeira que existir em `/sys/class/hwmon/*`: `coretemp` (`Package id 0`) → `k10temp` (`Tctl`) → `/sys/class/thermal/thermal_zone*` do tipo `x86_pkg_temp` → some.
- **NET**: delta de `/proc/net/dev` somando interfaces físicas (exclui `lo`, `docker*`, `veth*`, `br-*`, `virbr*`, `tun*`, `wg*`). Só download, em MB/s.

## Largura mínima

A ordem em que os blocos somem por falta de espaço está na spec 16: NET → GPU → TEMP, antes de qualquer widget inteiro sumir.

A amostragem só roda com o widget `hw` no ambiente ativo (spec 16).

## Critérios de aceite

- [x] Testes de `hardware.ts` cobrem: cálculo de CPU por delta, RC6 → %, limiares de cor, formatação de RAM/NET, largura máxima de cada valor.
- [x] Em Intel i915 (máquina de referência) o bloco GPU bate com `100 − rc6` do `intel_gpu_top`.
- [x] Sem GPU reconhecida, o bloco GPU some e os outros não se mexem.
- [x] A barra não muda de largura quando os valores oscilam.
- [x] A amostragem não gera I/O síncrono no main loop.
