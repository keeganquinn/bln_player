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

/**
 * Configuration options which are available when creating a new
 * {@link PanelControl} instance.
 */
export interface PanelControlOptions {
  /** API authorization key. */
  apiKey?: string;
  /** API authentication secret. */
  apiSecret?: string;
  /** Automatically loop playback at end of playlist. */
  autoLoop?: boolean;
  /** Automatically start playback when loaded. */
  autoPlay?: boolean;
  /** Automatically shuffle playlist when loaded. */
  autoShuffle?: boolean;
  /** Default playlist to select when loaded. */
  defaultPlaylist?: string;
  /** Default volume setting. */
  defaultVol?: number;
  /**
   * Remote API endpoint for reporting play track events.
   * Set to null to disable tracking.
   */
  eventsUrl?: string;
  /** Use streaming HTML5 audio. */
  html5?: boolean;
  /** Target HTML element to render the UI. */
  elTarget?: HTMLElement;
  /** Remote API endpoint for data bundle source. */
  sourceUrl?: string;
}

/** PanelControl provides a simple, extensible UI for {@link BlnPlayer}. */
export class PanelControl {
  /** UI element: target div @internal @hidden */
  elTarget: HTMLElement | null | undefined;
  /** UI element: bln_panel div @internal @hidden */
  elPlayer: HTMLElement | null | undefined;
  /** UI element: bln_cover div @internal @hidden */
  elCover: HTMLElement | null | undefined;
  /** UI element: bln_track div @internal @hidden */
  elTrack: HTMLElement | null | undefined;
  /** UI element: bln_release div @internal @hidden */
  elRelease: HTMLElement | null | undefined;
  /** UI element: bln_prev a @internal @hidden */
  elPrev: HTMLElement | null | undefined;
  /** UI element: bln_pause a @internal @hidden */
  elPause: HTMLElement | null | undefined;
  /** UI element: bln_next a @internal @hidden */
  elNext: HTMLElement | null | undefined;
  /** UI element: bln_shuffle a @internal @hidden */
  elShuffle: HTMLElement | null | undefined;
  /** UI element: bln_volume div @internal @hidden */
  elVol: HTMLElement | null | undefined;

  /** Controlled player instance. @internal */
  player: BlnPlayer;
  /** Default volume setting. @internal @hidden */
  defaultVol: number;

  /**
   * Create a new music player UI.
   *
   * @param opts configuration options
   */
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

  /**
   * Start the player engine.
   */
  start() {
    this.player.load();
  }

  /**
   * Load references to DOM elements and prepare the UI.
   *
   * This method is used as a callback for the
   * {@link BlnPlayerOptions.onLoad} hook.
   *
   * @internal @hidden
   */
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

  /**
   * Load the volume control, including any previous state settings which
   * may be stored in cookies.
   *
   * @internal @hidden
   */
  volumeLoad() {
    const volCookie = Cookies.get('bln_volume');
    let vol;

    if (volCookie) vol = parseInt(volCookie, 10);
    else vol = this.defaultVol;
    this.volumeApply(vol);

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

  /**
   * Set the volume, and store the setting in a cookie.
   *
   * @internal @hidden
   */
  volumeSet(values: (string | number)[], handle: number) {
    const volCookie = '' + values[handle];
    Cookies.set('bln_volume', volCookie);

    const vol = parseInt(volCookie, 10);
    this.volumeApply(vol);
  }

  /**
   * Apply a given volume setting.
   *
   * @param vol new volume level
   *
   * @internal @hidden
   */
  volumeApply(vol: number) {
    this.player.volume(vol * 0.01);
  }

  /**
   * Refresh the UI to reflect the current player state.
   *
   * This method is used as a callback for the
   * {@link BlnPlayerOptions.onPlay} and
   * {@link BlnPlayerOptions.onUpdate} hooks.
   *
   * @internal @hidden
   */
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

  /**
   * Pause or resume playback.
   *
   * @param event DOM event
   *
   * @internal @hidden
   */
  pause(event: Event) {
    this.player.pause();

    if (event) event.preventDefault();
    return false;
  }

  /**
   * Select the previous track on the current playlist.
   *
   * @param event DOM event
   *
   * @internal @hidden
   */
  prev(event: Event) {
    this.player.prev();

    if (event) event.preventDefault();
    return false;
  }

  /**
   * Select the next track on the current playlist.
   *
   * @param event DOM event
   *
   * @internal @hidden
   */
  next(event: Event) {
    this.player.next();

    if (event) event.preventDefault();
    return false;
  }

  /**
   * Shuffle the current playlist.
   *
   * @param event DOM event
   *
   * @internal @hidden
   */
  shuffle(event: Event) {
    this.player.shuffle();

    if (event) event.preventDefault();
    return false;
  }
}

export default PanelControl;
