import QtQuick
import Quickshell.Io
import "../core/privateDir.mjs" as PrivateDirCore

// Pasta da Island que só o dono abre (0700), criada antes do primeiro
// `FileView` (que não cria diretórios). O porquê e o script estão em
// `src/core/privateDir.ts`; a pasta vai como argumento, nunca dentro do
// script.
Process {
  id: privateDir

  required property string path

  signal ready

  running: true
  command: ["sh", "-c", PrivateDirCore.PRIVATE_DIR_SCRIPT, "sh", path]
  onExited: privateDir.ready()
}
