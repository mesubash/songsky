# Architecture

Attune is a client-only web app. There is no backend: music files, library data and listening history all stay in the browser.

## Overview

```
 Files / Folder ──► Library ──► IndexedDB
                      │
                      ▼
 UI (Svelte) ◄──► Player state ◄──► Audio engine ──► speakers
      ▲               ▲                 │
      │               │                 └─► analyser data (visualizer, song art)
      └──── Features ─┘
   (sky, together, pace, art, memory)
```

- **Library** reads files the user picks, parses tags and cover art, and saves track info to IndexedDB. Audio itself is never copied or uploaded.
- **Player state** is the single source of truth: current track, queue, position, volume, mode.
- **Audio engine** plays the audio. The UI never touches it directly; it goes through player state.
- **Features** are optional add-ons. They read player state and nudge it (reorder the queue, change the theme, pick an EQ preset). Removing a feature never breaks the player.

## Audio graph

```
 <audio> A ─► gain A ─┐
                      ├─► EQ (5 × BiquadFilter) ─► analyser ─► output
 <audio> B ─► gain B ─┘
```

Two `<audio>` elements act as decks. Crossfading ramps gain A down while gain B ramps up, then the decks swap roles. Using `<audio>` elements, not decoded buffers, keeps memory low and keeps lock-screen and headphone controls working through the Media Session API.

## Data (IndexedDB)

| Store      | Holds                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| `tracks`   | Title, artist, album, duration, cover, BPM/key (when analysed), file reference |
| `handles`  | Folder handles, so the library survives reloads (Chromium)                     |
| `history`  | Each play: track, time, optional location                                      |
| `settings` | Theme, EQ, feature toggles                                                     |

## Project layout

```
src/
  lib/
    audio/      engine: decks, crossfade, EQ, analyser, Media Session
    library/    file picking, metadata parsing, IndexedDB
    player/     player state and queue logic
    features/   sky, together, pace, art, memory (one folder each)
  ui/           Svelte components
  main.ts
```

## Stack

TypeScript · Svelte 5 · Vite · Web Audio API · IndexedDB · PWA. Deployed as a static site to GitHub Pages.
