bln_player
==========

[![Build Status](https://ci.qtk.io/job/bln_player/badge/icon)](https://ci.qtk.io/job/bln_player/)

bln_player is a TypeScript library which can be used to play music
published by basslin.es records on web pages or other JavaScript applications
which support HTML5 audio.

It includes two controller UI implementations and a playlist manager.


MusicControl
------------

MusicControl provides the original controller UI used on the main basslin.es
records web site. It requires Bootstrap 4+ and is presented as a footer navbar.


PanelControl
------------

PanelControl provides a compact panel controller UI suitable for embedding in
other applications or sites. It does not require any external dependencies and
can be easily manipulated to match application design needs.


BlnPlayer
---------

BlnPlayer is the playlist manager implementation. It provides metadata
retrieval and music streaming features and is used by both controller UIs.

It can also be used directly to build additional UIs or provide music playback
without a UI.
