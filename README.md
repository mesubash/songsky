<p align="center">
  <img src="docs/songsky.svg" width="160" alt="Songsky: a music note whose head is the sun rising over the horizon">
</p>

<h1 align="center">Songsky</h1>

<p align="center">
  A free web music player with a sky that follows your weather. Play free music from independent artists, or your own files.
</p>

<p align="center">
  <a href="https://songsky.subashsdhami.com.np"><img src="https://img.shields.io/badge/open-songsky.subashsdhami.com.np-f6b26b" alt="Open Songsky"></a>
  <img src="https://img.shields.io/badge/svelte-5-FF3E00?logo=svelte&logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/typescript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript, strict">
  <img src="https://img.shields.io/badge/PWA-works%20offline-5A0FC8?logo=pwa&logoColor=white" alt="Installable PWA, works offline">
  <img src="https://img.shields.io/badge/server-none-3fb950" alt="No server">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license">
</p>

<p align="center">
  <a href="https://songsky.subashsdhami.com.np">Open the app</a> ·
  <a href="#what-it-does">What it does</a> ·
  <a href="#privacy">Privacy</a> ·
  <a href="#run-it-locally">Run it locally</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a>
</p>

---

Most music players either stream from a catalogue or feel like a file browser. Songsky does both: it plays free music from independent artists on [Audius](https://audius.co) and the files already on your device, and adds what neither usually has: a sky that changes with your day and picks music to match, DJ-style mixing, songs that follow your walking pace, and a way to listen with friends in sync. It runs in the browser and installs like an app.

## What it does

| Feature | What happens |
| --- | --- |
| Discover | Free songs from independent artists on Audius: picks for your sky ("For a rainy night"), trending this week, and search. Save the ones you like to your library. |
| Your own music | Open a folder or pick files. Tags, cover art, your queue and position are remembered next time. |
| Mood and sky | The theme, the logo and the tab icon follow the time of day and your local weather, with rain or snow on screen and a matching sound suggestion. |
| Smart mix | Tempo (BPM) and musical key are detected in the background. Mix orders songs so each one flows into the next, and crossfade blends them. |
| Sound | Crossfade, a 5-band equalizer with presets, and a visualizer drawn as a horizon. |
| Pace match | On phones, the motion sensor counts your steps per minute and moves a song with a matching tempo up next. |
| Listen together | Share a link. Friends hear the same song in sync, chat, request songs and vote on what plays next. |
| Song art | Save or share a picture made from each song's sound, your sky and the date. |
| Memory map | See where you played your songs on a map (off until you turn it on). |
| Sleep timer | Stop after 15 to 60 minutes or at the end of the song, fading out instead of cutting off. |
| Works offline | Installs to your home screen, keeps working without a connection, and has lock-screen and headphone controls. |

On iPhone and iPad the browser stops Web Audio when the screen locks, so Songsky plays audio directly there to keep music going. That means crossfade, the equalizer and the visualizer are off on iOS.

## Privacy

- Your music files never leave your device. There is no account and no server.
- Discover streams songs from Audius; Songsky sends Audius only the search or mood being looked up.
- Listen together sends songs straight from the host's device to the listeners over an encrypted peer-to-peer connection.
- The weather lookup sends a location rounded to about 10 km to [Open-Meteo](https://open-meteo.com), and the same rounded location to [BigDataCloud](https://www.bigdatacloud.com) to name your town. Map tiles come from [OpenStreetMap](https://www.openstreetmap.org).

## Run it locally

You need Node 22+ and pnpm.

```console
$ git clone https://github.com/mesubash/songsky && cd songsky
$ pnpm install
$ pnpm dev
  ➜  Local:   http://localhost:5173/
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | start the dev server |
| `pnpm build` | production build in `dist/` |
| `pnpm preview` | serve the production build locally |
| `pnpm test` | unit tests (Vitest) |
| `pnpm check` | type check (svelte-check) |
| `pnpm lint` | lint and format check (Biome) |
| `pnpm icons` | regenerate the app icons from `public/icon.svg` |

## How it works

- Svelte 5 and TypeScript, built with Vite into a static site. Pushes to `main` deploy on Vercel.
- Audio runs through two decks for crossfading, then a 5-band EQ and an analyser, all in the Web Audio API.
- The library lives in IndexedDB. Folders are read through the File System Access API where the browser has it; otherwise files are copied into browser storage.
- Tempo comes from [web-audio-beat-detector](https://github.com/chrisguttandin/web-audio-beat-detector); the key detector is a small pitch-profile matcher written for Songsky.
- Discover uses the free [Audius API](https://docs.audius.org), which provides each song's tempo and key, so Mix and Pace match work on streams without downloading them.
- Listen together uses [Trystero](https://github.com/dmotz/trystero) for WebRTC connections without a server of our own.
- Heavy parts (tag reading, analysis, the map, peer-to-peer) load only when they are first needed.

More detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Roadmap

- [x] Player, library, queue, lock-screen controls
- [x] Crossfade, equalizer, visualizer
- [x] Installable and offline
- [x] Mood and sky (weather, location or city)
- [x] Song art
- [x] Memory map
- [x] Tempo and key detection, smart mix
- [x] Pace match
- [x] Listen together with requests and voting
- [x] Sleep timer
- [x] Discover: free music from Audius, picked for your sky
- [ ] Song journal, focus timer, year in review
- [ ] Native iOS app (Capacitor) for EQ and crossfade on iPhone

## License

[MIT](LICENSE)
