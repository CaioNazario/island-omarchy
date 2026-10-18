#!/usr/bin/env bash
# Descobre de onde ler GPU e temperatura (specs/10-hardware.md "Fontes"), uma
# vez por carga da barra. Imprime `gpu=<tipo> <arquivo>` e `temp=<arquivo>`;
# o que não existir não é impresso e o bloco some.
shopt -s nullglob

first() { for path in "$@"; do [[ -r $path ]] && { echo "$path"; return; }; done; }

gpu_amd=$(first /sys/class/drm/card*/device/gpu_busy_percent)
gpu_i915=$(first /sys/class/drm/card*/power/rc6_residency_ms)
gpu_xe=$(first /sys/class/drm/card*/device/tile0/gt0/gtidle/idle_residency_ms)
if [[ -n $gpu_amd ]]; then echo "gpu=busy $gpu_amd"
elif [[ -n $gpu_i915 ]]; then echo "gpu=idle $gpu_i915"
elif [[ -n $gpu_xe ]]; then echo "gpu=idle $gpu_xe"
fi

# hwmon: coretemp (`Package id 0`), depois k10temp (`Tctl`).
hwmon_input() {
  local driver=$1 label=$2
  for dir in /sys/class/hwmon/hwmon*; do
    [[ $(<"$dir/name") == "$driver" ]] || continue
    for file in "$dir"/temp*_label; do
      [[ $(<"$file") == "$label" ]] && { echo "${file%_label}_input"; return; }
    done
  done
}

temp=$(hwmon_input coretemp "Package id 0")
[[ -z $temp ]] && temp=$(hwmon_input k10temp Tctl)
if [[ -z $temp ]]; then
  for zone in /sys/class/thermal/thermal_zone*; do
    [[ $(<"$zone/type") == x86_pkg_temp ]] && { temp="$zone/temp"; break; }
  done
fi
[[ -n $temp ]] && echo "temp=$temp"
exit 0
