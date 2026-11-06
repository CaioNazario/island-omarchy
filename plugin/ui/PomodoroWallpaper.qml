pragma ComponentBehavior: Bound

import QtQuick
import "../core/pomodoroWallpapers.mjs" as WallpaperCore

// Wallpaper da pausa (specs/20-pomodoro.md "Wallpaper da pausa"): um preset
// de degradê desenhado num `Canvas` ou a imagem própria. O degradê é suave,
// então o `Canvas` é pequeno (640×360) e esticado até o tamanho do item: pinta
// uma vez e custa quase nada num monitor 4K.
Item {
  id: wallpaper

  // `noite`, `aurora`, `brasa`, `grafite` ou `custom`.
  property string wallpaperId: "noite"
  property string customPath: ""
  // Só a vinheta da tela de pausa (camada 4), sem wallpaper nem imagem.
  property bool vignetteOnly: false
  // Enquanto a imagem própria carrega, ou se ela não abre (arquivo apagado),
  // aparece o preset padrão.
  readonly property bool photoReady: photo.status === Image.Ready
  readonly property var layers: vignetteOnly ? [WallpaperCore.VIGNETTE] : WallpaperCore.presetLayers(wallpaperId === "custom" ? "noite" : wallpaperId)
  readonly property int paintWidth: 640
  readonly property int paintHeight: 360

  onLayersChanged: canvas.requestPaint()

  // Cor `#AARRGGBB` do core como o `color` do Qt (o Canvas não lê esse formato).
  function colorOf(hex) {
    if (hex.length !== 9) return hex;
    return Qt.alpha("#" + hex.slice(3), parseInt(hex.slice(1, 3), 16) / 255);
  }

  function addStops(gradient, stops) {
    for (let i = 0; i < stops.length; i++)
      gradient.addColorStop(stops[i].at, colorOf(stops[i].color));
  }

  // `radial-gradient(rx ry at cx cy)` do CSS: um círculo unitário esticado.
  function paintRadial(ctx, layer) {
    ctx.save();
    ctx.translate(layer.cx * paintWidth, layer.cy * paintHeight);
    ctx.scale(layer.rx * paintWidth, layer.ry * paintHeight);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    addStops(gradient, layer.stops);
    ctx.fillStyle = gradient;
    ctx.fillRect(-1000, -1000, 2000, 2000);
    ctx.restore();
  }

  function paintLayer(ctx, layer) {
    if (layer.kind === "solid") {
      ctx.fillStyle = colorOf(layer.color);
      ctx.fillRect(0, 0, paintWidth, paintHeight);
    } else if (layer.kind === "radial") {
      paintRadial(ctx, layer);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, paintHeight);
      addStops(gradient, layer.stops);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, paintWidth, paintHeight);
    }
  }

  Canvas {
    id: canvas

    width: wallpaper.paintWidth
    height: wallpaper.paintHeight
    visible: !wallpaper.photoReady
    smooth: true
    transformOrigin: Item.TopLeft
    transform: Scale {
      xScale: wallpaper.width / wallpaper.paintWidth
      yScale: wallpaper.height / wallpaper.paintHeight
    }
    onPaint: {
      const ctx = getContext("2d");
      ctx.reset();
      for (let i = 0; i < wallpaper.layers.length; i++)
        wallpaper.paintLayer(ctx, wallpaper.layers[i]);
    }
  }

  Image {
    id: photo

    anchors.fill: parent
    visible: wallpaper.photoReady
    // Cada trecho é codificado: `#` e `?` num nome de arquivo virariam fragmento e consulta.
    source: !wallpaper.vignetteOnly && wallpaper.wallpaperId === "custom" && wallpaper.customPath !== "" ? "file://" + wallpaper.customPath.split("/").map(encodeURIComponent).join("/") : ""
    // O maior lado vai a no máximo 1920px, sem ampliar (spec 07 do protótipo).
    sourceSize: Qt.size(1920, 1920)
    fillMode: Image.PreserveAspectCrop
    asynchronous: true
    smooth: true
  }
}
