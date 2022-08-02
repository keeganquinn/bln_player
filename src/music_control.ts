import { Spinner } from 'spin.js';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import {
  faBackward, faForward, faGripHorizontal, faList, faMusic, faPause,
  faPlay, faRandom, faVolumeDown, faVolumeMute, faVolumeOff, faVolumeUp,
} from '@fortawesome/free-solid-svg-icons';
import BlnPlayer from './bln_player';

import Cookies from 'js-cookie';
import noUiSlider from 'nouislider';

const playerCls = 'navbar navbar-dark navbar-expand bg-secondary fixed-bottom';
const playerHtml = `
  <div class="container">
      <div class="d-none d-sm-flex" id="player_display">
        <div>
          <div id="player_art"><span class="fa fa-fw fa-music"></span></div>
        </div>
        <div class="ps-3">
          <div id="player_trk"></div>
          <div id="player_rel"></div>
        </div>
      </div>
    <ul class="navbar-nav">
      <li class="nav-item dropup">
        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown">
          <span class="fa fa-fw fa-list"></span></a>
        <div id="player_box" class="dropdown-menu p-0">
          Select Playlist: <select id="player_sel"></select>

          <table class="table table-bordered table-hover table-sm small">
            <thead class="thead-dark">
              <tr><th>Track</th></tr>
            </thead>
            <tbody id="player_list"></tbody>
          </table>
        </div>
      </li>
      <li class="nav-item">
        <a id="player_shuffle" href="#" class="nav-link">
          <span class="fa fa-fw fa-random"></span></a></li>
      <li class="nav-item">
        <a id="player_prev" href="#" class="nav-link">
          <span class="fa fa-fw fa-lg fa-backward"></span></a></li>
      <li class="nav-item">
        <a id="player_pause" href="#" class="nav-link">
          <span class="fa fa-fw fa-lg fa-play"></span></a></li>
      <li class="nav-item">
        <a id="player_next" href="#" class="nav-link">
          <span class="fa fa-fw fa-lg fa-forward"></span></a></li>
      <li class="nav-item dropup" id="player_vgrp">
        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown">
          <span class="fa fa-fw fa-volume-up"></span></a>
        <div class="dropdown-menu bg-secondary p-1">
          <div id="player_vol" class="noUi-target noUi-rtl noUi-vertical">
          </div>
        </div>
      </li>
    </ul>
  </div>
`;

interface MusicControlOptions {
  apiKey?: string;
  apiSecret?: string;
  eventsUrl?: string;
  sourceUrl?: string;
}

/** MusicControl handles UI interactions to control a BlnPlayer. */
class MusicControl {
  elPlayer: HTMLElement | null | undefined;
  elArt: HTMLElement | null | undefined;
  elBox: HTMLElement | null | undefined;
  elList: HTMLElement | null | undefined;
  elSel: HTMLInputElement | null | undefined;
  elTrk: HTMLElement | null | undefined;
  elRel: HTMLElement | null | undefined;
  elShuffle: HTMLElement | null | undefined;
  elPrev: HTMLElement | null | undefined;
  elPause: HTMLElement | null | undefined;
  elNext: HTMLElement | null | undefined;
  elVol: HTMLElement | null | undefined;
  elVolGrp: HTMLElement | null | undefined;
  elVolSel: HTMLElement | null | undefined;
  elFoot: HTMLElement | null | undefined;
  elSpacer: HTMLElement | null | undefined;

  player: BlnPlayer;
  spinner: Spinner;
  userAgent: string;

  constructor(opts: MusicControlOptions) {
    const o = opts || {};

    this.player = new BlnPlayer({
      apiKey: opts.apiKey,
      apiSecret: opts.apiSecret,
      autoLoop: true,
      eventsUrl: opts.eventsUrl,
      html5: !this.isAndroid,
      onLoad: this.load.bind(this),
      onPlay: this.refresh.bind(this),
      onUpdate: this.refresh.bind(this),
      sourceUrl: opts.sourceUrl,
    });

    this.spinner = new Spinner({
      lines: 10,
      length: 5,
      width: 2,
      radius: 3,
      scale: 1,
      corners: 1,
      speed: 1,
      rotate: 0,
      animation: 'spinner-line-fade-quick',
      direction: 1,
      color: '#ffffff',
      fadeColor: 'transparent',
      shadow: '0 0 1px transparent',
    });

    this.userAgent = navigator.userAgent;
  }

  get isAndroid() {
    return /(android)/i.test(this.userAgent);
  }

  get isIos() {
    return /iPad|iPhone|iPod/.test(this.userAgent);
  }

  get isMobile() {
    return this.isAndroid || this.isIos;
  }

  start() {
    this.player.load();
  }

  /**
   * Locate playlist elements in the current page.
   */
  static get elPlaylist() {
    return document.getElementById('playlist');
  }

  /**
   * Locate track elements in the current page.
   */
  static get elTracks() {
    return Array.from(document.getElementsByClassName('track'));
  }

  load() {
    if (!this.player.track) return;

    // Enable font-awesome glyphs
    library.add(
      faBackward,
      faForward,
      faGripHorizontal,
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

    if (!this.elPlayer) {
      this.elPlayer = document.createElement('div');
      this.elPlayer.id = 'bln_player';
      this.elPlayer.className = playerCls;
      this.elPlayer.innerHTML = playerHtml;
      this.elPlayer.dataset.turbolinksPermanent = '';
      this.elPlayer.style.display = 'none';
    }
    document.body.appendChild(this.elPlayer);

    if (!this.elArt) this.elArt = document.getElementById('player_art');
    if (!this.elBox) this.elBox = document.getElementById('player_box');
    if (!this.elList) this.elList = document.getElementById('player_list');
    if (!this.elSel) this.elSel = document.getElementById('player_sel') as HTMLInputElement;
    if (!this.elTrk) this.elTrk = document.getElementById('player_trk');
    if (!this.elRel) this.elRel = document.getElementById('player_rel');

    if (!this.elShuffle) {
      this.elShuffle = document.getElementById('player_shuffle');
    }
    if (this.elShuffle) {
      this.elShuffle.addEventListener('click', this.musicShuffle.bind(this));
    }

    if (!this.elPrev) {
      this.elPrev = document.getElementById('player_prev');
    }
    if (this.elPrev) {
      this.elPrev.addEventListener('click', this.musicPrev.bind(this));
    }

    if (!this.elPause) {
      this.elPause = document.getElementById('player_pause');
    }
    if (this.elPause) {
      this.elPause.addEventListener('click', this.musicPause.bind(this));
    }

    if (!this.elNext) {
      this.elNext = document.getElementById('player_next');
    }
    if (this.elNext) {
      this.elNext.addEventListener('click', this.musicNext.bind(this));
    }

    if (!this.elVolGrp) this.elVolGrp = document.getElementById('player_vgrp');
    if (this.elVolGrp && !this.elVolSel) {
      this.elVolSel = this.elVolGrp.firstElementChild as HTMLElement;
    }
    if (!this.elVol) this.volumeLoad();

    this.elFoot = document.getElementById('foot');
    if (this.elFoot) this.elFoot.className = 'text-muted pb-2 mb-5';
    this.elSpacer = document.getElementById('spacer');
    if (this.elSpacer) this.elSpacer.className = 'mb-5 pb-3';

    if (!this.player.isPlaying) this.activatePlaylist();

    MusicControl.elTracks.forEach((item) => {
      const elTrack = item as HTMLElement;
      elTrack.className = 'track loaded';

      const idx = parseInt(elTrack.getAttribute('data-id') as string, 10);
      const track = this.player.tracks[idx];
      if (!track) return;

      elTrack.addEventListener('click', () => {
        this.activatePlaylist();
        this.player.play(track);
      });

      Array.from(elTrack.getElementsByTagName('a')).forEach((link) => {
        const elLink = link;
        if (this.isMobile) {
          elLink.style.display = 'none';
        } else {
          elLink.addEventListener('click', (event) => {
            event.stopPropagation();
          });
        }
      });
    });

    this.elSel.addEventListener('change', () => {
      if (this.elSel && this.player.track) {
        const playlistId = parseInt(this.elSel.value, 10);
        this.player.selectPlaylist(playlistId);
        this.player.play(this.player.track);
      }
    });

    this.elPlayer.style.display = 'block';
    this.refresh();
  }

  activatePlaylist() {
    if (MusicControl.elPlaylist) {
      const idx = parseInt(MusicControl.elPlaylist.getAttribute('data-id') as string, 10);
      this.player.selectPlaylist(idx);
    }
  }

  volumeLoad() {
    // No volume control on mobile; users have volume rocker instead
    if (this.isMobile) {
      if (this.elVolGrp) {
        this.elVolGrp.style.display = 'none';
      }
      return;
    }

    const volCookie = Cookies.get('volume');
    let vol;

    if (volCookie) vol = parseInt(volCookie, 10);
    else vol = 100;
    this.volumeApply(vol);

    this.elVol = document.getElementById('player_vol');
    if (this.elVol) {
      if (this.elVol.parentElement) {
        this.elVol.parentElement.style.minWidth = '18px';
      }
      this.elVol.style.height = '10em';
      const slider = noUiSlider.create(this.elVol, {
        start: [this.player.vol * 100],
        connect: [true, false],
        orientation: 'vertical',
        direction: 'rtl',
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
    Cookies.set('volume', volCookie);

    const vol = parseInt(volCookie, 10);
    this.volumeApply(vol);
  }

  volumeApply(vol: number) {
    this.player.volume(vol * 0.01);

    // Update the icon based on the current status.
    const icon = (vol > 0) ? 'fa-volume-up' : 'fa-volume-mute';
    if (this.elVolSel) {
      this.elVolSel.innerHTML = `<span class="fa fa-fw ${icon}"></span>`;
    }
  }

  /**
   * Refresh the UI to reflect the current player state.
   */
  refresh() {
    const { track, release } = this.player;
    if (!track || !release) return;

    MusicControl.elTracks.forEach((item) => {
      const elTrack = item;
      const elTrackId = parseInt(elTrack.getAttribute('data-id') as string, 10);
      if (track && this.player.isPlaying && (elTrackId === track.id)) {
        elTrack.className = 'track loaded playing';
      } else {
        elTrack.className = 'track loaded';
      }
    });

    const opts: string[] = [];
    this.player.playlists.forEach((playlist) => {
      if (playlist.active) {
        opts.push(`<option value="${playlist.id}">${playlist.title}</option>`);
      }
    });
    if (this.elSel) {
      this.elSel.innerHTML = opts.join('');
    }

    const rows: string[] = [];
    this.player.playlist.forEach((trackId) => {
      const aTrack = this.player.tracks[trackId];
      if (!aTrack) return;

      let kls = '';
      if (track.id === aTrack.id) kls = 'class="table-active"';
      rows.push(`<tr data-id="${aTrack.id}" ${kls}><td>`
                + `${aTrack.artist} - ${aTrack.title}</td></tr>`);
    });

    if (this.elList) {
      this.elList.innerHTML = rows.join('');

      const trs = Array.from(this.elList.getElementsByTagName('tr'));
      trs.forEach((elTr) => {
        const elTrIdx = parseInt(elTr.getAttribute('data-id') as string, 10);
        const aTrack = this.player.tracks[elTrIdx];
        elTr.addEventListener('click', () => this.player.play(aTrack));
      });
    }

    if (this.elArt) {
      this.elArt.style.height = '40px';
      this.elArt.style.width = '40px';
      this.elArt.style.border = '1px solid #e9ecef';
      this.elArt.innerHTML = `<a href="${release.url}">`
        + `<img src="${release.image}" alt="Cover" width="38" height="38"/></a>`;
    }

    if (this.elBox) {
      this.elBox.style.left = '-1em';
      this.elBox.style.maxHeight = '75vh';
      this.elBox.style.maxWidth = '100%';
      this.elBox.style.minWidth = '19em';
      this.elBox.style.overflowX = 'hidden';
    }

    if (this.elTrk) {
      this.elTrk.style.fontSize = '0.8rem';
      this.elTrk.style.fontWeight = 'bold';
      this.elTrk.innerHTML = track.title;
    }

    if (this.elRel) {
      this.elRel.style.fontSize = '0.8rem';
      this.elRel.innerHTML = `<a href="${release.url}">`
        + `${track.artist} - ${release.title}</a>`;
      if (this.elRel.firstElementChild) {
        const elRelChild = this.elRel.firstElementChild as HTMLElement;
        elRelChild.style.textDecoration = 'none';
        elRelChild.style.color = 'black';
      }
    }

    if (this.elPause) {
      if (this.player.isLoading) {
        if (!this.spinner.el) {
          this.elPause.innerHTML = '<span style="position: relative;">'
            + '<span class="fa fa-fw fa-lg fa-pause invisible"></span></span>';
          const elPauseChild = this.elPause.firstElementChild as HTMLElement;
          this.spinner.spin(elPauseChild);
        }
      } else if (this.player.isPlaying) {
        if (this.spinner.el) this.spinner.stop();
        this.elPause.innerHTML = '<span class="fa fa-fw fa-lg fa-pause"></span>';
      } else {
        if (this.spinner.el) this.spinner.stop();
        this.elPause.innerHTML = '<span class="fa fa-fw fa-lg fa-play"></span>';
      }
    }
  }

  step() {
    // Update position of seek bar
    // https://howlerjs.com/assets/howler.js/examples/player/
  }

  musicPause(event: Event) {
    this.player.pause();

    if (event) event.preventDefault();
    return false;
  }

  musicShuffle(event: Event) {
    this.player.shuffle();

    if (event) event.preventDefault();
    return false;
  }

  musicPrev(event: Event) {
    this.player.prev();

    if (event) event.preventDefault();
    return false;
  }

  musicNext(event: Event) {
    this.player.next();

    if (event) event.preventDefault();
    return false;
  }
}

export default MusicControl;
