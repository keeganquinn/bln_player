import { Spinner } from 'spin.js';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import {
  faBackward, faForward, faGripHorizontal, faList, faMusic, faPause,
  faPlay, faRandom, faVolumeDown, faVolumeMute, faVolumeOff, faVolumeUp,
} from '@fortawesome/free-solid-svg-icons';
import BlnPlayer from './bln_player';

const Cookies = require('js-cookie');
const noUiSlider = require('nouislider');

require('spin.js/spin.css');
require('nouislider/distribute/nouislider.css');

const playerCls = 'navbar navbar-dark navbar-expand bg-secondary fixed-bottom';
const playerHtml = `
  <div class="container">
    <div>
      <div class="row d-none d-sm-flex" id="playdisplay">
        <div>
          <div id="playart"><span class="fa fa-fw fa-music"></span></div>
        </div>
        <div class="pl-4">
          <div class="row" id="playtrk"></div>
          <div class="row" id="playrel"></div>
        </div>
      </div>
    </div>
    <ul class="navbar-nav">
      <li class="nav-item dropup">
        <a href="#" class="nav-link dropdown-toggle" data-toggle="dropdown">
          <span class="fa fa-fw fa-list"></span></a>
        <div id="playbox" class="dropdown-menu p-0">
          Select Playlist: <select id="playsel"></select>

          <table class="table table-bordered table-hover table-sm small">
            <thead class="thead-dark">
              <tr><th>Track</th></tr>
            </thead>
            <tbody id="playlist"></tbody>
          </table>
        </div>
      </li>
      <li class="nav-item">
        <a id="shuffle" href="#" class="nav-link">
          <span class="fa fa-fw fa-random"></span></a></li>
      <li class="nav-item">
        <a id="prev" href="#" class="nav-link">
          <span class="fa fa-fw fa-lg fa-backward"></span></a></li>
      <li class="nav-item">
        <a id="pause" href="#" class="nav-link">
          <span class="fa fa-fw fa-lg fa-play"></span></a></li>
      <li class="nav-item">
        <a id="next" href="#" class="nav-link">
          <span class="fa fa-fw fa-lg fa-forward"></span></a></li>
      <li class="nav-item dropup" id="volgrp">
        <a href="#" class="nav-link dropdown-toggle" data-toggle="dropdown">
          <span class="fa fa-fw fa-volume-up"></span></a>
        <div class="dropdown-menu bg-secondary p-1">
          <div id="vol" class="noUi-target noUi-rtl noUi-vertical"></div>
        </div>
      </li>
    </ul>
  </div>
`;

/** MusicControl handles UI interactions to control a BlnPlayer. */
class MusicControl {
  constructor(opts) {
    const o = opts || {};

    this.apiKey = o.apiKey;
    this.apiSecret = o.apiSecret;
    this.eventsUrl = o.eventsUrl;
    this.sourceUrl = o.sourceUrl;

    this.elPlayer = null;
    this.elArt = null;
    this.elBox = null;
    this.elList = null;
    this.elPlaySel = null;
    this.elTrk = null;
    this.elRel = null;
    this.elShuffle = null;
    this.elPrev = null;
    this.elPause = null;
    this.elNext = null;
    this.elVol = null;
    this.elVolGrp = null;
    this.elVolSel = null;
    this.elFoot = null;
    this.elSpacer = null;

    this.player = null;
    this.spinner = null;
    this.userAgent = navigator.userAgent;
  }

  get isAndroid() {
    return /(android)/i.test(this.userAgent);
  }

  get isIos() {
    return (/iPad|iPhone|iPod/.test(this.userAgent) && !window.MSStream);
  }

  get isMobile() {
    return this.isAndroid || this.isIos;
  }

  start() {
    this.player = new BlnPlayer({
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      autoLoop: true,
      eventsUrl: this.eventsUrl,
      html5: !this.isAndroid,
      onLoad: this.load.bind(this),
      onPlay: this.refresh.bind(this),
      onUpdate: this.refresh.bind(this),
      sourceUrl: this.sourceUrl,
    });

    this.player.load();
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
      faBackward, faForward, faGripHorizontal, faList, faMusic, faPause,
      faPlay, faRandom, faVolumeDown, faVolumeMute, faVolumeOff, faVolumeUp,
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

    if (!this.elArt) this.elArt = document.getElementById('playart');
    if (!this.elBox) this.elBox = document.getElementById('playbox');
    if (!this.elList) this.elList = document.getElementById('playlist');
    if (!this.elPlaySel) this.elPlaySel = document.getElementById('playsel');
    if (!this.elTrk) this.elTrk = document.getElementById('playtrk');
    if (!this.elRel) this.elRel = document.getElementById('playrel');
    if (!this.elShuffle) {
      this.elShuffle = document.getElementById('shuffle');
      this.elShuffle.addEventListener('click', this.musicShuffle.bind(this));
    }
    if (!this.elPrev) {
      this.elPrev = document.getElementById('prev');
      this.elPrev.addEventListener('click', this.musicPrev.bind(this));
    }
    if (!this.elPause) {
      this.elPause = document.getElementById('pause');
      this.elPause.addEventListener('click', this.musicPause.bind(this));
    }
    if (!this.elNext) {
      this.elNext = document.getElementById('next');
      this.elNext.addEventListener('click', this.musicNext.bind(this));
    }
    if (!this.elVolGrp) this.elVolGrp = document.getElementById('volgrp');
    if (!this.elVolSel) this.elVolSel = this.elVolGrp.firstElementChild;
    if (!this.elVol) this.volumeLoad();

    this.elFoot = document.getElementById('foot');
    if (this.elFoot) this.elFoot.className = 'text-muted pb-2 mb-5';
    this.elSpacer = document.getElementById('spacer');
    if (this.elSpacer) this.elSpacer.className = 'mb-5 pb-3';

    if (!this.spinner) {
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
    }

    MusicControl.elTracks.forEach((item) => {
      const elTrack = item;
      elTrack.className = 'track loaded';

      const track = this.player.tracks[elTrack.dataset.id];
      if (!track) return;

      elTrack.addEventListener('click', () => this.player.play(track));

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

    this.elPlaySel.addEventListener('change', () => {
      this.player.selectPlaylist(parseInt(this.elPlaySel.value, 10));
    });

    this.elPlayer.style.display = 'block';
    this.refresh();
  }

  volumeLoad() {
    // No volume control on mobile; users have volume rocker instead
    if (this.isMobile) {
      this.elVolGrp.style.display = 'none';
      return;
    }

    let vol = Cookies.get('volume');
    if (vol) vol = parseInt(vol, 10);
    else vol = 100;
    this.volumeApply(vol);

    this.elVol = document.getElementById('vol');
    this.elVol.parentElement.style.minWidth = '18px';
    this.elVol.style.height = '10em';
    noUiSlider.create(this.elVol, {
      start: [this.player.vol * 100],
      connect: [true, false],
      orientation: 'vertical',
      direction: 'rtl',
      range: {
        min: 0,
        max: 100,
      },
    });
    this.elVol.noUiSlider.on('set', this.volumeSet.bind(this));
  }

  volumeSet(values, handle) {
    const vol = parseInt(values[handle], 10);
    Cookies.set('volume', vol);
    this.volumeApply(vol);
  }

  volumeApply(vol) {
    this.player.volume(vol * 0.01);

    // Update the icon based on the current status.
    const icon = (vol > 0) ? 'fa-volume-up' : 'fa-volume-mute';
    this.elVolSel.innerHTML = `<span class="fa fa-fw ${icon}"></span>`;
  }

  /**
   * Refresh the UI to reflect the current player state.
   */
  refresh() {
    const { track, release } = this.player;

    MusicControl.elTracks.forEach((item) => {
      const elTrack = item;
      if (this.player.isPlaying && (elTrack.dataset.id === track.id)) {
        elTrack.className = 'track loaded playing';
      } else {
        elTrack.className = 'track loaded';
      }
    });

    const opts = [];
    this.player.playlists.forEach((playlist) => {
      opts.push(`<option value="${playlist.id}">${playlist.title}</option>`);
    });
    this.elPlaySel.innerHTML = opts.join('');

    const rows = [];
    this.player.playlist.forEach((trackId) => {
      const aTrack = this.player.tracks[trackId];
      let kls = '';
      if (track.id === aTrack.id) kls = 'class="table-active"';
      rows.push(`<tr data-id="${aTrack.id}" ${kls}><td>`
                + `${aTrack.artist} - ${aTrack.title}</td></tr>`);
    });
    this.elList.innerHTML = rows.join('');

    const trs = Array.from(this.elList.getElementsByTagName('tr'));
    trs.forEach((elTr) => {
      const aTrack = this.player.tracks[elTr.dataset.id];
      elTr.addEventListener('click', () => this.player.play(aTrack));
    });

    this.elArt.style.height = '40px';
    this.elArt.style.width = '40px';
    this.elArt.style.border = '1px solid #e9ecef';
    this.elArt.innerHTML = `<a href="${release.url}">`
      + `<img src="${release.image}" alt="Cover" width="38" height="38"/></a>`;
    this.elBox.style.left = '-1em';
    this.elBox.style.maxHeight = '75vh';
    this.elBox.style.maxWidth = '100%';
    this.elBox.style.minWidth = '19em';
    this.elBox.style.overflowX = 'hidden';
    this.elTrk.style.fontSize = '0.8rem';
    this.elTrk.style.fontWeight = 'bold';
    this.elTrk.innerHTML = track.title;
    this.elRel.style.fontSize = '0.8rem';
    this.elRel.innerHTML = `<a href="${release.url}">`
      + `${track.artist} - ${release.title}</a>`;
    this.elRel.firstElementChild.style.textDecoration = 'none';
    this.elRel.firstElementChild.style.color = 'black';

    if (this.player.isLoading) {
      if (!this.spinner.el) {
        this.elPause.innerHTML = '<span style="position: relative;">'
          + '<span class="fa fa-fw fa-lg fa-pause invisible"></span></span>';
        this.spinner.spin(this.elPause.firstElementChild);
      }
    } else if (this.player.isPlaying) {
      if (this.spinner.el) this.spinner.stop();
      this.elPause.innerHTML = '<span class="fa fa-fw fa-lg fa-pause"></span>';
    } else {
      if (this.spinner.el) this.spinner.stop();
      this.elPause.innerHTML = '<span class="fa fa-fw fa-lg fa-play"></span>';
    }
  }

  step() {
    if (!this.howl) {
      return;
    }

    // Update position of seek bar
    // https://howlerjs.com/assets/howler.js/examples/player/

    if (this.howl.playing()) {
      requestAnimationFrame(this.step.bind(this));
    }
  }

  musicPause(event) {
    this.player.pause();

    if (event) event.preventDefault();
    return false;
  }

  musicShuffle(event) {
    this.player.shuffle();

    if (event) event.preventDefault();
    return false;
  }

  musicPrev(event) {
    this.player.prev();

    if (event) event.preventDefault();
    return false;
  }

  musicNext(event) {
    this.player.next();

    if (event) event.preventDefault();
    return false;
  }
}

export default MusicControl;
