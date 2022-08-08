import 'bootstrap';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { MusicControl, PanelControl, ReactControl } from './index';

const html = `
  <div class="container p-3">
    <a href="#" class="btn btn-secondary" id="startMusicControl">
      Start MusicControl</a>
    <a href="#" class="btn btn-secondary" id="startPanelControl">
      Start PanelControl</a>
    <a href="#" class="btn btn-secondary" id="startReactControl">
      Start ReactControl</a>
    <div id="panelTarget"></div>
    <div id="reactTarget"></div>
  </div>
`;

function startMusicControl(event: Event) {
    const musicControl = new MusicControl({
        apiKey: 'example_MusicControl',
        eventsUrl: 'https://basslines-staging.quinn.tk/ahoy/events',
    });
    musicControl.start();
    musicControl.load();

    if (event) event.preventDefault();
    return false;
}

function startPanelControl(event: Event) {
    const elPanelTarget = document.getElementById('panelTarget') as HTMLElement;
    const panelControl = new PanelControl({
        apiKey: 'example_PanelControl',
        autoLoop: true,
        autoPlay: true,
        autoShuffle: true,
        defaultPlaylist: 'electronic',
        defaultVol: 50,
        elTarget: elPanelTarget,
        eventsUrl: 'https://basslines-staging.quinn.tk/ahoy/events',
    });
    panelControl.start();
    panelControl.load();

    if (event) event.preventDefault();
    return false;
}

function startReactControl(event: Event) {
    const root = ReactDOM.createRoot(
        document.getElementById('reactTarget') as HTMLElement
    );

    let player: ReactControl;
    const reactElement = React.createElement(ReactControl, {
        onCreate: (instance) => {
            player = instance;
        }
    }, null);
    root.render(reactElement);

    // Example of Turbo integration
    document.addEventListener('turbo:load', () => {
        if (player) player.pageAttach();
    });

    if (event) event.preventDefault();
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML = html;

    const elStartMusicControl = document.getElementById('startMusicControl') as HTMLElement;
    elStartMusicControl.addEventListener('click', startMusicControl);

    const elStartPanelControl = document.getElementById('startPanelControl') as HTMLElement;
    elStartPanelControl.addEventListener('click', startPanelControl);

    const elStartReactControl = document.getElementById('startReactControl') as HTMLElement;
    elStartReactControl.addEventListener('click', startReactControl);
});
