import { Howl } from 'howler';

import log from 'loglevel';

/**
 * Callback functions for use with {@link BlnPlayer.onLoad},
 * {@link BlnPlayer.onPlay}, and {@link BlnPlayer.onUpdate} must
 * implement this method signature.
 */
export type BlnPlayerCallback = () => void;

/**
 * Configuration options which are available when creating a new
 * {@link BlnPlayer} instance.
 */
export interface BlnPlayerOptions {
  apiKey?: string;
  apiSecret?: string;
  autoLoop?: boolean;
  autoPlay?: boolean;
  autoShuffle?: boolean;
  defaultPlaylist?: string;
  eventsUrl?: string;
  html5?: boolean;
  onLoad?: BlnPlayerCallback;
  onPlay?: BlnPlayerCallback;
  onUpdate?: BlnPlayerCallback;
  sourceUrl?: string;
  vol?: number;
}

/**
 * A Track represents a single audio recording on a {@link Release}.
 */
export interface Track {
  id: number;
  releaseId: number;
  artist: string;
  title: string;
  m4a: string;
  mp3: string;
  webm: string;
}

/**
 * A Release represents metadata associated with a specific group of
 * {@link Track} recordings.
 */
export interface Release {
  id: number;
  title: string;
  url: string;
  image: string;
  tracks: Track[];
}

/**
 * A Playlist represents a series of {@link Track} recordings.
 */
export interface Playlist {
  id: number;
  code: string;
  title: string;
  active: boolean;
  autoShuffle: boolean;
  tracks: number[];
}

/**
 * A DataBundle contains all runtime data needed for {@link BlnPlayer},
 * including {@link Release} and {@link Playlist} data.
 *
 * The remote API endpoint specified in {@link BlnPlayerOptions.sourceUrl}
 * must return data in this format.
 */
export interface DataBundle {
  visitToken: string;
  visitorToken: string;
  releases: Release[];
  playlists: Playlist[];
}

/** Play music published by basslin.es records. */
export class BlnPlayer {
  /** API authorization key. */
  apiKey: string;
  /** API authentication secret. */
  apiSecret: string;
  /** Automatically loop playback at end of playlist. */
  autoLoop: boolean;
  /** Automatically start playback when loaded. */
  autoPlay: boolean;
  /** Automatically shuffle playlist when loaded. */
  autoShuffle: boolean;
  /** Default playlist to select when loaded. */
  defaultPlaylist: string;
  /**
   * Remote API endpoint for reporting play track events.
   * Set to null to disable tracking.
   */
  eventsUrl: string;
  /** Use streaming HTML5 audio. */
  html5: boolean;
  /** Load callback. */
  onLoad: BlnPlayerCallback;
  /** Play callback. */
  onPlay: BlnPlayerCallback;
  /** Update callback. */
  onUpdate: BlnPlayerCallback;
  /** Remote API endpoint for data bundle source. */
  sourceUrl: string;
  /** Initial volume setting. Range is from `0.0` to `1.0`. */
  vol: number;

  /** Current loop selection setting. */
  loop: boolean;

  /** Howl instance used for audio playback. @internal */
  howl: Howl | null;
  /** Current selected playlist. @internal */
  playlist: number[];
  /** Loaded playlist data. @internal */
  playlists: Playlist[];
  /** Loaded release data. @internal */
  releases: Release[];
  /** Current selected track. @internal */
  track: Track | null;
  /** Loaded track data. @internal */
  tracks: Track[];
  /** Current visit token used for tracking. @internal */
  visitToken: string | null;
  /** Current visitor token used for tracking. @internal */
  visitorToken: string | null;

  /**
   * Create a new player instance.
   *
   * @param opts - configuration options
   */
  constructor(opts: BlnPlayerOptions) {
    const o = opts || {};

    this.apiKey = o.apiKey || "unidentified";
    this.apiSecret = o.apiSecret || "";
    this.autoLoop = o.autoLoop || false;
    this.autoPlay = o.autoPlay || false;
    this.autoShuffle = o.autoShuffle || false;
    this.defaultPlaylist = o.defaultPlaylist || 'all';
    this.eventsUrl = o.eventsUrl || 'https://basslin.es/ahoy/events';
    this.html5 = o.html5 || false;
    this.onLoad = o.onLoad || function () { /* do nothing */ };
    this.onPlay = o.onPlay || function () { /* do nothing */ };
    this.onUpdate = o.onUpdate || function () { /* do nothing */ };
    this.sourceUrl = o.sourceUrl || 'https://basslin.es/player.json';
    this.vol = o.vol || 1.0;

    this.howl = null;
    this.loop = false;
    this.playlist = [];
    this.playlists = [];
    this.releases = [];
    this.track = null;
    this.tracks = [];
    this.visitToken = null;
    this.visitorToken = null;
  }

  /**
   * Initiate retrieval and loading of release data from the configured
   * remote API endpoint at {@link BlnPlayerOptions.sourceUrl}.
   *
   * This method starts an asynchronous XHR and will trigger the
   * {@link onLoad} callback once complete.
   */
  load() {
    const reqData = new XMLHttpRequest();
    reqData.addEventListener('load', () => {
      if (reqData.status >= 200 && reqData.status < 400) {
        const dataBundle = JSON.parse(reqData.response) as DataBundle;
        this.loadData(dataBundle);
      }
    });
    reqData.open('GET', this.sourceUrl);
    reqData.send();
  }

  /**
   * Load all required data from a bundle.
   *
   * Will trigger the {@link onLoad} callback once complete.
   *
   * @param data - bundled data to load
   *
   * @internal
   */
  loadData(data: DataBundle) {
    this.visitToken = data.visitToken;
    this.visitorToken = data.visitorToken;
    this.loadReleases(data.releases);
    this.loadPlaylists(data.playlists);
    this.ready();
  }

  /**
   * Load release data.
   *
   * @param releaseData - releases to load
   *
   * @internal @hidden
   */
  loadReleases(releaseData: Release[]) {
    const releases: Release[] = [];
    const tracks: Track[] = [];

    releaseData.forEach((release) => {
      releases[release.id] = release;
      release.tracks.forEach((track) => {
        if (track.webm && track.m4a && track.mp3) {
          tracks[track.id] = track;
        }
      });
    });

    this.releases = releases;
    this.tracks = tracks;
  }

  /**
   * Load playlist data.
   *
   * @param playlistData - playlists to load
   *
   * @internal @hidden
   */
  loadPlaylists(playlistData: Playlist[]) {
    const playlists: Playlist[] = [];

    playlistData.forEach((playlist) => {
      playlists[playlist.id] = playlist;
      if (playlist.code === this.defaultPlaylist) {
        this.playlist = playlist.tracks;
      }
    });

    this.playlists = playlists;
  }

  /**
   * Make the player ready for playback and trigger automatic actions
   * after all required data has been loaded.
   *
   * @internal @hidden
   */
  ready() {
    this.track = this.tracks[this.playlist[0]];

    if (this.autoLoop) this.loop = this.autoLoop;
    if (this.onLoad) this.onLoad();
    if (this.autoShuffle) this.shuffle();
    if (this.autoPlay) this.pause();
  }

  /**
   * Select a playlist.
   *
   * @param idx - index of the playlist to be selected
   */
  selectPlaylist(idx: number) {
    this.playlist = this.playlists[idx].tracks;
    if (this.howl) this.howl.stop();
    if (this.playlists[idx].autoShuffle) this.shuffle();

    this.track = this.tracks[this.playlist[0]];
    this.howl = null;
  }

  /**
   * Shuffle the order of the current loaded playlist.
   *
   * Will trigger the {@link onUpdate} callback once complete.
   */
  shuffle() {
    const array = this.playlist;

    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }

    this.playlist = array;

    // If a track is already playing when shuffle is called, place it
    // at the beginning of the shuffled playlist. Otherwise, select
    // the new first track as the current track.
    if (this.track && (this.isLoading || this.isPlaying)) {
      this.playlist.splice(this.playlist.indexOf(this.track.id), 1);
      this.playlist.unshift(this.track.id);
    } else {
      this.track = this.tracks[this.playlist[0]];
      this.howl = null;
    }

    if (this.onUpdate) this.onUpdate();
  }

  /**
   * Set the volume level for audio playback.
   *
   * @param vol - new volume level, may be a number from `0.0` to `1.0`
   */
  volume(vol: number) {
    this.vol = vol;
    // Howler.volume(this.vol);
    if (this.howl) this.howl.volume(this.vol);
  }

  /**
   * Return `true` if the audio playback engine is currently loading audio,
   * or `false` otherwise.
   */
  get isLoading() {
    return !!(this.howl && this.howl.state() !== 'loaded');
  }

  /**
   * Return `true` if the audio playback engine is currently playing audio,
   * or `false` otherwise.
   */
  get isPlaying() {
    return !!(this.howl && this.howl.playing());
  }

  /**
   * Return the current selected {@link Release}.
   */
  get release() {
    if (this.track === null) return;
    return this.releases[this.track.releaseId];
  }

  /**
   * Play a specific track.
   *
   * Will trigger the {@link onPlay} callback when playback begins and will
   * trigger the {@link onUpdate} callback once immediately, and again when
   * the audio engine has completed loading the audio file.
   *
   * @param track - track to be played
   */
  play(track: Track) {
    if (this.howl) {
      this.howl.stop();
    }

    this.track = track;
    this.sendEvent(track);
    this.howl = new Howl({
      src: [track.webm, track.m4a, track.mp3],
      volume: this.vol,
      html5: this.html5,
      onend: this.next.bind(this),
      onload: this.onUpdate,
      onplay: this.onPlay,
      onseek: this.onPlay,
    });

    if (this.onUpdate) this.onUpdate();
    this.howl.play();
  }

  /**
   * Report play track event to the configured remote API endpoint.
   *
   * @param track - track being played
   *
   * @internal
   */
  sendEvent(track: Track) {
    if (!this.eventsUrl) return;

    const data = {
      events: [{
        name: '$play',
        properties: {
          apiKey: this.apiKey,
          apiSecret: this.apiSecret,
          origin: window.location.href,
          track: {
            id: track.id,
            title: track.title,
            artist: track.artist,
          },
          vol: this.vol,
        },
        time: (new Date()).getTime() / 1000.0,
        js: true,
      }],
      visit_token: this.visitToken,
      visitor_token: this.visitorToken,
    };

    const xhr = new XMLHttpRequest();
    xhr.open('POST', this.eventsUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  }

  /**
   * Pause or resume playback.
   *
   * Will trigger the {@link onUpdate} callback once complete.
   */
  pause() {
    if (this.howl && this.isPlaying) {
      this.howl.pause();
    } else if (this.howl) {
      this.howl.play();
    } else if (this.track) {
      this.play(this.track);
    }

    if (this.onUpdate) this.onUpdate();
  }

  /**
   * Select the next track in the current playlist.
   *
   * Will trigger the {@link onUpdate} callback once complete.
   */
  next() {
    if (!this.track) return;

    const pos = this.playlist.indexOf(this.track.id);
    const next = this.playlist[pos + 1];
    log.info(`BlnPlayer: next ${pos} -> ${next}`);

    if (next) this.play(this.tracks[next]);
    else if (this.loop) this.play(this.tracks[this.playlist[0]]);
    else if (this.onUpdate) this.onUpdate();
  }

  /**
   * Select the previous track in the current playlist.
   *
   * Will trigger the {@link onUpdate} callback once complete.
   */
  prev() {
    if (!this.track) return;

    const pos = this.playlist.indexOf(this.track.id);
    const prev = this.playlist[pos - 1];

    if (prev) this.play(this.tracks[prev]);
    else if (this.onUpdate) this.onUpdate();
  }
}

export default BlnPlayer;
