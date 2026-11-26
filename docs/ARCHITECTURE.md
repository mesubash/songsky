# Architecture

Songsky is a static web app with one small server function. Music files, library data, playlists and listening history all stay in the browser.

## Overview

```
 Files / folders ──► Library ──► IndexedDB
 Audius, Jamendo ──►    │
                        ▼
 UI (Svelte) ◄──► Player state ◄──► Audio engine ──► speakers
      ▲               ▲                 │
      │               │                 └─► analyser data (visualizer, song art)
      └──── Features ─┘
   (sky, discover, radio, together, pace, art, memory, lyrics, year)
```

- **Library** reads files the user picks, parses tags and cover art, and saves track info to IndexedDB. Audio files are never uploaded. Songs saved from Discover are stored as stream addresses.
- **Player state** is the single source of truth: current track, queue, position, volume, modes.
- **Audio engine** plays the audio. The UI never touches it directly; it goes through player state.
- **Features** are add-ons. They read player state and nudge it (reorder the queue, change the theme, pick an EQ preset). Removing a feature never breaks the player.
- **Radio** has its own plain `<audio>` element, because most stations don't allow Web Audio. Radio and songs never play at once.

## Audio graph

```
 <audio> A ─► gain A ─┐
                      ├─► EQ (5 × BiquadFilter) ─► master ─► analyser ─► output
 <audio> B ─► gain B ─┘

 <audio> direct ───────────────────────────────────────────────────────► output
```

Two `<audio>` elements act as decks. Crossfading ramps gain A down while gain B ramps up, then the decks swap roles. The direct deck plays streams whose hosts only sometimes send the cross-site permission Web Audio needs (Jamendo); those songs skip the EQ and switch with a cut. Using `<audio>` elements, not decoded buffers, keeps memory low and keeps lock-screen and headphone controls working through the Media Session API.

## Data (IndexedDB)

| Store       | Holds                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------- |
| `tracks`    | Title, artist, album, duration, cover id, BPM/key, file handle or stream address, folder name |
| `covers`    | Cover art, stored once per album                                                             |
| `folders`   | Folder handles, so connected folders survive reloads (Chromium)                              |
| `files`     | Copied audio for browsers without folder access                                              |
| `history`   | Each play: track, time, optional place and weather                                           |
| `playlists` | Name and song ids, in order                                                                  |

The queue, position, volume, shuffle and repeat, sound settings, sky source and preferences are saved to `localStorage`, so Songsky reopens where you left off. A backup file holds all of this except the audio itself.

## Server

`api/jamendo.ts` is a Vercel function. It adds the `JAMENDO_CLIENT_ID` key on the server, forwards only track searches with checked options, and caches results at the edge for an hour. `pnpm dev` and `pnpm preview` do the same through a Vite proxy that reads `.env.local`.

## Security

Every page is served with a Content Security Policy, HSTS and Cross-Origin-Opener-Policy, defined once in `config/security-headers.ts`. `vercel.json` repeats them for production, and a test fails if the two differ.

## Project layout

```
api/            server function (Jamendo)
config/         security headers
src/
  lib/
    audio/      engine: decks, crossfade, EQ, analyser
    library/    file picking, metadata, IndexedDB, browse and sort
    player/     player state and queue logic
    discover/   Audius, Jamendo, moods, mixing sources
    radio/      station directory and the radio player
    playlists/  playlists store
    sky/        time of day, weather, location
    …           together, pace, art, memory, lyrics, year, backup
  ui/           Svelte components
  main.ts
```

## Stack

TypeScript, Svelte 5, Vite, Web Audio API, IndexedDB, PWA (vite-plugin-pwa), Biome, Vitest. Hosted on Vercel.
