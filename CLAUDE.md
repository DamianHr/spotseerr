# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build extension (outputs to dist/)
npm run build

# Watch mode for development
npm run dev

# Run tests (Deno)
deno task test

# Run a single test file
deno test src/tests/parser.test.ts

# Type-check (Deno)
deno task typecheck

# Lint (Deno)
deno task lint

# Auto-fix lint issues
deno task lint:fix

# Format code
deno task fmt

# Lint + format check together
deno task check

# Validate and sync i18n keys across locales
deno task i18n
```

**Tooling split:** npm/Vite handles build and tests; Deno handles linting, formatting, and i18n validation. Both must pass before committing.

## Architecture

This is a Manifest V3 Chrome extension with three isolated execution contexts that communicate via `chrome.runtime.sendMessage`:

```
[Content Script]  ──sendMessage──>  [Background Service Worker]  ──fetch──>  [Overseerr API]
     ^                                          |
     |                                          |
[Popup UI]  ─────sendMessage──────────────────>┘
```

**Background service worker** (`src/background/background.ts`) is the sole context that makes API calls. It acts as a proxy: the popup sends message actions (`searchMedia`, `createRequest`, `checkAvailability`, etc.) and the background executes the actual fetch against the Overseerr API.

**Content script** (`src/content/content.ts`) runs on supported pages. It watches for URL changes and DOM mutations to detect the current video title, then delegates title cleaning to the background via `cleanTitle` message. The popup queries the content script with `getCurrentMedia` to get the detected title.

**Popup** (`src/popup/popup.ts`) orchestrates the user flow: reads media info from the content script, sends search/request actions to the background, and renders results.

### Adding support for a new site

`src/shared/siteConfig.ts` is the single source of truth. Add an entry to `SITES_CONFIG`, set `enabled: true`, provide a `titleSelector`, and add the matching domain to `manifest.json` under both `host_permissions` and `content_scripts.matches`.

### i18n

All user-visible strings go through `chrome.i18n.getMessage()`. HTML elements use `data-i18n` attributes; `initI18n()` from `src/shared/localize.ts` hydrates them on `DOMContentLoaded`. After adding new keys to HTML or TypeScript, run `deno task i18n` to sync them across `src/_locales/*/messages.json`.

### TypeScript path alias

`@shared/*` resolves to `src/shared/*` (configured in both `vite.config.ts` and `tsconfig.json`).

### Build output

CRXJS (`@crxjs/vite-plugin`) reads `src/manifest.json` directly and bundles everything to `dist/`. Load the `dist/` folder in Chrome developer mode to test. The post-build `scripts/fix-locales.js` copies locale files into the expected location.
