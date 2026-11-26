<p align="center">
  <img src="docs/songsky.svg" width="160" alt="Songsky: a music note whose head is the sun rising over the horizon">
</p>

<h1 align="center">Songsky</h1>

<p align="center">
  A free web music player with a sky that follows your weather. Play your own files, free music from independent artists, or live radio.
</p>

<p align="center">
  <a href="https://songsky.subashsdhami.com.np"><img src="https://img.shields.io/badge/open-songsky.subashsdhami.com.np-f6b26b" alt="Open Songsky"></a>
  <a href="https://github.com/mesubash/songsky/releases/latest"><img src="https://img.shields.io/github/v/release/mesubash/songsky?color=5A0FC8" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/svelte-5-FF3E00?logo=svelte&logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/PWA-works%20offline-5A0FC8?logo=pwa&logoColor=white" alt="Installable PWA, works offline">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license">
</p>

<p align="center">
  <a href="https://songsky.subashsdhami.com.np">Open the app</a> ·
  <a href="#what-it-does">What it does</a> ·
  <a href="PRIVACY.md">Privacy</a> ·
  <a href="#run-it-locally">Run it locally</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>


---

Most music players either stream from a catalogue or feel like a file browser. Songsky does both. It plays the music on your device, free songs from independent artists on [Audius](https://audius.co) and [Jamendo](https://www.jamendo.com), and live radio, and adds what neither usually has: a sky that changes with your day and picks music to match, DJ-style mixing, songs that follow your walking pace, and a way to listen with friends in sync. It runs in the browser and installs like an app. There is no account.

## What it does

| | |
| --- | --- |
| **Your music** | Open a folder or pick files. Chrome and Edge keep the folder connected and check it for new songs each time Songsky opens; other browsers copy the songs in. |
| **Library** | Search, sort, and filter by folder, added files or saved online songs. Playlists, a queue you can reorder, and keyboard shortcuts (press `?`). |
| **Discover** | Picks for your sky, trending, 24 genres and Audius playlists, mixing independent artists from Audius and Creative Commons music from Jamendo. |
| **Radio** | Thousands of live stations by style or name, including Nepali and Bollywood. |
| **Mood and sky** | The theme, logo and tab icon follow the time of day and your local weather (or a city you pick), with faint rain or snow on screen. |
| **Sound** | Crossfade, a 5-band equalizer with presets, and a visualizer drawn as a horizon. |
| **Smart mix** | Tempo and musical key are detected in the background. Mix orders songs so each flows into the next. |
| **Lyrics** | Synced lyrics on the full-screen player, from the free LRCLIB library. |
| **Your year** | Your top songs, artists, skies and places, as a page and a picture to share. |
| **Listen together** | Share a link. Friends hear the same song in sync, chat, request songs and vote on what plays next. |
| **Share playlists** | Send a link to a playlist of online songs; it opens in the other person's Songsky. |
| **Memories** | Listening history by day, and a map of where you played songs (off until you turn it on). |
| **Extras** | Song art pictures, Pace match for walking, a sleep timer, and full-screen mode. |
| **Yours to keep** | Choose what Songsky plays (your music, online music, or both), switch each source on or off, and back up everything to a file you can restore anywhere. |


On iPhone and iPad the browser stops Web Audio when the screen locks, so Songsky plays audio directly there to keep music going. That means crossfade, the equalizer and the visualizer are off on iOS.

## Privacy

No account, no tracking, no ads. Your music files, library, playlists and history stay in your browser. The full list of what leaves your device, and when, is in [PRIVACY.md](PRIVACY.md).

## Run it locally

You need Node 22+ and pnpm.

```console
$ git clone https://github.com/mesubash/songsky && cd songsky
$ pnpm install
$ pnpm dev
  ➜  Local:   http://localhost:5173/
```

Jamendo music needs a free key from [devportal.jamendo.com](https://devportal.jamendo.com). Copy `.env.example` to `.env.local` and set `JAMENDO_CLIENT_ID`; it is read only by the server, never bundled. Without it, Songsky simply leaves Jamendo out.

| Command | What it does |
| --- | --- |
| `pnpm dev` | start the dev server |
| `pnpm build` | production build in `dist/` |
| `pnpm preview` | serve the production build locally, with the production security headers |
| `pnpm test` | unit tests (Vitest) |
| `pnpm check` | type check (svelte-check) |
| `pnpm lint` | lint and format check (Biome) |
| `pnpm icons` | regenerate the app icons from `public/icon.svg` |

## How it works

- Svelte 5 and TypeScript, built with Vite into a static site on Vercel, plus one small server function (`api/jamendo.ts`) that keeps the Jamendo key off the client.
- Audio runs through two decks for crossfading, then a 5-band EQ and an analyser, all in the Web Audio API. A third, direct deck plays streams whose hosts don't allow Web Audio.
- The library lives in IndexedDB. Folders are read through the File System Access API where the browser has it; otherwise files are copied into browser storage.
- Tempo comes from [web-audio-beat-detector](https://github.com/chrisguttandin/web-audio-beat-detector); the key detector is a small pitch-profile matcher written for Songsky.
- Listen together uses [Trystero](https://github.com/dmotz/trystero) for WebRTC connections without a server of our own.
- Heavy parts (tag reading, analysis, the map, peer-to-peer) load only when they are first needed. A strict Content Security Policy limits what the page may load.

More detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Roadmap

- [x] Player, library, queue, playlists, keyboard shortcuts
- [x] Crossfade, equalizer, visualizer
- [x] Installable and offline
- [x] Mood and sky, memory map, song art
- [x] Tempo and key detection, smart mix, pace match
- [x] Listen together with requests and voting
- [x] Discover (Audius and Jamendo), genres, playlists, live radio
- [x] Music folders that check themselves, settings, backup and restore
- [x] Lyrics, your year in Songsky, playlists shared by link
- [ ] Native iOS app (Capacitor) for EQ and crossfade on iPhone

## Contributing

Bug reports, ideas and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md), and please follow the [code of conduct](CODE_OF_CONDUCT.md). For security issues, see [SECURITY.md](SECURITY.md).

## Support

If you enjoy Songsky, you can [buy me a momo](https://buymemomo.com/mesubash) or star the repo.

## License

[MIT](LICENSE). Made with love by [Subash Singh Dhami](https://www.subashsdhami.com.np).
