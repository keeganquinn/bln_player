import React from 'react';

import {rest} from 'msw';
import {setupServer} from 'msw/node';
import {render, fireEvent, waitFor, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import MusicPlayer from './music_player';
import {DataBundle, defaultEventsUrl, defaultSourceUrl} from './bln_player';

const dataBundle: DataBundle = {
    visitToken: 'abc',
    visitorToken: 'abc',
    releases: [],
    playlists: []
};

const eventResponse = {
    status: 'ok'
};

const server = setupServer(
    rest.get(defaultSourceUrl, (req, res, ctx) => {
        return res(ctx.json(dataBundle));
    }),
    rest.get(defaultEventsUrl, (req, res, ctx) => {
        return res(ctx.json(eventResponse));
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

        expect(await screen.findByLabelText("Tracks and Playlists")).toBeInTheDocument();
        expect(await screen.findByLabelText("Previous Track")).toBeInTheDocument();
        expect(await screen.findByLabelText("Play")).toBeInTheDocument();
        expect(await screen.findByLabelText("Next Track")).toBeInTheDocument();
        expect(await screen.findByLabelText("Volume")).toBeInTheDocument();
    });

    it('fails gracefully when loading is unsuccessful', async () => {
        server.use(
            rest.get(defaultSourceUrl, (req, res, ctx) => {
                return res(ctx.status(500));
            }),
        );

        render(<MusicPlayer />);

        expect(screen.queryByLabelText("Tracks and Playlists")).not.toBeInTheDocument();
    });
});
