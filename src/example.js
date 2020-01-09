import { MusicControl, PanelControl } from './index';

require('bootstrap/dist/css/bootstrap.css');
require('bootstrap/dist/js/bootstrap.js');

const html = `
  <div class="container p-3">
    <a href="#" class="btn btn-secondary" id="startMusicControl">
      Start MusicControl</a>
    <a href="#" class="btn btn-secondary" id="startPanelControl">
      Start PanelControl</a>
    <div id="panelTarget"></div>
  </div>
`;

function startMusicControl(event) {
  const musicControl = new MusicControl();
  musicControl.start();
  musicControl.load();

  if (event) event.preventDefault();
  return false;
}

function startPanelControl(event) {
  const elPanelTarget = document.getElementById('panelTarget');
  const panelControl = new PanelControl({
    autoPlay: true,
    autoShuffle: true,
    elTarget: elPanelTarget,
  });
  panelControl.start();
  panelControl.load();

  if (event) event.preventDefault();
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = html;

  const elStartMusicControl = document.getElementById('startMusicControl');
  elStartMusicControl.addEventListener('click', startMusicControl);

  const elStartPanelControl = document.getElementById('startPanelControl');
  elStartPanelControl.addEventListener('click', startPanelControl);
});
