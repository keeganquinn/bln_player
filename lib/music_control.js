import { Spinner } from 'spin.js';
import BlnPlayer from './bln_player';

const Cookies = require('js-cookie');
const noUiSlider = require('nouislider');

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
          <span id="volsel" class="fa fa-lg fa-volume-up"></span></a>
        <div class="dropdown-menu bg-secondary p-1">
          <div id="vol" class="noUi-target noUi-rtl noUi-vertical"></div>
        </div>
      </li>
    </ul>
  </div>
`;

/** MusicControl handles UI interactions to control a BlnPlayer. */
class MusicControl {
  constructor() {
    this.elPlayer = null;
    this.elPlayArt = null;
    this.elPlayTrk = null;
    this.elPlayRel = null;
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

  start(dataUrl) {
    this.player = new BlnPlayer({
      onLoad: this.load.bind(this),
      onPlay: this.step.bind(this),
      onUpdate: this.refresh.bind(this),
      sourceUrl: dataUrl,
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
    if (!this.player.playlist) return;

    if (!this.elPlayer) {
      this.elPlayer = document.createElement('div');
      this.elPlayer.id = 'player';
      this.elPlayer.className = 'navbar navbar-dark navbar-expand bg-secondary fixed-bottom';
      this.elPlayer.innerHTML = playerHtml;
      this.elPlayer.dataset.turbolinksPermanent = '';
    }
    this.elPlayer.style.display = 'none';
    document.body.appendChild(this.elPlayer);

    if (!this.elPlayArt) this.elPlayArt = document.getElementById('playart');
    if (!this.elPlayTrk) this.elPlayTrk = document.getElementById('playtrk');
    if (!this.elPlayRel) this.elPlayRel = document.getElementById('playrel');
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
    if (!this.elVolSel) this.elVolSel = document.getElementById('volsel');
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

    this.elPlayer.style.display = 'block';
    this.refresh();
  }

  volumeLoad() {
    let vol = Cookies.get('volume');
    if (vol) vol = parseInt(vol, 10);
    if (!vol || vol > 100 || vol < 0) {
      vol = 100;
    }
    this.player.volume(vol * 0.01);

    // No volume control on mobile; users have volume rocker instead
    if (this.isMobile) {
      this.elVolGrp.style.display = 'none';
      return;
    }

    this.elVol = document.getElementById('vol');
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
    this.player.volume(vol * 0.01);
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

    this.elPlayArt.innerHTML = `<img src="${release.image}" alt="Cover">`;
    this.elPlayTrk.innerHTML = track.title;
    this.elPlayRel.innerHTML = `${track.artist} - ${release.title}`;

    if (this.player.isLoading) {
      if (!this.spinner.el) {
        this.elPause.innerHTML = '<div style="position: relative;">'
          + '<span class="fa fa-fw fa-lg"></span></div>';
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
