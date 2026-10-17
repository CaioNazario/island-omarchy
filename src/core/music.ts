// Player atual, troca de faixa e formatação da música (specs/05-musica.md;
// design/logic.js `track`/`posLabel`/`posPct`).

export type PlaybackStatus = 'Playing' | 'Paused' | 'Stopped';

/** O que a Island lê de um player MPRIS, já sem `GLib.Variant`. */
export interface PlayerSnapshot {
  status: PlaybackStatus;
  /** `mpris:trackid`; o Firefox manda sempre o mesmo. */
  trackId: string;
  title: string;
}

export interface TrackerUpdate {
  /** Nome no barramento do player atual, ou `null` quando nada toca. */
  current: string | null;
  /** O player atual tocando trocou de faixa: gatilho do modo `music`. */
  trackChanged: boolean;
}

function trackKey(player: PlayerSnapshot): string {
  return `${player.trackId}\n${player.title}`;
}

// Parado ou sem título não tem o que mostrar: o Brave fica no barramento em
// `Stopped` com metadados vazios quando o vídeo acaba.
function showable(player: PlayerSnapshot): boolean {
  return player.status !== 'Stopped' && player.title !== '';
}

/**
 * Player atual: o último que entrou em `Playing`; pausado continua atual até
 * outro tocar ou ele sair do barramento. Na primeira leitura (o `enable()`
 * roda a cada desbloqueio), os que já tocam ficam na frente dos pausados, e
 * nada dispara.
 */
export class PlayerTracker {
  // Do menos para o mais recente a entrar em `Playing`.
  private order: string[] = [];
  private previous = new Map<string, PlayerSnapshot>();
  // Última faixa vista tocando, por player. O Spotify web troca de faixa
  // pausado e só depois volta a tocar: comparar com o estado anterior
  // confundiria isso com retomar a mesma faixa.
  private playedKeys = new Map<string, string>();
  private started = false;

  update(players: ReadonlyMap<string, PlayerSnapshot>): TrackerUpdate {
    const firstRead = !this.started;
    this.started = true;

    if (firstRead) {
      const withStatus = (status: PlaybackStatus) =>
        [...players].filter(([, player]) => player.status === status).map(([name]) => name);
      this.order = [...withStatus('Paused'), ...withStatus('Playing')];
    } else {
      this.order = this.order.filter((name) => players.has(name));
      for (const [name, player] of players) {
        if (player.status === 'Playing' && this.previous.get(name)?.status !== 'Playing') {
          this.order = this.order.filter((other) => other !== name);
          this.order.push(name);
        }
      }
    }

    const current = [...this.order].reverse().find((name) => showable(players.get(name)!)) ?? null;
    const player = current === null ? undefined : players.get(current);
    const trackChanged =
      !firstRead &&
      player?.status === 'Playing' &&
      this.playedKeys.get(current!) !== trackKey(player);

    const playedKeys = new Map<string, string>();
    for (const [name, snapshot] of players) {
      // Na primeira leitura, a faixa pausada conta como vista: retomar depois
      // do desbloqueio não dispara.
      const seen = showable(snapshot) && (firstRead || snapshot.status === 'Playing');
      const key = seen ? trackKey(snapshot) : this.playedKeys.get(name);
      if (key !== undefined) playedKeys.set(name, key);
    }
    this.playedKeys = playedKeys;
    this.previous = new Map(players);
    return { current, trackChanged };
  }
}

/** Artistas juntos com ", "; vazio mostra o nome do player (`Identity`). */
export function artistLine(artists: readonly string[], identity: string): string {
  const line = artists
    .map((artist) => artist.trim())
    .filter((artist) => artist !== '')
    .join(', ');
  return line === '' ? identity : line;
}

/** `m:ss`, a partir de microssegundos (unidade do MPRIS). */
export function formatTrackTime(microseconds: number): string {
  const total = Math.max(0, Math.floor(microseconds / 1_000_000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function progressFraction(positionUs: number, lengthUs: number): number {
  if (lengthUs <= 0) return 0;
  return Math.max(0, Math.min(1, positionUs / lengthUs));
}

/** Última leitura de `Position` e o instante dela. */
export interface PositionAnchor {
  positionUs: number;
  atMs: number;
  playing: boolean;
}

// `Position` não gera sinal: avança localmente a partir da última leitura.
export function positionAt(anchor: PositionAnchor, nowMs: number, lengthUs: number): number {
  const elapsedUs = anchor.playing ? Math.max(0, nowMs - anchor.atMs) * 1000 : 0;
  const position = anchor.positionUs + elapsedUs;
  return lengthUs > 0 ? Math.min(position, lengthUs) : position;
}

// Pelo `Identity`: o Chrome se chama "Chrome" no MPRIS (e "Google Chrome" nas
// notificações), e o Firefox "Mozilla firefox". O Phosphor não tem logo do
// Firefox, então ele fica com a nota, como o Brave.
const SOURCE_GLYPHS: Readonly<Record<string, string>> = {
  spotify: 'spotify-logo-fill',
  chrome: 'google-chrome-logo-fill',
  'google chrome': 'google-chrome-logo-fill',
  chromium: 'google-chrome-logo-fill',
};

export const MUSIC_NOTE_GLYPH = 'music-note-fill';

export function sourceGlyph(identity: string): string {
  return SOURCE_GLYPHS[identity.trim().toLowerCase()] ?? MUSIC_NOTE_GLYPH;
}
