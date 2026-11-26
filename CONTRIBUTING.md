# Contributing to Songsky

Thanks for helping. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug or suggesting an idea

Open an [issue](https://github.com/mesubash/songsky/issues/new/choose) and pick a template. For bugs, the browser and device you used, and the steps that show the problem, help most. For security problems, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Working on the code

You need Node 22+ and pnpm.

```console
$ pnpm install
$ pnpm dev
```

Copy `.env.example` to `.env.local` if you want Jamendo music locally (optional).

Before opening a pull request, run the checks:

```console
$ pnpm lint && pnpm check && pnpm test && pnpm build
```

### Guidelines

- **Keep it small.** One change per pull request, with a clear description of what and why.
- **Privacy first.** Nothing about a listener may leave their device without them choosing a feature that needs it. If your change contacts a new service, add it to [PRIVACY.md](PRIVACY.md) and to the Content Security Policy in `config/security-headers.ts` (and `vercel.json`).
- **Accessible and responsive.** Use real buttons and links, label controls, keep focus visible, respect reduced motion, and check phone and desktop widths.
- **Plain words.** Interface text says what something does, in sentence case, without jargon.
- **Tests for logic.** New logic (parsing, ordering, maths) gets a small Vitest test next to it.
- **Commits.** Short, present-tense summaries in the style `feat(area): what changed`.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together.

## Code of conduct

Everyone taking part is expected to follow the [code of conduct](CODE_OF_CONDUCT.md).
