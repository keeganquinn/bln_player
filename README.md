bln_player
==========

bln_player is a JavaScript web component to play music published by
basslin.es records.

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
