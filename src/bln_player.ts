import { Howl } from 'howler';

import log from 'loglevel';

/** Play music published by basslin.es records. */
class BlnPlayer {
  /**
   * Create a new Player.
   */
  constructor(opts) {
    const o = opts || {};

    this.apiKey = o.apiKey;
    this.apiSecret = o.apiSecret;
    this.autoLoop = o.autoLoop;
    this.autoPlay = o.autoPlay;
    this.autoShuffle = o.autoShuffle;
    this.defaultPlaylist = o.defaultPlaylist || 'all';
    this.eventsUrl = o.eventsUrl || 'https://basslin.es/ahoy/events';
    this.html5 = o.html5;
    this.onLoad = o.onLoad;
    this.onPlay = o.onPlay;
    this.onUpdate = o.onUpdate;
    this.sourceUrl = o.sourceUrl || 'https://basslin.es/player.json';
    this.vol = o.vol || 1.0;

    this.howl = null;
    this.loop = 0;
    this.playlist = null;
    this.playlists = null;
    this.releases = null;
    this.track = null;
    this.tracks = null;
    this.visitToken = null;
    this.visitorToken = null;
  }

  /**
   * Initiate retrieval of release data from a remote URL.
   */
  load() {
    window.player = this;

    const reqData = new XMLHttpRequest();
    reqData.addEventListener('load', this.loadData);
    reqData.open('GET', this.sourceUrl);
    reqData.send();
  }

  loadData(event, data) {
    const { player } = window;
    const response = data || JSON.parse(this.responseText);
    player.visitToken = response.visitToken;
    player.visitorToken = response.visitorToken;
    player.loadReleases(response.releases);
    player.loadPlaylists(response.playlists);
    player.ready();
  }

  loadReleases(releaseData) {
    const releases = [];
    const tracks = [];

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

  loadPlaylists(playlistData) {
    const playlists = [];

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

  selectPlaylist(playlistId) {
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
    if (this.isLoading || this.isPlaying) {
      this.playlist.splice(this.playlist.indexOf(this.track.id), 1);
      this.playlist.unshift(this.track.id);
    } else {
      this.track = this.tracks[this.playlist[0]];
      this.howl = null;
    }

    if (this.onUpdate) this.onUpdate();
  }

  volume(vol) {
    this.vol = vol;
    // Howler.volume(this.vol);
    if (this.howl) this.howl.volume(this.vol);
  }

  get isLoading() {
    return this.howl && this.howl.state() !== 'loaded';
  }

  get isPlaying() {
    return this.howl && this.howl.playing();
  }

  get release() {
    return this.releases[this.track.releaseId];
  }

  play(track) {
    if (this.howl) {
      this.howl.stop();
    }

    this.track = track;
    this.sendEvent();
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

  sendEvent() {
    const data = {
      events: [{
        name: '$play',
        properties: {
          apiKey: this.apiKey,
          apiSecret: this.apiSecret,
          origin: window.location.href,
          track: {
            id: this.track.id,
            title: this.track.title,
            artist: this.track.artist,
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
    if (this.isPlaying) {
      this.howl.pause();
    } else if (this.howl) {
      this.howl.play();
    } else {
      this.play(this.track);
    }

    if (this.onUpdate) this.onUpdate();
  }

  next() {
    const pos = this.playlist.indexOf(this.track.id);
    const next = this.playlist[pos + 1];
    log.info(`BlnPlayer: next ${pos} -> ${next}`);

    if (next) this.play(this.tracks[next]);
    else if (this.loop) this.play(this.tracks[this.playlist[0]]);
    else if (this.onUpdate) this.onUpdate();
  }

  prev() {
    const pos = this.playlist.indexOf(this.track.id);
    const prev = this.playlist[pos - 1];

    if (prev) this.play(this.tracks[prev]);
    else if (this.onUpdate) this.onUpdate();
  }
}

export default BlnPlayer;
