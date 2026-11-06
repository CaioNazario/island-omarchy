pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Aba Clima do editor (specs/07-clima.md e specs/17-editor-ambientes.md):
// a cidade em uso e de onde ela vem, a busca por nome (até 20 resultados) e
// "Limpar", que volta à cadeia de fallback. Escolher grava `weatherLocation`.
SettingsSection {
  id: page

  required property var bar
  readonly property var weather: bar.system.weather
  readonly property var city: weather.location
  readonly property var origins: ({
      island: I18n.tr("Chosen here"),
      omarchy: I18n.tr("From Omarchy"),
      auto: I18n.tr("Automatic"),
      none: I18n.tr("No city found")
    })
  readonly property string cityLabel: city && city.name !== "" ? city.name : I18n.tr("Unnamed city")

  title: I18n.tr("Weather")

  function choose(location) {
    if (page.bar.service) page.bar.service.setWeatherLocation(location);
    field.text = "";
    page.weather.search("");
  }

  RowLayout {
    Layout.fillWidth: true
    spacing: 12

    ColumnLayout {
      Layout.fillWidth: true
      spacing: 2

      IslandText {
        Layout.fillWidth: true
        text: page.city ? page.cityLabel : page.origins.none
        px: 12.5
        elide: Text.ElideRight
      }

      IslandText {
        Layout.fillWidth: true
        visible: page.city !== null
        text: page.origins[page.weather.origin]
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
      }
    }

    TextButton {
      visible: page.weather.origin === "island"
      label: I18n.tr("Clear")
      onClicked: page.choose(null)
    }
  }

  Rectangle {
    Layout.fillWidth: true
    implicitHeight: 34
    radius: 10
    color: Tokens.neutral800

    TextInput {
      id: field

      anchors.fill: parent
      anchors.leftMargin: 10
      anchors.rightMargin: 10
      verticalAlignment: TextInput.AlignVCenter
      color: Tokens.text
      font.family: Tokens.fontFamily
      font.pointSize: 12.5 * 0.75
      maximumLength: 100
      clip: true
      // Espera uma pausa na digitação para não consultar a cada tecla.
      onTextEdited: debounce.restart()
      Keys.onEscapePressed: page.bar.closeEditor()

      IslandText {
        visible: field.text === ""
        anchors.verticalCenter: parent.verticalCenter
        text: I18n.tr("Search for a city")
        px: 12.5
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
      }
    }

    Timer {
      id: debounce

      interval: 350
      onTriggered: page.weather.search(field.text)
    }
  }

  IslandText {
    Layout.fillWidth: true
    visible: field.text.trim() !== "" && (page.weather.searching || page.weather.searchResults.length === 0)
    text: page.weather.searching ? I18n.tr("Searching…") : I18n.tr("No cities found")
    px: 11
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
  }

  ListView {
    Layout.fillWidth: true
    Layout.preferredHeight: Math.min(contentHeight, 6 * 30)
    visible: field.text.trim() !== "" && page.weather.searchResults.length > 0
    clip: true
    spacing: 2
    boundsBehavior: Flickable.StopAtBounds
    model: page.weather.searchResults

    delegate: Rectangle {
      id: row

      required property var modelData

      width: ListView.view.width
      height: 28
      radius: 8
      color: pointer.containsMouse ? Tokens.neutral800 : "transparent"

      IslandText {
        anchors.fill: parent
        anchors.leftMargin: 10
        anchors.rightMargin: 10
        verticalAlignment: Text.AlignVCenter
        text: row.modelData.label
        px: 12.5
        font.weight: Tokens.weightBody
        elide: Text.ElideRight
      }

      MouseArea {
        id: pointer

        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: page.choose(row.modelData.location)
      }
    }
  }
}
