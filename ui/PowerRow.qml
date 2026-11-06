pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/powerConfirm.mjs" as ConfirmCore

// Linha de energia (specs/09-sessao-energia.md): 48px (40 de linha + 8 de
// respiro), padding 0 7px, cinco botões de mesma largura. O contêiner corta
// a linha enquanto a altura anima na mola: em `quick` a ilha cresce junto; em
// `wifi`/`bt` a lista ancorada embaixo desliza os 48px. Reiniciar, desligar e
// sair trocam os botões por uma confirmação com contagem de 60s que age sozinha
// no fim (specs/09 "Confirmação"); fechar a linha, por qualquer caminho, cancela.
Item {
  id: power

  required property var bar
  readonly property var session: bar.system.session
  readonly property var actions: [
    { action: "suspend", label: I18n.tr("Suspend"), glyph: "moon-stars" },
    { action: "reboot", label: I18n.tr("Restart"), glyph: "arrow-clockwise" },
    { action: "shutdown", label: I18n.tr("Shut down"), glyph: "power-bold" },
    { action: "logout", label: I18n.tr("Log out"), glyph: "sign-out" },
    { action: "lock", label: I18n.tr("Lock"), glyph: "lock-simple" }
  ]

  // Ação esperando resposta (`PendingPower` do core) e o relógio da contagem.
  property var pending: null
  property double nowMs: Date.now()
  readonly property int secondsLeft: pending ? ConfirmCore.secondsLeft(pending, nowMs) : 0

  implicitHeight: bar.powerOpen ? 48 : 0
  clip: true

  function labelOf(action) {
    return actions.find(entry => entry.action === action).label;
  }

  /** Clique num botão: pergunta antes de reiniciar/desligar/sair; o resto roda já. */
  function choose(action) {
    if (!ConfirmCore.needsConfirmation(action)) {
      execute(action);
      return;
    }
    nowMs = Date.now();
    pending = ConfirmCore.startPending(action, nowMs);
  }

  function cancel() {
    pending = null;
  }

  /** Qualquer ação fecha a ilha antes de executar. */
  function execute(action) {
    pending = null;
    bar.closeAll();
    session.run(action);
  }

  // Fechar a linha (Esc, clique fora, outro modo) cancela: a contagem some da
  // tela, então não pode seguir correndo escondida.
  Connections {
    target: power.bar

    function onPowerOpenChanged() {
      if (!power.bar.powerOpen) power.cancel();
    }
  }

  Timer {
    interval: 1000
    repeat: true
    running: power.pending !== null
    onTriggered: {
      power.nowMs = Date.now();
      if (ConfirmCore.isDue(power.pending, power.nowMs)) power.execute(power.pending.action);
    }
  }

  Behavior on implicitHeight {
    NumberAnimation {
      duration: Tokens.springMs
      easing.type: Easing.BezierSpline
      easing.bezierCurve: Tokens.springCurve
    }
  }

  RowLayout {
    anchors.left: parent.left
    anchors.right: parent.right
    anchors.top: parent.top
    anchors.leftMargin: 7
    anchors.rightMargin: 7
    height: 40
    spacing: 6

    Repeater {
      model: power.pending ? [] : power.actions

      delegate: Rectangle {
        id: button

        required property var modelData

        Layout.fillWidth: true
        Layout.preferredWidth: 1
        Layout.fillHeight: true
        // Ação indisponível (suspender desligado pelo Omarchy) → o botão some.
        visible: modelData.action !== "suspend" || power.session.canSuspend
        radius: 12
        color: pointer.containsMouse ? Tokens.neutral800 : Tokens.neutral900

        Row {
          anchors.centerIn: parent
          spacing: 6

          PhIcon {
            anchors.verticalCenter: parent.verticalCenter
            glyph: button.modelData.glyph
            size: 14
            color: label.color
          }

          IslandText {
            id: label

            anchors.verticalCenter: parent.verticalCenter
            text: button.modelData.label
            px: 12
            font.weight: Tokens.weightBody
            color: button.modelData.action === "shutdown" ? Tokens.powerOffText : Tokens.text
          }
        }

        MouseArea {
          id: pointer

          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: power.choose(button.modelData.action)
        }
      }
    }

    RowLayout {
      visible: power.pending !== null
      Layout.fillWidth: true
      Layout.fillHeight: true
      spacing: 6

      PhIcon {
        glyph: "power-bold"
        size: 14
        color: Tokens.powerOffText
        Layout.leftMargin: 8
      }

      IslandText {
        Layout.fillWidth: true
        text: power.pending ? ConfirmCore.confirmationText(I18n.language, power.pending.action, power.secondsLeft) : ""
        px: 12
        font.weight: Tokens.weightBody
        color: Tokens.text
        elide: Text.ElideRight
      }

      ConfirmButton {
        label: I18n.tr("Cancel")
        onClicked: power.cancel()
      }

      ConfirmButton {
        label: power.pending ? power.labelOf(power.pending.action) : ""
        labelColor: Tokens.powerOffText
        fill: Tokens.powerOpenBg
        onClicked: power.execute(power.pending.action)
      }
    }
  }

  // Botão da confirmação: mesma forma dos da linha (36px de raio 12).
  component ConfirmButton: Rectangle {
    id: confirmButton

    required property string label
    property color labelColor: Tokens.text
    property color fill: Tokens.neutral900

    signal clicked

    Layout.fillHeight: true
    Layout.preferredWidth: text.implicitWidth + 28
    radius: 12
    color: confirmPointer.containsMouse ? Qt.lighter(fill, 1.25) : fill

    IslandText {
      id: text

      anchors.centerIn: parent
      text: confirmButton.label
      px: 12
      font.weight: Tokens.weightBody
      color: confirmButton.labelColor
    }

    MouseArea {
      id: confirmPointer

      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: confirmButton.clicked()
    }
  }
}
