import BlnPlayer from './bln_player';

import Cookies from 'js-cookie';
import noUiSlider from 'nouislider';

import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward';
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward';
import { faList } from '@fortawesome/free-solid-svg-icons/faList';
import { faMusic } from '@fortawesome/free-solid-svg-icons/faMusic';
import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faRandom } from '@fortawesome/free-solid-svg-icons/faRandom';
import { faVolumeDown } from '@fortawesome/free-solid-svg-icons/faVolumeDown';
import { faVolumeMute } from '@fortawesome/free-solid-svg-icons/faVolumeMute';
import { faVolumeOff } from '@fortawesome/free-solid-svg-icons/faVolumeOff';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons/faVolumeUp';

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

export interface PanelControlOptions {
  apiKey?: string;
  apiSecret?: string;
  autoLoop?: boolean;
  autoPlay?: boolean;
  autoShuffle?: boolean;
  defaultPlaylist?: string;
  defaultVol?: number;
  eventsUrl?: string;
  html5?: boolean;
  elTarget?: HTMLElement;
  sourceUrl?: string;
}

export class PanelControl {
  elTarget: HTMLElement | null | undefined;
  elPlayer: HTMLElement | null | undefined;
  elCover: HTMLElement | null | undefined;
  elTrack: HTMLElement | null | undefined;
  elRelease: HTMLElement | null | undefined;
  elPrev: HTMLElement | null | undefined;
  elPause: HTMLElement | null | undefined;
  elNext: HTMLElement | null | undefined;
  elShuffle: HTMLElement | null | undefined;
  elVol: HTMLElement | null | undefined;

  player: BlnPlayer;
  defaultVol: number;

  constructor(opts: PanelControlOptions) {
    const o = opts || {};

    this.defaultVol = o.defaultVol || 100;
    this.elTarget = o.elTarget || null;

    this.player = new BlnPlayer({
      apiKey: o.apiKey,
      apiSecret: o.apiSecret,
      autoLoop: o.autoLoop,
      autoPlay: o.autoPlay,
      autoShuffle: o.autoShuffle,
      defaultPlaylist: o.defaultPlaylist,
      eventsUrl: o.eventsUrl,
      html5: o.html5,
      onLoad: this.load.bind(this),
      onPlay: this.refresh.bind(this),
      onUpdate: this.refresh.bind(this),
      sourceUrl: o.sourceUrl,
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
    }
    if (this.elPrev) {
      this.elPrev.addEventListener('click', this.prev.bind(this));
    }

    if (!this.elPause) {
      this.elPause = document.getElementById('bln_pause');
    }
    if (this.elPause) {
      this.elPause.addEventListener('click', this.pause.bind(this));
    }

    if (!this.elNext) {
      this.elNext = document.getElementById('bln_next');
    }
    if (this.elNext) {
      this.elNext.addEventListener('click', this.next.bind(this));
    }

    if (!this.elShuffle) {
      this.elShuffle = document.getElementById('bln_shuffle');
    }
    if (this.elShuffle) {
      this.elShuffle.addEventListener('click', this.shuffle.bind(this));
    }

    if (!this.elVol) this.volumeLoad();

    this.refresh();
    this.elPlayer.style.display = 'block';
  }

  volumeLoad() {
    const volCookie = Cookies.get('bln_volume');
    let vol;

    if (volCookie) vol = parseInt(volCookie, 10);
    else vol = this.defaultVol;
    this.player.volume(vol * 0.01);

    this.elVol = document.getElementById('bln_volume');
    if (this.elVol) {
      this.elVol.style.width = '10em';
      const slider = noUiSlider.create(this.elVol, {
        start: [vol],
        connect: [true, false],
        orientation: 'horizontal',
        direction: 'ltr',
        range: {
          min: 0,
          max: 100,
        },
      });
      slider.on('set', this.volumeSet.bind(this));
    }
  }

  volumeSet(values: (string | number)[], handle: number) {
    const volCookie = '' + values[handle];
    Cookies.set('bln_volume', volCookie);

    const vol = parseInt(volCookie, 10);
    this.player.volume(vol * 0.01);
  }

  refresh() {
    if (!this.player.track) return;

    const { track, release } = this.player;

    if (release && this.elCover) {
      this.elCover.innerHTML = `<a href="${release.url}" target="_blank">`
        + `<img src="${release.image}" alt="Cover" width="38" height="38"/></a>`;
    }
    if (this.elTrack) {
      this.elTrack.innerHTML = track.title;
    }
    if (release && this.elRelease) {
      this.elRelease.innerHTML = `<a href="${release.url}" target="_blank">`
        + `${track.artist} - ${release.title}</a>`;
    }

    if (this.elPause) {
      if (this.player.isPlaying || this.player.isLoading) {
        this.elPause.innerHTML = '<span class="fa fa-fw fa-lg fa-pause"></span>';
      } else {
        this.elPause.innerHTML = '<span class="fa fa-fw fa-lg fa-play"></span>';
      }
    }
  }

  pause(event: Event) {
    this.player.pause();

    if (event) event.preventDefault();
    return false;
  }

  prev(event: Event) {
    this.player.prev();

    if (event) event.preventDefault();
    return false;
  }

  next(event: Event) {
    this.player.next();

    if (event) event.preventDefault();
    return false;
  }

  shuffle(event: Event) {
    this.player.shuffle();

    if (event) event.preventDefault();
    return false;
  }
}

export default PanelControl;
