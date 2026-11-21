<p align="center">
  <img src="src/assets/kori-mark.svg" width="72" alt="kori" />
</p>

<h1 align="center">kori docs</h1>

<p align="center">
  Documentation and website for <a href="https://github.com/douglasmai4/kori">Kori</a>, a Go toolkit for Chi.<br />
  <a href="https://kori.douglasmaia.dev.br">kori.douglasmaia.dev.br</a>
</p>

---

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build). English is the default language and Brazilian Portuguese is a full translation.

## Getting started

Requires [Bun](https://bun.sh) and Node.js 22+.

```sh
bun install
bun run dev       # http://localhost:4321
```

| Command           | Action                                                     |
| ----------------- | ---------------------------------------------------------- |
| `bun run dev`     | Start the dev server                                       |
| `bun run build`   | Build to `dist/` (clears the content cache with `--force`) |
| `bun run preview` | Serve the production build locally                         |

Search (Pagefind) only works in production builds. Use `bun run build && bun run preview` to test it.

## Project structure

```text
src/
├── assets/kori-mark.svg       # Logo mark (interim vector)
├── components/
│   ├── landing/               # Landing page, its copy (EN/pt-BR) and code snippets
│   ├── ui/Menu.astro          # Custom dropdown used by the language switcher
│   └── *.astro                # Starlight component overrides (header, title, theme, language)
├── content/
│   ├── docs/                  # English pages
│   │   └── pt-br/             # Portuguese pages (same paths)
│   └── i18n/                  # Starlight UI string overrides
├── icons/                     # Local SVG icons for astro-icon
├── pages/                     # Landing (/ and /pt-br/) and 404
├── styles/
│   ├── tokens.css             # Brand tokens: palette, fonts, easing
│   └── starlight.css          # Starlight theme and layout
├── themes/                    # Syntax highlighting themes (kori-dark, kori-light)
└── i18n.ts                    # Locale list and path helpers
```

## Writing docs

- Every page exists in both languages at the same path: `src/content/docs/guides/testing.md` and `src/content/docs/pt-br/guides/testing.md`.
- Add new pages to the `sidebar` in `astro.config.mjs`. Group labels carry their pt-BR translation.
- Set a `description` in the frontmatter. It is shown under the page title.
- Code samples must match the current Kori API. The reference pages mirror `go doc` output for `kori` and `kori/openapi`.

## Design

- Brand and visual rules live in [`DESIGN.md`](DESIGN.md); product context in [`PRODUCT.md`](PRODUCT.md).
- Fonts: Geist and Geist Mono via Fontsource.
- Icons: [Hugeicons](https://hugeicons.com) stroke-rounded via `astro-icon`, rendered as inline SVG at build time:

  ```astro
  ---
  import { Icon } from 'astro-icon/components';
  ---
  <Icon name="hugeicons:arrow-right-02" aria-hidden="true" />
  ```

## Deployment

Pushes to `main` build and deploy to GitHub Pages through `.github/workflows/deploy.yml`. The custom domain is set by `public/CNAME`.

## License

MIT
