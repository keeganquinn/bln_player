import 'bootstrap/js/dist/button';
import 'bootstrap/js/dist/dropdown';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { MusicPlayer, PanelControl } from './index';

let root: ReactDOM.Root;
let player: MusicPlayer;
const setPlayer = (instance: MusicPlayer) => {
    player = instance;
};

// Example of Turbo integration
document.addEventListener('turbo:load', () => {
    if (player) player.pageAttach();
});

function startMusicPlayer(event: React.MouseEvent<HTMLAnchorElement>) {
    root.render(<MusicPlayer onCreate={setPlayer} />);

    if (event) event.preventDefault();
    return false;
}

function startPanelControl(event: React.MouseEvent<HTMLAnchorElement>) {
    const elPanelTarget = document.getElementById('panel') as HTMLElement;
    const panelControl = new PanelControl({
        apiKey: 'example_PanelControl',
        autoLoop: true,
        autoPlay: true,
        autoShuffle: true,
        defaultPlaylist: 'electronic',
        defaultVol: 50,
        elTarget: elPanelTarget,
    });
    panelControl.start();
    panelControl.load();

    if (event) event.preventDefault();
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    root = ReactDOM.createRoot(document.body);

    root.render(<div className="container p-3">
        <a onClick={startMusicPlayer} className="btn btn-secondary">Start MusicPlayer</a>
        <a onClick={startPanelControl} className="btn btn-secondary">Start PanelControl</a>
        <div id="panel"></div>
    </div>);
});
