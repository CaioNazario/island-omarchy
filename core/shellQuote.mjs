// Argumento seguro para `bash -c`: o terminal flutuante do Omarchy
// (`omarchy-launch-floating-terminal-with-presentation`) junta o comando numa
// string de shell, e o SSID de uma rede é texto arbitrário de terceiros.
export function shellQuote(text) {
    return `'${text.replace(/'/g, "'\\''")}'`;
}
