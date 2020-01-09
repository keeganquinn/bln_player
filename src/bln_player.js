import { Howl } from 'howler';

/** Play music published by basslin.es records. */
class BlnPlayer {
  /**
   * Create a new Player.
   */
  constructor(opts) {
    const o = opts || {};

    this.howl = null;
    this.html5 = o.html5;
    this.loop = 0;
    this.onLoad = o.onLoad || null;
    this.onPlay = o.onPlay || null;
    this.onUpdate = o.onUpdate || null;
    this.playlist = null;
    this.releases = null;
    this.sourceUrl = o.sourceUrl || 'https://basslin.es/releases.json';
    this.track = null;
    this.tracks = null;
    this.vol = o.vol || 1.0;
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
    player.loadReleases(response.releases);
  }

  loadReleases(releaseData) {
    const playlist = [];
    const releases = [];
    const tracks = [];

    releaseData.forEach((release) => {
      releases[release.id] = release;
      release.tracks.forEach((track) => {
        if (track.webm && track.m4a && track.mp3) {
          tracks[track.id] = track;
          playlist.push(track.id);
        }
      });
    });

    this.playlist = playlist;
    this.releases = releases;
    this.tracks = tracks;
    this.track = tracks[playlist[0]];

    if (this.onLoad) this.onLoad();
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
      this.playlist.pop(this.track.id);
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

    if (next) this.play(this.tracks[next]);
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
