import BlnPlayer from './bln_player';

window.HTMLMediaElement.prototype.load = jest.fn();
window.HTMLMediaElement.prototype.play = jest.fn();

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

describe('BlnPlayer', () => {
  let blnPlayer;
  beforeEach(() => {
    blnPlayer = new BlnPlayer();
  });

  it('is not ready until loaded', () => {
    expect(blnPlayer.track).toBeFalsy();
  });

  describe('loaded', () => {
    beforeEach(() => {
      blnPlayer.loadReleases(releases);
      blnPlayer.loadPlaylists(playlists);
      blnPlayer.ready();
    });

    it('parses release information', () => {
      expect(blnPlayer.releases).toBeTruthy();
    });

    it('parses track information', () => {
      expect(blnPlayer.tracks).toBeTruthy();
    });

    it('can play a track', () => {
      const track = blnPlayer.tracks[1];
      blnPlayer.play(track);
      expect(blnPlayer.track.id).toEqual(track.id);
    });

    it('can select a track when already playing', () => {
      const track = blnPlayer.tracks[2];

      blnPlayer.pause();

      blnPlayer.play(track);
      expect(blnPlayer.track.id).toEqual(track.id);
    });

    it('can skip to the next track', () => {
      blnPlayer.pause();
      const { track } = blnPlayer;

      blnPlayer.next();
      expect(blnPlayer.track.id).not.toEqual(track.id);
    });

    it('can skip to the previous track', () => {
      blnPlayer.next();
      const { track } = blnPlayer;

      blnPlayer.prev();
      expect(blnPlayer.track.id).not.toEqual(track.id);
    });
  });
});
