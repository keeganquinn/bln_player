import { PanelControl, PanelControlOptions } from './panel_control';

import { Spinner } from 'spin.js';
import Cookies from 'js-cookie';
import noUiSlider from 'nouislider';

import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward';
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward';
import { faGripHorizontal } from '@fortawesome/free-solid-svg-icons/faGripHorizontal';
import { faList } from '@fortawesome/free-solid-svg-icons/faList';
import { faMusic } from '@fortawesome/free-solid-svg-icons/faMusic';
import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faRandom } from '@fortawesome/free-solid-svg-icons/faRandom';
import { faVolumeDown } from '@fortawesome/free-solid-svg-icons/faVolumeDown';
import { faVolumeMute } from '@fortawesome/free-solid-svg-icons/faVolumeMute';
import { faVolumeOff } from '@fortawesome/free-solid-svg-icons/faVolumeOff';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons/faVolumeUp';

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

/** MusicControl provides a Bootstrap-based UI for {@link BlnPlayer}. */
export class MusicControl extends PanelControl {
    /** UI element: bln_player div @internal @hidden */
    elPlayer: HTMLElement | null | undefined;
    /** UI element: player_art div @internal @hidden */
    elArt: HTMLElement | null | undefined;
    /** UI element: player_box div @internal @hidden */
    elBox: HTMLElement | null | undefined;
    /** UI element: player_list tbody @internal @hidden */
    elList: HTMLElement | null | undefined;
    /** UI element: player_sel select @internal @hidden */
    elSel: HTMLInputElement | null | undefined;
    /** UI element: player_trk div @internal @hidden */
    elTrk: HTMLElement | null | undefined;
    /** UI element: player_rel div @internal @hidden */
    elRel: HTMLElement | null | undefined;
    /** UI element: player_shuffle a @internal @hidden */
    elShuffle: HTMLElement | null | undefined;
    /** UI element: player_prev a @internal @hidden */
    elPrev: HTMLElement | null | undefined;
    /** UI element: player_pause a @internal @hidden */
    elPause: HTMLElement | null | undefined;
    /** UI element: player_next a @internal @hidden */
    elNext: HTMLElement | null | undefined;
    /** UI element: player_vol div @internal @hidden */
    elVol: HTMLElement | null | undefined;
    /** UI element: player_vgrp li @internal @hidden */
    elVolGrp: HTMLElement | null | undefined;
    /** UI element: player_vgrp li first child @internal @hidden */
    elVolSel: HTMLElement | null | undefined;
    /** UI element: foot div @internal @hidden */
    elFoot: HTMLElement | null | undefined;
    /** UI element: spacer div @internal @hidden */
    elSpacer: HTMLElement | null | undefined;

    /** Spinner instance. @internal */
    spinner: Spinner;
    /** User-Agent string. @internal */
    userAgent: string;

    /**
     * Create a new music player UI.
     *
     * @param opts configuration options
     */
    constructor(opts: PanelControlOptions) {
        super(opts);

        this.player.opts.autoLoop = true;
        this.player.opts.html5 = !this.isAndroid;
        this.player.opts.onLoad = this.load.bind(this);
        this.player.opts.onPlay = this.refresh.bind(this);
        this.player.opts.onUpdate = this.refresh.bind(this);

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

    /**
     * Return `true` if running on an Android device or `false` otherwise.
     *
     * @internal @hidden
     */
    get isAndroid() {
        return /(android)/i.test(this.userAgent);
    }

    /**
     * Return `true` if running on an iOS device or `false` otherwise.
     *
     * @internal @hidden
     */
    get isIos() {
        return /iPad|iPhone|iPod/.test(this.userAgent);
    }

    /**
     * Return `true` if running on a mobile device or `false` otherwise.
     *
     * @internal @hidden
     */
    get isMobile() {
        return this.isAndroid || this.isIos;
    }

    /**
     * Locate playlist elements in the current page. @internal @hidden
     */
    static get elPlaylist() {
        return document.getElementById('playlist');
    }

    /**
     * Locate track elements in the current page. @internal @hidden
     */
    static get elTracks() {
        return Array.from(document.getElementsByClassName('track'));
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
            this.elShuffle.addEventListener('click', this.shuffle.bind(this));
        }

        if (!this.elPrev) {
            this.elPrev = document.getElementById('player_prev');
        }
        if (this.elPrev) {
            this.elPrev.addEventListener('click', this.prev.bind(this));
        }

        if (!this.elPause) {
            this.elPause = document.getElementById('player_pause');
        }
        if (this.elPause) {
            this.elPause.addEventListener('click', this.pause.bind(this));
        }

        if (!this.elNext) {
            this.elNext = document.getElementById('player_next');
        }
        if (this.elNext) {
            this.elNext.addEventListener('click', this.next.bind(this));
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

    /**
     * Activate a Playlist based on an identifier found in the HTML page.
     *
     * @internal @hidden
     */
    activatePlaylist() {
        if (MusicControl.elPlaylist) {
            const idx = parseInt(MusicControl.elPlaylist.getAttribute('data-id') as string, 10);
            this.player.selectPlaylist(idx);
        }
    }

    /**
     * Load the volume control, including any previous state settings which
     * may be stored in cookies.
     *
     * @internal @hidden
     */
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

    /**
     * Apply a given volume setting.
     *
     * @param vol new volume level
     *
     * @internal @hidden
     */
    volumeApply(vol: number) {
        super.volumeApply(vol);

        // Update the icon based on the current status.
        const icon = (vol > 0) ? 'fa-volume-up' : 'fa-volume-mute';
        if (this.elVolSel) {
            this.elVolSel.innerHTML = `<span class="fa fa-fw ${icon}"></span>`;
        }
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
}

export default MusicControl;
