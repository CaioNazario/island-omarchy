pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Seção da aba Aparência (specs/19-aparencia.md): cartão `neutral-900` raio
// 12, padding 12, rótulo de painel (`PanelLabel`) e as linhas com gap 10px.
Rectangle {
  id: section

  required property string title
  default property alias rows: column.data

  implicitHeight: column.implicitHeight + 24
  radius: 12
  color: Tokens.neutral900

  ColumnLayout {
    id: column

    anchors.fill: parent
    anchors.margins: 12
    spacing: 10

    PanelLabel {
      Layout.fillWidth: true
      text: section.title
    }
  }
}
