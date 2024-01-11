import React from 'react';

import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {render, screen} from '@testing-library/react';
import {afterAll, afterEach, beforeAll, describe, it, expect} from 'vitest';

import MusicPlayer from './music_player';
import {DataBundle, defaultSourceUrl} from './bln_player';

const dataBundle: DataBundle = {
    releases: [],
    playlists: []
};

const eventResponse = {
    status: 'ok'
};

const server = setupServer(
    http.get(defaultSourceUrl, (req) => {
        return new Response(JSON.stringify(dataBundle));
    }),
);

window.HTMLMediaElement.prototype.load = () => { /* do nothing */ };
window.HTMLMediaElement.prototype.play = async () => { /* do nothing */ };

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MusicPlayer', () => {
    it('draws a player UI when loading is successful', async () => {
        render(<MusicPlayer />);

        expect(screen.queryByLabelText("Tracks and Playlists")).toBeDefined();
        expect(screen.queryByLabelText("Tracks and Playlists")).toBeDefined();
        expect(screen.queryByLabelText("Previous Track")).toBeDefined();
        expect(screen.queryByLabelText("Play")).toBeDefined();
        expect(screen.queryByLabelText("Next Track")).toBeDefined();
        expect(screen.queryByLabelText("Volume")).toBeDefined();
    });

    it('fails gracefully when loading is unsuccessful', async () => {
        server.use(
            http.get(defaultSourceUrl, (req) => {
                return HttpResponse.error();
            }),
        );

        render(<MusicPlayer />);

        expect(screen.queryByLabelText("Tracks and Playlists")).toBeNull();
    });
});
