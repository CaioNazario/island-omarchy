// Respostas do `hyprctl getoption <opção> -j` que a aparência lê
// (specs/19-aparencia.md "Blur"). O Hyprland novo responde booleanos em
// "bool"; o antigo, em "int" (o omadock trata os dois, `SettingsPanel.qml`
// @ 16492e5).

function parseOption(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Resposta inválida conta como desligado: sem blur, o fundo fica opaco. */
export function parseBoolOption(raw: string): boolean {
  const option = parseOption(raw);
  if (!option) return false;
  if (typeof option.bool === 'boolean') return option.bool;
  return typeof option.int === 'number' && option.int !== 0;
}
