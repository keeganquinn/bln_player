bln_player
==========

[![Build Status](https://ci.qtk.io/job/bln_player/badge/icon)](https://ci.qtk.io/job/bln_player/)

bln_player is a TypeScript library package which can be used to play music from
[basslin.es records](https://basslin.es/)
on web pages or in other JavaScript applications which support HTML5 audio.

It includes a React component, a plain JavaScript UI implementation, and a
playlist manager.


MusicPlayer
-----------

MusicPlayer provides the original controller UI used on the
[basslin.es records](https://basslin.es/)
web site. It is implemented as a React component and requires Bootstrap.


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
