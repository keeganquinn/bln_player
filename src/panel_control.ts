import { library, dom } from '@fortawesome/fontawesome-svg-core';
import {
  faBackward, faForward, faList, faMusic, faPause, faPlay, faRandom,
  faVolumeDown, faVolumeMute, faVolumeOff, faVolumeUp,
} from '@fortawesome/free-solid-svg-icons';
import BlnPlayer from './bln_player';

import Cookies from 'js-cookie';
import noUiSlider from 'nouislider';

const playerCls = 'border border-dark m-2 p-2';
const playerHtml = `
  <div id="bln_controls">
    <a id="bln_prev" href="#" class="btn btn-secondary">
      <span class="fa fa-fw fa-lg fa-backward"></span></a>
    <a id="bln_pause" href="#" class="btn btn-secondary">
      <span class="fa fa-fw fa-lg fa-play"></span></a>
    <a id="bln_next" href="#" class="btn btn-secondary">
      <span class="fa fa-fw fa-lg fa-forward"></span></a>
    <a id="bln_shuffle" href="#" class="btn btn-secondary">
      <span class="fa fa-fw fa-lg fa-random"></span></a>
    <div style="padding: 1em;">
      <div id="bln_volume" class="noUi-target noUi-ltr noUi-horizontal"></div>
    </div>
  </div>
  <div id="bln_display">
    <div id="bln_cover"><span class="fa fa-fw fa-music"></span></div>
    <div id="bln_track"></div>
    <div id="bln_release"></div>
  </div>
`;

interface PanelControlOptions {
  apiKey: string;
  apiSecret: string;
  autoLoop: boolean;
  autoPlay: boolean;
  autoShuffle: boolean;
  defaultPlaylist: string;
  defaultVol: number;
  eventsUrl: string;
  html5: boolean;
  elTarget: Element;
  sourceUrl: string;
}

class PanelControl {
  elTarget: Element | null | undefined;
  elPlayer: Element | null | undefined;
  elCover: Element | null | undefined;
  elTrack: Element | null | undefined;
  elRelease: Element | null | undefined;
  elPrev: Element | null | undefined;
  elPause: Element | null | undefined;
  elNext: Element | null | undefined;
  elShuffle: Element | null | undefined;
  elVol: Element | null | undefined;

  player: BlnPlayer;
  defaultVol: number;

  constructor(opts: PanelControlOptions) {
    this.defaultVol = opts.defaultVol || 100;
    this.elTarget = opts.elTarget;

    this.player = new BlnPlayer({
      apiKey: opts.apiKey,
      apiSecret: opts.apiSecret,
      autoLoop: opts.autoLoop,
      autoPlay: opts.autoPlay,
      autoShuffle: opts.autoShuffle,
      defaultPlaylist: opts.defaultPlaylist,
      eventsUrl: opts.eventsUrl,
      html5: opts.html5,
      onLoad: this.load.bind(this),
      onPlay: this.refresh.bind(this),
      onUpdate: this.refresh.bind(this),
      sourceUrl: opts.sourceUrl,
    });
  }

  start() {
    this.player.load();
  }

  load() {
    if (!this.player.track) return;

    // Enable font-awesome glyphs
    library.add(
      faBackward,
      faForward,
      faList,
      faMusic,
      faPause,
      faPlay,
      faRandom,
      faVolumeDown,
      faVolumeMute,
      faVolumeOff,
      faVolumeUp,
    );
    dom.watch();

    if (!this.elTarget) {
      this.elTarget = document.createElement('div');
      document.body.appendChild(this.elTarget);
    }

    this.elPlayer = document.getElementById('bln_panel');
    if (!this.elPlayer) {
      this.elPlayer = document.createElement('div');
      this.elPlayer.id = 'bln_panel';
      this.elPlayer.className = playerCls;
      this.elPlayer.innerHTML = playerHtml;
      this.elPlayer.style.display = 'none';
      this.elTarget.appendChild(this.elPlayer);
    }

    this.elCover = document.getElementById('bln_cover');
    this.elTrack = document.getElementById('bln_track');
    this.elRelease = document.getElementById('bln_release');

    if (!this.elPrev) {
      this.elPrev = document.getElementById('bln_prev');
      this.elPrev.addEventListener('click', this.prev.bind(this));
    }
    if (!this.elPause) {
      this.elPause = document.getElementById('bln_pause');
      this.elPause.addEventListener('click', this.pause.bind(this));
    }
    if (!this.elNext) {
      this.elNext = document.getElementById('bln_next');
      this.elNext.addEventListener('click', this.next.bind(this));
    }
    if (!this.elShuffle) {
      this.elShuffle = document.getElementById('bln_shuffle');
      this.elShuffle.addEventListener('click', this.shuffle.bind(this));
    }

    if (!this.elVol) this.volumeLoad();

    this.refresh();
    this.elPlayer.style.display = 'block';
  }

  volumeLoad() {
    let vol = Cookies.get('bln_volume');
    if (vol) vol = parseInt(vol, 10);
    else vol = this.defaultVol;
    this.player.volume(vol * 0.01);

    this.elVol = document.getElementById('bln_volume');
    this.elVol.style.width = '10em';
    noUiSlider.create(this.elVol, {
      start: [vol],
      connect: [true, false],
      orientation: 'horizontal',
      direction: 'ltr',
      range: {
        min: 0,
        max: 100,
      },
    });
    this.elVol.noUiSlider.on('set', this.volumeSet.bind(this));
  }

  volumeSet(values, handle) {
    const vol = parseInt(values[handle], 10);
    Cookies.set('bln_volume', vol);
    this.player.volume(vol * 0.01);
  }

  refresh() {
    if (!this.player.track) return;

    const { track, release } = this.player;

    this.elCover.innerHTML = `<a href="${release.url}" target="_blank">`
      + `<img src="${release.image}" alt="Cover" width="38" height="38"/></a>`;
    this.elTrack.innerHTML = track.title;
    this.elRelease.innerHTML = `<a href="${release.url}" target="_blank">`
      + `${track.artist} - ${release.title}</a>`;

    if (this.player.isPlaying || this.player.isLoading) {
      this.elPause.innerHTML = '<span class="fa fa-fw fa-lg fa-pause"></span>';
    } else {
      this.elPause.innerHTML = '<span class="fa fa-fw fa-lg fa-play"></span>';
    }
  }

  pause(event) {
    this.player.pause();

    if (event) event.preventDefault();
    return false;
  }

  prev(event) {
    this.player.prev();

    if (event) event.preventDefault();
    return false;
  }

  next(event) {
    this.player.next();

    if (event) event.preventDefault();
    return false;
  }

  shuffle(event) {
    this.player.shuffle();

    if (event) event.preventDefault();
    return false;
  }
}

export default PanelControl;