// URL privada do feed ICS (Google Calendar: "Endereço secreto no formato
// iCal"). Quem tem a URL lê a agenda toda, então ela é credencial: vem do
// chaveiro (`secret-tool`), fica só em memória e chega ao `curl` pela entrada
// padrão (`-K -`), nunca na linha de comando, no log nem no settings.json.

/** `https://…` da saída do `secret-tool lookup`; qualquer outra coisa → `null`. */
export function feedUrlFromSecret(output: string): string | null {
  const url = output.trim().replace(/^webcal:\/\//i, 'https://');
  if (!/^https:\/\/[^\s"\\]+$/.test(url)) return null;
  return url;
}

/** Entrada do `curl -K -`; `feedUrlFromSecret` já recusou aspas e barras. */
export function curlConfigLine(url: string): string {
  return `url = "${url}"\n`;
}

/** Página de login ou erro HTML no lugar do feed não pode apagar os eventos. */
export function isIcsFeed(body: string): boolean {
  return body.includes('BEGIN:VCALENDAR');
}
