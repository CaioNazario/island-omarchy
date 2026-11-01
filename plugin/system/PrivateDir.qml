import QtQuick
import Quickshell.Io

// Pasta da Island que só o dono abre (0700), criada antes do primeiro
// `FileView` (que não cria diretórios). A nota, os ambientes e o estado ficam
// em JSON gravado com o umask do usuário (0644 com o 022 comum), e a gravação
// atômica recria o arquivo a cada salvamento: quem protege é a pasta. O
// `chmod` também fecha a pasta de quem instalou antes desta regra; os `.json`
// que já existem vão a 0600 por garantia. A pasta vai como argumento, nunca
// dentro do script.
Process {
  id: privateDir

  required property string path

  signal ready

  running: true
  command: ["sh", "-c", "umask 077 && mkdir -p -- \"$1\" && chmod 700 -- \"$1\" && chmod 600 -- \"$1\"/*.json 2>/dev/null; exit 0", "sh", path]
  onExited: privateDir.ready()
}
