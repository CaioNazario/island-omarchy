// Pastas da Island que só o dono abre (specs/13-preferencias.md, 0700): a
// nota, os nomes dos ambientes e o estado. Os JSON saem com o umask do
// usuário e a gravação atômica os recria a cada salvamento, então quem
// protege é a pasta. O script também fecha a pasta de quem instalou antes da
// regra e põe os `.json` que já existem em 0600. A pasta chega como `$1`,
// nunca dentro do script: `["sh", "-c", PRIVATE_DIR_SCRIPT, "sh", pasta]`.
// `scripts/check-private-dir.mjs` roda o script de verdade no `make lint`.
export const PRIVATE_DIR_SCRIPT = 'umask 077 && mkdir -p -- "$1" && chmod 700 -- "$1" && chmod 600 -- "$1"/*.json 2>/dev/null; exit 0';
