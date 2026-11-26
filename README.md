<img src="public/icon.svg" alt="" width="72" height="72">

# Songsky

**Music that follows your sky.**

Songsky is a web music player that adapts to you: it matches your weather and time of day, plays in sync with friends, follows your walking pace, turns songs into art, and remembers where you heard them. It plays your own music files, runs entirely in the browser, and can be installed as an app.

## Features

- 🎵 **Your own music**: open a folder or pick files; tags, covers and your queue are remembered
- 🌦️ **Mood & sky**: the theme follows the time of day and your local weather, with a matching sound suggestion
- 🎚️ **Smart library**: tempo and key detection, a DJ-style Mix order, crossfade and a 5-band EQ
- 🏃 **Pace match**: on phones, the next song follows your steps per minute
- 🎨 **Song art**: save or share a picture made from each song's sound
- 🗺️ **Memory map**: see where you played your songs (opt-in)
- 🎧 **Listen together**: share a link and friends hear the same song in sync, with chat
- 📱 **Installable**: works offline, with lock-screen and headphone controls

## Development

```bash
pnpm install
pnpm dev        # start the dev server
pnpm test       # unit tests
pnpm check      # type check
pnpm lint       # lint and format check
pnpm build      # production build
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it fits together.

## Built with

TypeScript, Svelte 5, Vite, Web Audio API, IndexedDB, Leaflet, Trystero (WebRTC), PWA

## Privacy

Your music stays on your device: no account and no server. Listen together sends songs directly from the host's device to the listeners over an encrypted peer-to-peer connection. The weather lookup sends a location rounded to about 10 km to Open-Meteo.
