// Saída `chave<TAB>valor` por linha dos comandos do Omarchy
// (`omarchy-battery-status --shell`, `omarchy-network-status --verbose`).
/** Linha sem TAB é ignorada; o valor pode conter TAB. */
export function parseKeyValues(raw) {
    const values = {};
    for (const line of raw.split('\n')) {
        const tab = line.indexOf('\t');
        if (tab > 0)
            values[line.slice(0, tab).trim()] = line.slice(tab + 1).trim();
    }
    return values;
}
