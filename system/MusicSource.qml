pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Services.Mpris
import "../core/music.mjs" as MusicCore

// Música (specs/05-musica.md "Fonte: MPRIS") pelo Mpris do Quickshell. Quem é
// o player atual e quando uma troca de faixa dispara `music` é regra do
// `PlayerTracker` do core; aqui só entram os snapshots.
Scope {
  id: music

  readonly property var players: Mpris.players.values
  property var tracker: new MusicCore.PlayerTracker()
  property var player: null
  readonly property bool active: player !== null
  // Microssegundos, a unidade do core (o Quickshell dá segundos).
  readonly property real positionUs: player ? player.position * 1e6 : 0
  readonly property real lengthUs: player ? player.length * 1e6 : 0
  readonly property string artist: player ? MusicCore.artistLine(player.trackArtist ? [player.trackArtist] : [], player.identity || "") : ""
  readonly property string title: player ? player.trackTitle || "" : ""
  readonly property string artUrl: player ? player.trackArtUrl || "" : ""
  readonly property string sourceGlyph: player ? MusicCore.sourceGlyph(player.identity || "") : MusicCore.MUSIC_NOTE_GLYPH
  readonly property bool playing: player !== null && player.isPlaying

  // Troca de faixa do player atual tocando: gatilho do modo `music`.
  signal trackChanged

  function snapshot(candidate) {
    const metadata = candidate.metadata || {};
    return {
      status: MprisPlaybackState.toString(candidate.playbackState),
      trackId: String(metadata["mpris:trackid"] || ""),
      title: candidate.trackTitle || ""
    };
  }

  function update() {
    const snapshots = new Map();
    players.forEach(candidate => snapshots.set(candidate.dbusName, snapshot(candidate)));
    const result = tracker.update(snapshots);
    player = players.find(candidate => candidate.dbusName === result.current) || null;
    if (result.trackChanged) trackChanged();
  }

  function previous() {
    if (player && player.canGoPrevious) player.previous();
  }

  function next() {
    if (player && player.canGoNext) player.next();
  }

  function togglePlaying() {
    if (player && player.canTogglePlaying) player.togglePlaying();
  }

  onPlayersChanged: update()
  Component.onCompleted: update()

  Instantiator {
    model: music.players

    delegate: Connections {
      required property var modelData

      target: modelData
      function onPlaybackStateChanged() {
        music.update();
      }
      function onTrackTitleChanged() {
        music.update();
      }
      function onMetadataChanged() {
        music.update();
      }
    }
  }

  // `position` não se atualiza sozinho (doc do MprisPlayer): pede uma
  // leitura por segundo enquanto toca. Seek e troca de faixa chegam aí.
  Timer {
    interval: 1000
    repeat: true
    running: music.playing
    onTriggered: music.player.positionChanged()
  }
}
