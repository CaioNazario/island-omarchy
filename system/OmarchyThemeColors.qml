pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/gradients.mjs" as GradientCore

// Cores nomeadas do tema do Omarchy (specs/19-aparencia.md "Gradiente"), para
// a paleta Tema do gradiente. Sem o arquivo, `named` fica vazio e a paleta
// usa o realce da Island.
Scope {
  id: themeColors

  // O caminho fixo que o `omarchy-theme-set` usa (sem XDG_STATE_HOME).
  readonly property string currentDir: Quickshell.env("HOME") + "/.local/state/omarchy/current"
  property var named: ({})

  FileView {
    id: colorsFile

    path: themeColors.currentDir + "/theme/colors.toml"
    printErrors: false
    onLoaded: themeColors.named = GradientCore.parseThemeColors(text())
    onLoadFailed: themeColors.named = {}
  }

  // O `omarchy-theme-set` troca o diretório do tema inteiro (`rm -rf` +
  // `mv`, Omarchy 4), e o watch do colors.toml morreria com o antigo. O
  // theme.name, no diretório de cima, é regravado no mesmo arquivo depois do
  // `mv`: a mudança dele relê as cores.
  FileView {
    path: themeColors.currentDir + "/theme.name"
    watchChanges: true
    printErrors: false
    onFileChanged: {
      reload();
      colorsFile.reload();
    }
  }
}
