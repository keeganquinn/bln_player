import BlnPlayer from './bln_player';

import React from 'react';
import Cookies from 'js-cookie';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward';
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward';
import { faList } from '@fortawesome/free-solid-svg-icons/faList';
import { faMusic } from '@fortawesome/free-solid-svg-icons/faMusic';
import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faRandom } from '@fortawesome/free-solid-svg-icons/faRandom';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import { faVolumeMute } from '@fortawesome/free-solid-svg-icons/faVolumeMute';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons/faVolumeUp';

/**
 * Properties of {@link MusicPlayer}.
 */
export interface MusicPlayerProps {
    defaultVol?: number;
    onCreate?: (instance: MusicPlayer) => void;
    /** Remote API endpoint for data bundle source. */
    sourceUrl?: string;
}

/**
 * State of {@link MusicPlayer}.
 *
 * @internal
 */
export interface MusicPlayerState {
    active?: boolean;
    loading?: boolean;
    playing?: boolean;
    volume?: number;
}

/**
 * MusicPlayer is a React component which provides streaming music
 * playback with a Bootstrap footer UI.
 */
export class MusicPlayer extends React.Component<MusicPlayerProps> {
    defaultVol: number;

    /** Controlled player instance. @internal */
    player: BlnPlayer;

    state: MusicPlayerState = {};
    shuffle: BlnPlayer['shuffle'];
    prev: BlnPlayer['prev'];
    pause: BlnPlayer['pause'];
    next: BlnPlayer['next'];

    /**
     * Return `true` if running on an Android device or `false` otherwise.
     *
     * @internal @hidden
     */
    static get isAndroid() {
        return /(android)/i.test(navigator.userAgent);
    }

    /**
     * Return `true` if running on an iOS device or `false` otherwise.
     *
     * @internal @hidden
     */
    static get isIos() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    /**
     * Return `true` if running on a mobile device or `false` otherwise.
     *
     * @internal @hidden
     */
    static get isMobile() {
        return this.isAndroid || this.isIos;
    }

    /**
     * Create a new music player UI.
     *
     * @param props properties
     */
    constructor(props: MusicPlayerProps) {
        super(props);

        this.defaultVol = props.defaultVol || 100;

        this.ready = this.ready.bind(this);
        this.tick = this.tick.bind(this);
        this.playlistActivate = this.playlistActivate.bind(this);
        this.trackActivate = this.trackActivate.bind(this);
        this.volumeSet = this.volumeSet.bind(this);

        this.player = new BlnPlayer({
            autoLoop: true,
            html5: !MusicPlayer.isAndroid,
            onLoad: this.ready,
            onPlay: this.tick,
            onUpdate: this.tick
        });

        this.shuffle = this.player.shuffle.bind(this.player);
        this.prev = this.player.prev.bind(this.player);
        this.pause = this.player.pause.bind(this.player);
        this.next = this.player.next.bind(this.player);

        if (props.onCreate) {
            props.onCreate(this);
        }
    }

    /**
     * Start the player engine when the component is mounted.
     *
     * This method is called by the React renderer.
     *
     * @internal
     */
    componentDidMount() {
        this.volumeLoad();
        this.player.load();
    }

    /**
     * Refresh the UI and attach to the current pgae when the
     * player engine is ready.
     *
     * This method is used as a callback for the
     * {@link BlnPlayerOptions.onLoad} hook.
     *
     * @internal @hidden
     */
    ready() {
        this.tick();
        this.pageAttach();
    }

    /**
     * Refresh the UI with the current player state.
     *
     * This method is used as a callback for the
     * {@link BlnPlayerOptions.onPlay} and
     * {@link BlnPlayerOptions.onUpdate} hooks.
     *
     * @internal @hidden
     */
    tick() {
        this.setState({
            active: true,
            loading: this.player.isLoading,
            playing: this.player.isPlaying
        });
    }

    /**
     * Draw the UI.
     *
     * This method is called by the React renderer.
     *
     * @returns element tree to be rendered
     *
     * @internal
     */
    render() {
        if (!this.state.active) return <div></div>;

        /* eslint-disable  @typescript-eslint/prefer-as-const */
        const menuStyle = {
            left: '-1em',
            maxHeight: '75vh',
            maxWidth: '100%',
            minWidth: '19em',
            overflowX: 'hidden' as 'hidden'
        }

        return <div className="navbar navbar-dark navbar-expand bg-secondary fixed-bottom">
            <div className="container">
                <div className="d-none d-sm-flex">
                    <div>{this.artwork()}</div>
                    <div className="ps-3">
                        {this.track()}
                        {this.release()}
                    </div>
                </div>
                <ul className="navbar-nav">
                    <li className="nav-item dropup">
                        <a className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                            <FontAwesomeIcon icon={faList} size="lg" fixedWidth aria-label="Tracks and Playlists" aria-hidden="false" />
                        </a>
                        <div className="dropdown-menu p-0" style={menuStyle}>
                            Select Playlist: {this.playlistSelect()}

                            <table className="table table-bordered table-hover table-sm small">
                                <thead className="thead-dark">
                                    <tr><th>Track</th></tr>
                                </thead>
                                {this.trackTbody()}
                            </table>
                        </div>
                    </li>
                    <li className="nav-item">
                        <a onClick={this.shuffle} className="nav-link">
                            <FontAwesomeIcon icon={faRandom} size="lg" fixedWidth aria-label="Shuffle" aria-hidden="false" />
                        </a>
                    </li>
                    <li className="nav-item">
                        <a onClick={this.prev} className="nav-link">
                            <FontAwesomeIcon icon={faBackward} size="lg" fixedWidth aria-label="Previous Track" aria-hidden="false" />
                        </a>
                    </li>
                    <li className="nav-item">
                        <a onClick={this.pause} className="nav-link">{this.pauseSpan()}</a>
                    </li>
                    <li className="nav-item">
                        <a onClick={this.next} className="nav-link">
                            <FontAwesomeIcon icon={faForward} size="lg" fixedWidth aria-label="Next Track" aria-hidden="false" />
                        </a>
                    </li>
                    {this.volumeItem()}
                </ul>
            </div>
        </div>;
    }

    /**
     * Locate playlist elements in the current page. @internal @hidden
     */
    static get pagePlaylist() {
        return document.getElementById('playlist');
    }

    /**
     * Locate track elements in the current page. @internal @hidden
     */
    static get pageTracks() {
        return Array.from(document.getElementsByClassName('track'));
    }

    /**
     * Attach to the current page, adding controls for a Playlist
     * a set of Tracks based on DOM elements.
     *
     * @internal @hidden
     */
    pageAttach() {
        if (!this.state.playing) this.pageActivatePlaylist();

        MusicPlayer.pageTracks.forEach((item) => {
            const elTrack = item as HTMLElement;
            elTrack.className = 'track loaded';

            const idx = parseInt(elTrack.getAttribute('data-id') as string, 10);
            const track = this.player.tracks[idx];
            if (!track) return;

            elTrack.addEventListener('click', () => {
              this.pageActivatePlaylist();
              this.player.play(track);
            });

            Array.from(elTrack.getElementsByTagName('a')).forEach((link) => {
              const elLink = link;
              if (MusicPlayer.isMobile) {
                elLink.style.display = 'none';
              } else {
                elLink.addEventListener('click', (event) => {
                  event.stopPropagation();
                });
              }
            });
        });
    }

    /**
     * Activate the {@link Playlist} from the current page, loading
     * it into the player.
     *
     * @internal @hidden
     */
    pageActivatePlaylist() {
        if (MusicPlayer.pagePlaylist) {
            const idx = parseInt(MusicPlayer.pagePlaylist.getAttribute('data-id') as string, 10);
            this.player.selectPlaylist(idx);
        }
    }

    /**
     * Draw the cover artwork box in the UI.
     *
     * @returns element tree to be rendered
     *
     * @internal @hidden
     */
    artwork() {
        const release = this.player.release;
        const artStyle = {
            height: '40px',
            width: '40px',
            border: '1px solid #e9ecef'
        }

        let content;
        if (release) {
            content = <a href={release.url}>
                <img src={release.image} alt="Cover Artwork" width="38" height="38" aria-hidden="true" />
            </a>;
        } else {
            content = <FontAwesomeIcon icon={faMusic} size="lg" fixedWidth />;
        }
        return <div style={artStyle}>{content}</div>;
    }

    /**
     * Draw the Track title in the UI.
     *
     * @returns element tree to be rendered
     *
     * @internal @hidden
     */
    track() {
        const style = {
            fontSize: '0.8rem',
            fontWeight: 'bold'
        }
        return <div style={style}>{this.player.track?.title || '-'}</div>;
    }

    /**
     * Draw the Release title in the UI.
     *
     * @returns element tree to be rendered
     *
     * @internal @hidden
     */
    release() {
        const track = this.player.track;
        const release = this.player.release;
        if (!track || !release) return '-';

        const style = {
            fontSize: '0.8rem'
        }
        const aStyle = {
            textDecoration: 'none',
            color: 'black'
        }
        return <div style={style}><a href={release.url} style={aStyle}>
            {track.artist} - {release.title}
        </a></div>;
    }

    /**
     * Draw the Playlist select list in the UI.
     *
     * @returns element tree to be rendered
     *
     * @internal @hidden
     */
    playlistSelect() {
        const playlists: React.ReactElement[] = [];

        this.player.playlists.forEach((playlist) => {
            if (!playlist.active) return;
            playlists.push(<option key={playlist.id} value={playlist.id}>{playlist.title}</option>);
        });

        return <select onChange={this.playlistActivate}>{playlists}</select>;
    }

    /**
     * Activate a selected {@link Playlist}, loading it into the player.
     *
     * @internal @hidden
     */
    playlistActivate(event: React.ChangeEvent<HTMLSelectElement>) {
        const playlistId = parseInt(event.target.value, 10);
        this.player.selectPlaylist(playlistId);
        if (this.player.track) this.player.play(this.player.track);
    }

    /**
     * Draw the Track table in the UI.
     *
     * @returns element tree to be rendered
     *
     * @internal @hidden
     */
    trackTbody() {
        const tracks: React.ReactElement[] = [];

        this.player.playlist.forEach((trackId) => {
            const aTrack = this.player.tracks[trackId];
            if (!aTrack) return;
            const kls = aTrack.id === this.player.track?.id ? 'table-active' : '';
            tracks.push(<tr key={aTrack.id} data-id={aTrack.id} className={kls} onClick={this.trackActivate}>
                <td>{aTrack.artist} - {aTrack.title}</td>
            </tr>);
        });

        return <tbody>{tracks}</tbody>;
    }

    /**
     * Activate a selected {@link Track}, loading it into the player.
     *
     * @internal @hidden
     */
    trackActivate(event: React.MouseEvent<HTMLTableRowElement>) {
        const id = parseInt(event.currentTarget.getAttribute('data-id') as string, 10);
        const track = this.player.tracks[id];
        this.player.play(track);
    }

    /**
     * Draw the pause control, play control, or loading spinner in the UI,
     * depending on the current player state.
     *
     * @returns element tree to be rendered
     *
     * @internal @hidden
     */
    pauseSpan() {
        if (this.state.loading) {
            return <FontAwesomeIcon icon={faSpinner} spin size="lg" fixedWidth />;
        } else if (this.state.playing) {
            return <FontAwesomeIcon icon={faPause} size="lg" fixedWidth aria-label="Pause" aria-hidden="false" />;
        } else {
            return <FontAwesomeIcon icon={faPlay} size="lg" fixedWidth aria-label="Play" aria-hidden="false" />;
        }
    }

    /**
     * Load the last stored volume setting, or the default volume setting
     * if none has been stored.
     *
     * @internal @hidden
     */
    volumeLoad() {
        let vol = this.defaultVol;
        const volCookie = Cookies.get('bln_volume');
        if (volCookie) vol = parseInt(volCookie, 10);
        this.volumeApply(vol);
    }

    /**
     * Draw the volume control in the UI.
     *
     * @returns element tree to be rendered
     *
     * @internal @hidden
     */
    volumeItem() {
        if (MusicPlayer.isMobile || this.state.volume === undefined) return;

        const icon = (this.state.volume > 0) ? faVolumeUp : faVolumeMute;

        return <li className="nav-item dropup">
            <a className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                <FontAwesomeIcon icon={icon} size="lg" fixedWidth aria-label="Volume" aria-hidden="false" />
            </a>
            <div className="dropdown-menu dropdown-menu-end bg-secondary p-1">
                <input type="range" value={this.state.volume} onChange={this.volumeSet} />
            </div>
        </li>;
    }

    /**
     * Set the volume to a specific level.
     *
     * @param event change event
     *
     * @internal @hidden
     */
    volumeSet(event: React.ChangeEvent<HTMLInputElement>) {
        const volCookie = event.target.value;
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
        this.setState({volume: vol});
        this.player.volume(vol * 0.01);
    }
}

export default MusicPlayer;
