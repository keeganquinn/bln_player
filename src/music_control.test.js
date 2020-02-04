import MusicControl from './music_control';

window.HTMLMediaElement.prototype.load = () => { /* do nothing */ };
window.HTMLMediaElement.prototype.play = () => { /* do nothing */ };

const page = `
<div id="tk1" class="track" data-id="1">
  <a href="/track1.mp3" id="dl1">DL1</a></div>
<div id="tk2" class="track" data-id="2">
  <a href="/track2.mp3" id="dl2">DL2</a></div>
<div id="tk3" class="track"></div>
<div id="foot"></div>
`;

const releases = [{
  title: 'Release Title',
  tracks: [{
    id: 1,
    m4a: '/track1.m4a',
    mp3: '/track1.mp3',
    webm: '/track1.webm',
  }, {
    id: 2,
    m4a: '/track2.m4a',
    mp3: '/track2.mp3',
    webm: '/track2.webm',
  }],
}];

const playlists = [{
  id: 1,
  code: 'all',
  title: 'All Releases',
  autoShuffle: false,
  tracks: [1, 2],
}];

describe('MusicControl', () => {
  let musicControl;
  beforeEach(() => {
    musicControl = new MusicControl();
  });

  it('is not ready until loaded', () => {
    expect(musicControl.player).toBeFalsy();
  });

  describe('loaded', () => {
    beforeEach(() => {
      document.body.innerHTML = page;
      musicControl.start();
      musicControl.player.loadReleases(releases);
      musicControl.player.loadPlaylists(playlists);
      musicControl.player.ready();
    });

    it('has references', () => {
      expect(musicControl.elVol).toBeTruthy();
    });

    it('displays the current volume', () => {
      expect(musicControl.elVol.noUiSlider.get()).toEqual('100.00');
    });

    it('can change volume', () => {
      musicControl.volumeSet(['90.00'], 0);
      expect(musicControl.player.vol).toEqual(0.9);
    });

    it('can play', () => {
      musicControl.player.howl = {
        play: jest.fn(),
        playing() { return false; },
        state: jest.fn(),
      };
      musicControl.elPause.click();
      expect(musicControl.player.howl.play).toHaveBeenCalled();
    });

    it('can pause', () => {
      musicControl.player.howl = {
        pause: jest.fn(),
        playing() { return true; },
        state: jest.fn(),
      };
      musicControl.elPause.click();
      expect(musicControl.player.howl.pause).toHaveBeenCalled();
    });

    it('can skip to the previous track', () => {
      musicControl.player.howl = {
        playing() { return true; },
        state: jest.fn(),
        stop: jest.fn(),
      };
      musicControl.elPrev.click();
      expect(musicControl.player.track.id).toEqual(1);
    });

    it('can skip to the next track', () => {
      musicControl.player.howl = {
        playing() { return true; },
        stop: jest.fn(),
      };
      musicControl.elNext.click();
      expect(musicControl.player.track.id).toEqual(2);
    });

    it('can select a track', () => {
      const elTrack = document.getElementById('tk1');
      elTrack.click();
      expect(musicControl.player.isLoading).toBeTruthy();
    });

    it('can select a track when already playing', () => {
      musicControl.player.howl = {
        playing() { return true; },
        state: jest.fn(),
        stop: jest.fn(),
      };

      const elTrack = document.getElementById('tk1');
      elTrack.click();
      expect(musicControl.player.isLoading).toBeTruthy();
    });

    it('can download a track without playing it', () => {
      const elLink = document.getElementById('dl1');
      elLink.click();
      expect(musicControl.player.isPlaying).toBeFalsy();
    });
  });

  describe('loaded on mobile', () => {
    beforeEach(() => {
      musicControl.userAgent = 'test/1.0 iPhone';
      document.body.innerHTML = page;
      musicControl.start();
      musicControl.player.loadReleases(releases);
      musicControl.player.loadPlaylists(playlists);
      musicControl.player.ready();
    });

    it('volume is hidden', () => {
      expect(musicControl.elVolGrp.style.display).toEqual('none');
    });
  });
});
