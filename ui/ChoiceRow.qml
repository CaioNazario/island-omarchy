pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// `SettingRow` com um grupo de `ChoiceButton`. `options`: `[{id, label}]`.
SettingRow {
  id: row

  property var options: []
  property string current: ""

  signal chosen(string id)

  Repeater {
    model: row.options

    ChoiceButton {
      required property var modelData

      Layout.preferredWidth: 88
      label: modelData.label
      active: row.current === modelData.id
      onClicked: row.chosen(modelData.id)
    }
  }
}
