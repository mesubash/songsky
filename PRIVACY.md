# Privacy

Songsky has no account, no tracking, no ads and no analytics. There is no Songsky database: your music, library, playlists, history and settings are stored in your own browser (IndexedDB and localStorage) and never sent to us.

This page lists everything that does leave your device, and when.

## Never leaves your device

- **Your music files.** Songsky reads them in the browser. They are never uploaded.
- **Your library, playlists, listening history and settings.** Exporting a backup saves a file to your device; nothing is sent anywhere.
- **Places on your memory map.** Only recorded if you turn on "Remember where I listen", and kept on this device.

## Sent to other services, only when you use the feature

| When | What is sent | To |
| --- | --- | --- |
| Your sky uses your location or a city | Location rounded to about 10 km | [Open-Meteo](https://open-meteo.com) for the weather, and [BigDataCloud](https://www.bigdatacloud.com) for your town's name |
| You search for a city | What you type | Open-Meteo's place search |
| You browse, search or play in Discover | Searches, genres, and the songs you play | [Audius](https://audius.co) and [Jamendo](https://www.jamendo.com) (Jamendo requests go through Songsky's server, which adds our app key and passes nothing else) |
| You use Radio | Station searches, and the station you play | [Radio Browser](https://www.radio-browser.info) and the station's own server |
| You open the memory map | Which map tiles to show | [OpenStreetMap](https://www.openstreetmap.org) |
| You see lyrics | The song's title, artist and length | [LRCLIB](https://lrclib.net) |
| You open About | A request for the repository's star count | GitHub |
| You use Listen together | Songs, chat and requests, sent straight to the people in your session over an encrypted peer-to-peer connection | Public relays help you find each other but don't see the content |

Each of these services has its own privacy policy, and like any website they receive your IP address when your browser contacts them.

## Location

Songsky never asks for your location when the page opens. It uses location only after you press "Match my sky" or "Use my location", or if you allowed it for this site before. You can switch to a city or time of day only at any time in Settings.

## Hosting

The app is served by [Vercel](https://vercel.com), which keeps standard request logs for operating the service. Songsky adds no logging of its own.

## Deleting your data

Settings, Your data lets you delete your listening history, all playlists, or the whole library. Clearing this site's data in your browser removes everything.

## Questions

Open an issue at [github.com/mesubash/songsky](https://github.com/mesubash/songsky/issues).
