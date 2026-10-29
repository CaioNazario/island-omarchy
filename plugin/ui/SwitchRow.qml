pragma ComponentBehavior: Bound

import QtQuick

// `SettingRow` com switch: `toggled` traz o valor novo.
SettingRow {
  id: row

  property bool on: false

  signal toggled(bool on)

  ToggleSwitch {
    on: row.on
    onClicked: row.toggled(!row.on)
  }
}
