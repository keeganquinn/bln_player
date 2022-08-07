import BlnPlayer from './bln_player';

import React from 'react';
import Cookies from 'js-cookie';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward';
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward';
import { faGripHorizontal } from '@fortawesome/free-solid-svg-icons/faGripHorizontal';
import { faList } from '@fortawesome/free-solid-svg-icons/faList';
import { faMusic } from '@fortawesome/free-solid-svg-icons/faMusic';
import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faRandom } from '@fortawesome/free-solid-svg-icons/faRandom';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner'
import { faVolumeDown } from '@fortawesome/free-solid-svg-icons/faVolumeDown';
import { faVolumeMute } from '@fortawesome/free-solid-svg-icons/faVolumeMute';
import { faVolumeOff } from '@fortawesome/free-solid-svg-icons/faVolumeOff';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons/faVolumeUp';

export interface ReactControlProps {
    id?: string,
    defaultVol?: number
}

export interface ReactControlState {
    active?: boolean,
    loading?: boolean,
    playing?: boolean,
    volume?: number
}

export class ReactControl extends React.Component {
    playerId: string;
    defaultVol: number;

    /** Controlled player instance. @internal */
    player: BlnPlayer;

    state: ReactControlState = {};
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

    constructor(props: ReactControlProps) {
        super(props);

        this.playerId = props.id || 'aplayer123';
        this.defaultVol = props.defaultVol || 100;

        this.tick = this.tick.bind(this);
        this.playlistActivate = this.playlistActivate.bind(this);
        this.trackActivate = this.trackActivate.bind(this);
        this.volumeSet = this.volumeSet.bind(this);

        this.player = new BlnPlayer({
            autoLoop: true,
            html5: !ReactControl.isAndroid,
            onLoad: this.tick,
            onPlay: this.tick,
            onUpdate: this.tick
        });

        this.shuffle = this.player.shuffle.bind(this.player);
        this.prev = this.player.prev.bind(this.player);
        this.pause = this.player.pause.bind(this.player);
        this.next = this.player.next.bind(this.player);
    }

    componentDidMount() {
        this.volumeLoad();
        this.player.load();
    }

    tick() {
        this.setState({
            active: true,
            loading: this.player.isLoading,
            playing: this.player.isPlaying
        });
    }

    render() {
        if (!this.state.active) return <div></div>;

        const menuStyle = {
            left: '-1em',
            maxHeight: '75vh',
            maxWidth: '100%',
            minWidth: '19em',
            'overflow-x': 'hidden'
        }

        return <div className="navbar navbar-dark navbar-expand bg-secondary fixed-bottom">
            <div className="container">
                <div className="d-none d-sm-flex">
                    <div>{this.artwork()}</div>
                    <div className="ps-3">
                        <div>{this.track()}</div>
                        <div>{this.release()}</div>
                    </div>
                </div>
                <ul className="navbar-nav">
                    <li className="nav-item dropup">
                        <a className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                            <FontAwesomeIcon icon={faList} size="lg" fixedWidth />
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
                            <FontAwesomeIcon icon={faRandom} size="lg" fixedWidth />
                        </a>
                    </li>
                    <li className="nav-item">
                        <a onClick={this.prev} className="nav-link">
                            <FontAwesomeIcon icon={faBackward} size="lg" fixedWidth />
                        </a>
                    </li>
                    <li className="nav-item">
                        <a onClick={this.pause} className="nav-link">{this.pauseSpan()}</a>
                    </li>
                    <li className="nav-item">
                        <a onClick={this.next} className="nav-link">
                            <FontAwesomeIcon icon={faForward} size="lg" fixedWidth />
                        </a>
                    </li>
                    <li className="nav-item dropup">
                        <a className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                            <FontAwesomeIcon icon={faVolumeUp} size="lg" fixedWidth />
                        </a>
                        {this.volumeControl()}
                    </li>
                </ul>
            </div>
        </div>;
    }

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
                <img src={release.image} alt="Cover" width="38" height="38"/>
            </a>;
        } else {
            content = <FontAwesomeIcon icon={faMusic} size="lg" fixedWidth />;
        }
        return <div style={artStyle}>{content}</div>;
    }

    track() {
        return this.player.track?.title || '-';
    }

    release() {
        return this.player.release?.title || '-';
    }

    playlistSelect() {
        const playlists: React.ReactElement[] = [];

        this.player.playlists.forEach((playlist) => {
            if (!playlist.active) return;
            playlists.push(<option value={playlist.id}>{playlist.title}</option>);
        });

        return <select onChange={this.playlistActivate}>{playlists}</select>;
    }

    playlistActivate(event: React.ChangeEvent<HTMLSelectElement>) {
        const playlistId = parseInt(event.target.value, 10);
        this.player.selectPlaylist(playlistId);
        if (this.player.track) this.player.play(this.player.track);
    }

    trackTbody() {
        const tracks: React.ReactElement[] = [];

        this.player.playlist.forEach((trackId) => {
            const aTrack = this.player.tracks[trackId];
            if (!aTrack) return;
            const kls = aTrack.id === this.player.track?.id ? 'table-active' : '';
            tracks.push(<tr data-id={aTrack.id} className={kls} onClick={this.trackActivate}>
                <td>{aTrack.artist} - {aTrack.title}</td>
            </tr>);
        });

        return <tbody>{tracks}</tbody>;
    }

    trackActivate(event: React.MouseEvent<HTMLTableRowElement>) {
        const id = parseInt(event.currentTarget.getAttribute('data-id') as string, 10);
        const track = this.player.tracks[id];
        this.player.play(track);
    }

    pauseSpan() {
        if (this.state.loading) {
            return <FontAwesomeIcon icon={faSpinner} spin size="lg" fixedWidth />;
        } else if (this.state.playing) {
            return <FontAwesomeIcon icon={faPause} size="lg" fixedWidth />;
        } else {
            return <FontAwesomeIcon icon={faPlay} size="lg" fixedWidth />;
        }
    }

    volumeLoad() {
        let vol = this.defaultVol;
        const volCookie = Cookies.get('bln_volume');
        if (volCookie) vol = parseInt(volCookie, 10);
        this.volumeApply(vol);
    }

    volumeControl() {
        if (ReactControl.isMobile) return <div></div>;

        return <div className="dropdown-menu dropdown-menu-end bg-secondary p-1">
            <div>
                <input type="range" value={this.state.volume} onChange={this.volumeSet} />
            </div>
        </div>;
    }

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
