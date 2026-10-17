pragma ComponentBehavior: Bound

import QtQuick

// Três filhos em linha, alinhados pelo topo: a ilha cresce para baixo sem
// mover as laterais, que dividem igualmente o espaço que sobra dela
// (`flex: 1 1 0` no design, specs/02-barra.md "Layout").
Item {
  id: row

  required property var bar
  required property string mode
  required property string screenName

  readonly property alias leftPill: leftPill
  readonly property alias island: island
  readonly property alias rightPill: rightPill
  readonly property alias banner: banner
  readonly property real pillWidth: Math.max(0, (width - island.width - 2 * Tokens.pillGap) / 2)

  height: island.height

  Pill {
    id: leftPill

    anchors.left: parent.left
    width: row.pillWidth
  }

  Island {
    id: island

    anchors.horizontalCenter: parent.horizontalCenter
    bar: row.bar
    displayMode: row.mode
    onClicked: row.bar.islandClick(row.screenName)
  }

  // Só o monitor-alvo mostra o banner (specs/02 "Monitores").
  Banner {
    id: banner

    anchors.horizontalCenter: island.horizontalCenter
    y: island.height + 8
    bar: row.bar
    entry: row.bar.targetScreen === row.screenName ? row.bar.bannerEntry : null
    onOpened: row.bar.openFromBar(row.screenName, "stack")
  }

  Pill {
    id: rightPill

    anchors.right: parent.right
    width: row.pillWidth

    RightButtons {
      anchors.right: parent.right
      anchors.rightMargin: Tokens.pillPaddingH
      anchors.verticalCenter: parent.verticalCenter
      bar: row.bar
      screenName: row.screenName
    }
  }
}
