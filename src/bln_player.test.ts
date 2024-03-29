import {beforeEach, describe, it, expect} from 'vitest';

import BlnPlayer from './bln_player';

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

describe('BlnPlayer', () => {
    let blnPlayer: BlnPlayer;
    beforeEach(() => {
        blnPlayer = new BlnPlayer({});
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
            expect(blnPlayer.track?.id).toEqual(track.id);
        });

        it('can select a track when already playing', () => {
            const track = blnPlayer.tracks[2];

            blnPlayer.pause();

            blnPlayer.play(track);
            expect(blnPlayer.track?.id).toEqual(track.id);
        });

        it('can skip to the next track', () => {
            blnPlayer.pause();
            const { track } = blnPlayer;

            blnPlayer.next();
            expect(blnPlayer.track?.id).not.toEqual(track?.id);
        });

        it('can skip to the previous track', () => {
            blnPlayer.next();
            const { track } = blnPlayer;

            blnPlayer.prev();
            expect(blnPlayer.track?.id).not.toEqual(track?.id);
        });
    });
});
