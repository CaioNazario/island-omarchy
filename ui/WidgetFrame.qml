import QtQuick

// Moldura de widget (specs/16-widgets.md "Pílulas"): 24px, raio 12, padding
// 0 9px, hover `neutral-900` (150ms), mão só se o widget tiver clique.
Rectangle {
  id: frame

  property bool clickable: false
  default property alias content: row.data
  property alias spacing: row.spacing

  signal clicked

  implicitWidth: row.implicitWidth + 18
  implicitHeight: 24
  radius: 12
  color: pointer.containsMouse && clickable ? Tokens.neutral900 : "transparent"

  Behavior on color {
    ColorAnimation {
      duration: 150
    }
  }

  Row {
    id: row

    anchors.verticalCenter: parent.verticalCenter
    x: 9
    spacing: 6
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    enabled: frame.clickable
    cursorShape: frame.clickable ? Qt.PointingHandCursor : Qt.ArrowCursor
    onClicked: frame.clicked()
  }
}
