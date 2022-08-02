import { Howl } from 'howler';

import log from 'loglevel';

type BlnPlayerCallback = () => void;

interface BlnPlayerOptions {
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

interface Track {
  id: number;
  releaseId: number;
  artist: string;
  title: string;
  m4a: string;
  mp3: string;
  webm: string;
}

interface Release {
  id: number;
  title: string;
  url: string;
  image: string;
  tracks: Track[];
}

interface Playlist {
  id: number;
  code: string;
  title: string;
  active: boolean;
  autoShuffle: boolean;
  tracks: number[];
}

interface DataBundle {
  visitToken: string;
  visitorToken: string;
  releases: Release[];
  playlists: Playlist[];
}

/** Play music published by basslin.es records. */
class BlnPlayer {
  apiKey: string;
  apiSecret: string;
  autoLoop: boolean;
  autoPlay: boolean;
  autoShuffle: boolean;
  defaultPlaylist: string;
  eventsUrl: string;
  html5: boolean;
  onLoad: BlnPlayerCallback;
  onPlay: BlnPlayerCallback;
  onUpdate: BlnPlayerCallback;
  sourceUrl: string;
  vol: number;

  howl: Howl | null;
  loop: boolean;
  playlist: number[];
  playlists: Playlist[];
  releases: Release[];
  track: Track | null;
  tracks: Track[];
  visitToken: string | null;
  visitorToken: string | null;

  /**
   * Create a new Player.
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
   * Initiate retrieval of release data from a remote URL.
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

  loadData(data: DataBundle) {
    this.visitToken = data.visitToken;
    this.visitorToken = data.visitorToken;
    this.loadReleases(data.releases);
    this.loadPlaylists(data.playlists);
    this.ready();
  }

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

  ready() {
    this.track = this.tracks[this.playlist[0]];

    if (this.autoLoop) this.loop = this.autoLoop;
    if (this.onLoad) this.onLoad();
    if (this.autoShuffle) this.shuffle();
    if (this.autoPlay) this.pause();
  }

  selectPlaylist(playlistId: number) {
    this.playlist = this.playlists[playlistId].tracks;
    if (this.howl) this.howl.stop();
    if (this.playlists[playlistId].autoShuffle) this.shuffle();

    this.track = this.tracks[this.playlist[0]];
    this.howl = null;
  }

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

  volume(vol: number) {
    this.vol = vol;
    // Howler.volume(this.vol);
    if (this.howl) this.howl.volume(this.vol);
  }

  get isLoading() {
    return !!(this.howl && this.howl.state() !== 'loaded');
  }

  get isPlaying() {
    return !!(this.howl && this.howl.playing());
  }

  get release() {
    if (this.track === null) return;
    return this.releases[this.track.releaseId];
  }

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

  sendEvent(track: Track) {
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

  next() {
    if (!this.track) return;

    const pos = this.playlist.indexOf(this.track.id);
    const next = this.playlist[pos + 1];
    log.info(`BlnPlayer: next ${pos} -> ${next}`);

    if (next) this.play(this.tracks[next]);
    else if (this.loop) this.play(this.tracks[this.playlist[0]]);
    else if (this.onUpdate) this.onUpdate();
  }

  prev() {
    if (!this.track) return;

    const pos = this.playlist.indexOf(this.track.id);
    const prev = this.playlist[pos - 1];

    if (prev) this.play(this.tracks[prev]);
    else if (this.onUpdate) this.onUpdate();
  }
}

export default BlnPlayer;
