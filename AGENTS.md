# Project Commands

This project uses **Vite + CRXJS** for bundling (Node/npm, build-only). **Deno** is the primary dev runtime: testing, type-checking, linting, formatting, and i18n validation.

## Available Tasks

```bash
# Build extension (Vite + CRXJS bundles to dist/) — Node/npm
npm run build

# Watch mode for development — Node/npm
npm run dev

# Run tests (Deno)
deno task test

# Type-check all source (Deno)
deno task typecheck

# Lint the codebase (Deno)
deno task lint

# Lint and auto-fix issues
deno task lint:fix

# Format code
deno task fmt

# Check formatting without making changes
deno task fmt:check

# Run all checks (lint + format check)
deno task check

# Validate and sync translations
deno task i18n
```

> **Runtime split**: npm is used **only** for the extension build (`npm run build`/`npm run dev`), because `@crxjs/vite-plugin` requires Node/Vite. Everything else (tests, typecheck, lint, fmt, i18n) runs under Deno.

## Prerequisites

- Install Deno: https://deno.land/#installation
- Install Node.js: https://nodejs.org/
- For icon conversion: ImageMagick (optional)

**Ubuntu/Debian:**
```bash
sudo apt-get install imagemagick
```

**macOS:**
```bash
brew install imagemagick
```

## Project Structure

```
.
├── src/
│   ├── shared/              # Shared modules
│   │   ├── index.ts         # Re-exports all shared
│   │   ├── siteConfig.ts    # Site config (SINGLE SOURCE OF TRUTH)
│   │   ├── api.ts          # Overseerr API client
│   │   ├── storage.ts      # Chrome storage wrapper
│   │   ├── parser.ts      # Title/media parsing
│   │   └── utils.ts        # Utility functions
│   ├── content/content.ts  # Content script
│   ├── background/background.ts  # Service worker
│   ├── popup/             # Popup UI
│   ├── options/           # Options page
│   ├── tests/             # Deno tests
│   ├── icons/             # Extension icons
│   ├── _locales/          # Translations
│   └── manifest.json      # Extension manifest
├── public/               # Empty (static assets in src/)
├── dist/                  # Build output
├── vite.config.ts
├── tsconfig.json
├── package.json
├── deno.json              # Deno linting/i18n config
└── convert-icons.sh      # Icon conversion script
```

## Build Output

CRXJS bundles `src/**/*.ts` → `dist/**/*.js`. The manifest in `dist/` references bundled `.js` files.

## Translation Workflow

1. Add i18n keys to HTML with `data-i18n` attributes
2. Run `deno task i18n` to sync keys between locales
3. Update translations in `src/_locales/{lang}/messages.json`

## TypeScript Aliases

Configured in vite.config.ts and tsconfig.json:

- `@shared/*` → `./src/shared/*`

## Tech Stack

| Tool | Purpose |
|------|---------|
| Vite + @crxjs/vite-plugin | Bundling |
| TypeScript | Type safety |
| Deno | Tests, linting, formatting, i18n |
| Deno | Linting, formatting, i18n |
| @types/chrome | Chrome types |