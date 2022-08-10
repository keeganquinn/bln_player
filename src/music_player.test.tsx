import React from 'react';

import {rest} from 'msw';
import {setupServer} from 'msw/node';
import {configure, render, fireEvent, waitFor, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import MusicPlayer from './music_player';
import {DataBundle} from './bln_player';

const dataBundle: DataBundle = {
    visitToken: 'abc',
    visitorToken: 'abc',
    releases: [],
    playlists: []
};

const server = setupServer(
    rest.get('https://basslin.es/player.json', (req, res, ctx) => {
      return res(ctx.json(dataBundle));
    }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('draws a player UI when loaded', async () => {
    render(<MusicPlayer />);

    expect(await screen.findByLabelText("Tracks and Playlists")).toBeInTheDocument();
    expect(await screen.findByLabelText("Previous Track")).toBeInTheDocument();
    expect(await screen.findByLabelText("Play")).toBeInTheDocument();
    expect(await screen.findByLabelText("Next Track")).toBeInTheDocument();
    expect(await screen.findByLabelText("Volume")).toBeInTheDocument();
});
