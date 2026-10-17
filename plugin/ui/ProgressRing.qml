import QtQuick

// Anel 13×13 do widget (specs/16-widgets.md "Visual comum"): arco `accent`
// sobre `neutral-800`, miolo `bg` com 3px de borda.
Canvas {
  id: ring

  property real fraction: 0

  implicitWidth: 13
  implicitHeight: 13

  onFractionChanged: requestPaint()

  onPaint: {
    const ctx = getContext("2d");
    const center = width / 2;
    const radius = center - 1.5;
    ctx.reset();
    ctx.lineWidth = 3;
    ctx.strokeStyle = Tokens.neutral800;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = Tokens.accent;
    ctx.beginPath();
    ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * Math.max(0, Math.min(1, fraction)));
    ctx.stroke();
  }
}
