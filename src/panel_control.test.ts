import PanelControl from './panel_control';

window.HTMLMediaElement.prototype.load = () => { /* do nothing */ };
window.HTMLMediaElement.prototype.play = async () => { /* do nothing */ };

const releases = [{
  id: 1,
  title: 'Release Title',
  url: 'https://basslin.es/',
  image: 'https://basslin.es/kQ.jpg',
  tracks: [{
    id: 1,
    releaseId: 1,
    artist: 'An Artist',
    title: 'Track 1',
    m4a: '/track1.m4a',
    mp3: '/track1.mp3',
    webm: '/track1.webm',
  }, {
    id: 2,
    releaseId: 1,
    artist: 'An Artist',
    title: 'Track 2',
    m4a: '/track2.m4a',
    mp3: '/track2.mp3',
    webm: '/track2.webm',
  }],
}];

const playlists = [{
  id: 1,
  code: 'all',
  title: 'All Releases',
  active: true,
  autoShuffle: false,
  tracks: [1, 2],
}];

describe('PanelControl', () => {
  let panelControl: PanelControl;
  beforeEach(() => {
    panelControl = new PanelControl({
      eventsUrl: 'https://basslines-staging.quinn.tk/ahoy/events',
    });
  });

  it('is not ready until loaded', () => {
    expect(panelControl.player.track).toBeFalsy();
  });

  describe('loaded', () => {
    beforeEach(() => {
      panelControl.start();
      panelControl.player.loadReleases(releases);
      panelControl.player.loadPlaylists(playlists);
      panelControl.player.ready();
    });

    it('has references', () => {
      expect(panelControl.elVol).toBeTruthy();
    });
  });
});
