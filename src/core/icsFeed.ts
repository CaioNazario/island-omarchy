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

/**
 * Teto do feed: o servidor é de terceiros e o texto vai inteiro para a thread
 * da UI. O `curl` recebe o mesmo valor (`--max-filesize`); um feed real de
 * 3000 eventos tem ~1,4 MB.
 */
export const MAX_FEED_BYTES = 10 * 1024 * 1024;

/** Página de login ou erro HTML no lugar do feed não pode apagar os eventos. */
export function isIcsFeed(body: string): boolean {
  return body.length <= MAX_FEED_BYTES && body.includes('BEGIN:VCALENDAR');
}
