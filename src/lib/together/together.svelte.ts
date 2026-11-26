import { untrack } from 'svelte';
import type { MessageAction, RequestAction, Room } from 'trystero';
import { isAudiusStreamUrl } from '$lib/discover/audius';
import { library } from '$lib/library/library.svelte';
import { player } from '$lib/player/player.svelte';
import {
  addVote,
  type ChatMessage,
  clockOffset,
  MAX_CHAT_LENGTH,
  MAX_NAME_LENGTH,
  type NowPlaying,
  needsSeek,
  parseSession,
  randomId,
  readCatalog,
  readChat,
  readNowPlaying,
  readRequests,
  readSongInfo,
  type SessionKey,
  type SongInfo,
  type SongRequest,
  sessionLink,
  targetPosition,
} from './sync';

/** Peers only find each other within the same app id. */
const APP_ID = 'songsky.music-player';
const BROADCAST_MS = 1000;
const MAX_SONG_BYTES = 80 * 1024 * 1024;
const MAX_MESSAGES = 100;
const NAME_KEY = 'songsky:name';

interface Actions {
  song: MessageAction<Blob | ArrayBuffer | ArrayBufferView>;
  now: MessageAction<NowPlaying>;
  chat: MessageAction<ChatMessage>;
  clock: RequestAction<number, number>;
  catalog: MessageAction<SongInfo[]>;
  request: MessageAction<SongInfo>;
  requests: MessageAction<SongRequest[]>;
  /** Streamed songs are shared as their Audius address; guests stream them directly. */
  stream: MessageAction<SongInfo & { url: string }>;
}

/** A tiny silent clip, played from the Join tap so browsers allow playback later. */
function silence(): string {
  const samples = 800;
  const view = new DataView(new ArrayBuffer(44 + samples * 2));
  const text = (at: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 16000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples * 2, true);
  return URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
}

/**
 * Listen together. The host's device streams each song straight to the guests over
 * WebRTC (nothing goes through a server) and broadcasts where playback is every second.
 * Guests play on their own audio element and nudge themselves back into sync.
 */
class Together {
  role = $state<'host' | 'guest' | null>(null);
  /** An invite found in the page address, waiting for the person to tap Join. */
  invite = $state<SessionKey | null>(
    typeof location === 'undefined' ? null : parseSession(location.href),
  );
  link = $state<string | null>(null);
  listeners = $state(0);
  messages = $state<ChatMessage[]>([]);
  name = $state('');
  error = $state<string | null>(null);
  /** Guest only: the song the host is playing, and download progress (0..1) while it arrives. */
  song = $state<SongInfo | null>(null);
  receiving = $state<number | null>(null);
  guestPlaying = $state(false);
  /** Songs people asked for, most votes first. The host plays the top one next. */
  requests = $state<SongRequest[]>([]);
  /** Guest only: the host's songs, for searching and requesting. */
  catalog = $state<SongInfo[]>([]);

  #room: Room | null = null;
  #actions: Actions | null = null;
  #stopWatching: (() => void) | null = null;
  #timer: ReturnType<typeof setInterval> | undefined;
  #audio: HTMLAudioElement | null = null;
  #url: string | null = null;
  #loadedKey: string | null = null;
  #last: NowPlaying | null = null;
  #offset = 0;
  #clockSynced = false;

  constructor() {
    try {
      this.name = localStorage.getItem(NAME_KEY) ?? '';
    } catch {
      // No storage: the name lasts for this visit.
    }
  }

  setName(name: string): void {
    this.name = name.slice(0, MAX_NAME_LENGTH);
    try {
      localStorage.setItem(NAME_KEY, this.name);
    } catch {
      // Ignore.
    }
  }

  async host(): Promise<void> {
    const session = { room: randomId(10), password: randomId(20) };
    await this.#join(session, 'host');
    this.link = sessionLink(location.href, session);
  }

  /** Must run from a tap so the guest's audio is allowed to play. */
  async join(): Promise<void> {
    if (!this.invite) return;
    const audio = new Audio();
    audio.src = silence();
    void audio
      .play()
      .then(() => audio.pause())
      .catch(() => {});
    this.#audio = audio;
    audio.addEventListener('play', () => {
      this.guestPlaying = true;
    });
    audio.addEventListener('pause', () => {
      this.guestPlaying = false;
    });
    player.pause();
    await this.#join(this.invite, 'guest');
  }

  async leave(): Promise<void> {
    clearInterval(this.#timer);
    this.#stopWatching?.();
    this.#stopWatching = null;
    await this.#room?.leave();
    this.#room = null;
    this.#actions = null;
    this.#audio?.pause();
    this.#audio = null;
    if (this.#url) URL.revokeObjectURL(this.#url);
    this.#url = null;
    this.#loadedKey = null;
    this.#last = null;
    this.#clockSynced = false;
    if (this.role === 'guest') {
      // Drop the invite from the address so a reload doesn't rejoin.
      history.replaceState(null, '', location.pathname + location.hash);
      this.invite = null;
    }
    this.role = null;
    this.link = null;
    this.listeners = 0;
    this.messages = [];
    this.requests = [];
    this.catalog = [];
    this.song = null;
    this.receiving = null;
  }

  /** Ask for a song (guests) or add it to the requests (host). Asking again adds no extra vote. */
  async requestSong(song: SongInfo): Promise<void> {
    if (this.role === 'host') this.#vote(song, 'host');
    else await this.#actions?.request.send({ ...song }).catch(() => {});
  }

  #vote(song: SongInfo, voter: string): void {
    this.requests = addVote(this.requests, song, voter, Date.now());
    const top = this.requests[0];
    if (top && top.key !== player.current?.id) player.playNextUp(top.key);
    this.#shareRequests();
  }

  #shareRequests(): void {
    void this.#actions?.requests.send($state.snapshot(this.requests)).catch(() => {});
  }

  async sendChat(text: string): Promise<void> {
    const message = readChat({
      name: this.name,
      text: text.slice(0, MAX_CHAT_LENGTH),
      at: Date.now(),
    });
    if (!message || !this.#actions) return;
    this.#addMessage(message);
    await this.#actions.chat.send(message);
  }

  async #join(session: SessionKey, role: 'host' | 'guest'): Promise<void> {
    this.error = null;
    const { joinRoom } = await import('trystero');
    const room = joinRoom({ appId: APP_ID, password: session.password }, session.room);
    const actions: Actions = {
      song: room.makeAction<Blob | ArrayBuffer | ArrayBufferView>('song'),
      now: room.makeAction<NowPlaying>('now'),
      chat: room.makeAction<ChatMessage>('chat'),
      clock: room.makeAction<number, number>('clock', { kind: 'request' }),
      catalog: room.makeAction<SongInfo[]>('catalog'),
      request: room.makeAction<SongInfo>('request'),
      requests: room.makeAction<SongRequest[]>('requests'),
      stream: room.makeAction<SongInfo & { url: string }>('stream'),
    };
    this.#room = room;
    this.#actions = actions;
    this.role = role;

    const countPeers = () => {
      this.listeners = Object.keys(room.getPeers()).length;
    };
    room.onPeerJoin(({ peerId }) => {
      countPeers();
      if (role === 'host') {
        void this.#sendSong(peerId);
        void this.#broadcast(peerId);
        const catalog = library.tracks.map((t) => ({
          key: t.id,
          title: t.title,
          artist: t.artist,
        }));
        void actions.catalog.send(catalog, { target: peerId }).catch(() => {});
        void actions.requests
          .send($state.snapshot(this.requests), { target: peerId })
          .catch(() => {});
      }
    });
    room.onPeerLeave(countPeers);
    room.onError(() => {
      this.error = 'The connection had a problem. Check your network.';
    });
    actions.chat.onMessage((data) => {
      const message = readChat(data);
      if (message) this.#addMessage(message);
    });

    if (role === 'host') this.#startHosting(actions);
    else this.#startListening(actions);
  }

  #startHosting(actions: Actions): void {
    actions.clock.onRequest(() => Date.now());
    actions.request.onMessage((data, { peerId }) => {
      const asked = readSongInfo(data);
      const track = asked && library.byId.get(asked.key);
      if (!track) return; // Only songs the host actually has.
      this.#vote({ key: track.id, title: track.title, artist: track.artist }, peerId);
    });
    this.#timer = setInterval(() => void this.#broadcast(null), BROADCAST_MS);
    // Send each new song to everyone as soon as it starts.
    this.#stopWatching = $effect.root(() => {
      $effect(() => {
        const id = player.current?.id;
        if (!id) return;
        untrack(() => {
          void this.#sendSong(null);
          // A request that has started playing is done.
          if (this.requests.some((r) => r.key === id)) {
            this.requests = this.requests.filter((r) => r.key !== id);
            this.#shareRequests();
          }
          // Starting a new list replaces the queue, so keep the top request next.
          const top = this.requests[0];
          if (top) player.playNextUp(top.key);
        });
      });
    });
  }

  #startListening(actions: Actions): void {
    actions.catalog.onMessage((data) => {
      this.catalog = readCatalog(data);
    });
    actions.requests.onMessage((data) => {
      this.requests = readRequests(data);
    });
    actions.song.onReceive(({ byteLength }) => byteLength <= MAX_SONG_BYTES);
    actions.song.onReceiveProgress((progress, { metadata }) => {
      const info = readSongInfo(metadata);
      if (info && info.key !== this.#loadedKey) {
        this.song = info;
        this.receiving = progress;
      }
    });
    actions.song.onMessage((data, { metadata }) => {
      const info = readSongInfo(metadata);
      // Binary arrives as bytes (ArrayBuffer or a typed array), not always as a Blob.
      const isBytes =
        data instanceof Blob || data instanceof ArrayBuffer || ArrayBuffer.isView(data);
      if (!info || !isBytes || !this.#audio) return;
      if (this.#url) URL.revokeObjectURL(this.#url);
      this.#url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data as BlobPart]));
      this.#audio.src = this.#url;
      this.#loadedKey = info.key;
      this.song = info;
      this.receiving = null;
      if (this.#last) this.#follow(this.#last);
    });
    actions.stream.onMessage((data) => {
      const info = readSongInfo(data);
      const url = (data as { url?: unknown } | null)?.url;
      // Only real Audius stream links: the host must not be able to point us anywhere else.
      if (!info || typeof url !== 'string' || !isAudiusStreamUrl(url) || !this.#audio) return;
      if (this.#url) URL.revokeObjectURL(this.#url);
      this.#url = null;
      this.#audio.src = url;
      this.#loadedKey = info.key;
      this.song = info;
      this.receiving = null;
      if (this.#last) this.#follow(this.#last);
    });
    actions.now.onMessage((data, { peerId }) => {
      const state = readNowPlaying(data);
      if (!state) return;
      this.#last = state;
      if (!this.#clockSynced) {
        this.#clockSynced = true;
        void this.#syncClock(actions.clock, peerId);
      }
      this.#follow(state);
    });
  }

  async #syncClock(clock: RequestAction<number, number>, host: string): Promise<void> {
    const samples = [];
    for (let i = 0; i < 3; i++) {
      const sent = Date.now();
      try {
        const hostTime = await clock.request(0, { target: host });
        samples.push({ sent, host: Number(hostTime), received: Date.now() });
      } catch {
        // A lost sample just means a less exact offset.
      }
    }
    if (samples.length) this.#offset = clockOffset(samples);
  }

  #follow(state: NowPlaying): void {
    const audio = this.#audio;
    if (!audio || state.key !== this.#loadedKey) return;
    const target = targetPosition(state, Date.now(), this.#offset);
    if (needsSeek(audio.currentTime, target)) audio.currentTime = target;
    if (state.playing && audio.paused) {
      audio.play().catch(() => {
        this.error = 'Tap play to start listening.';
      });
    } else if (!state.playing && !audio.paused) {
      audio.pause();
    }
  }

  /** Guest: resume after the browser blocked playback. */
  resume(): void {
    this.error = null;
    if (this.#last) this.#follow(this.#last);
    void this.#audio?.play();
  }

  async #sendSong(target: string | null): Promise<void> {
    const track = player.current;
    const actions = this.#actions;
    if (!track || !actions) return;
    if (track.source === 'stream' && track.streamUrl) {
      const song = {
        key: track.id,
        title: track.title,
        artist: track.artist,
        url: track.streamUrl,
      };
      await actions.stream.send(song, { target }).catch(() => {});
      return;
    }
    const file = await library.fileFor(track);
    if (!file) return;
    const metadata: SongInfo = { key: track.id, title: track.title, artist: track.artist };
    await actions.song.send(file, { target, metadata: { ...metadata } }).catch(() => {});
  }

  async #broadcast(target: string | null): Promise<void> {
    const track = player.current;
    if (!track || !this.#actions) return;
    const state: NowPlaying = {
      key: track.id,
      playing: player.playing,
      position: player.position,
      at: Date.now(),
    };
    await this.#actions.now.send(state, { target }).catch(() => {});
  }

  #addMessage(message: ChatMessage): void {
    this.messages = [...this.messages, message].slice(-MAX_MESSAGES);
  }
}

export const together = new Together();
