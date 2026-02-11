# Project Commands

This project uses **Deno** for linting, formatting, and i18n validation. It also has a legacy npm configuration.

## Available Tasks

```bash
# Lint the codebase
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

# Run unit tests
deno test tests/
```

## Direct Deno Commands

```bash
# Run any script directly
deno run --allow-read --allow-write script.ts

# Check types
deno check **/*.ts **/*.js

# REPL
deno
```

## Prerequisites

- Install Deno: https://deno.land/#installation
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
├── content.js              # Content script (runs on YouTube)
├── background.js           # Service worker
├── manifest.json           # Extension manifest
├── package.json            # Legacy npm config (ESLint only)
├── deno.json              # Deno configuration
├── convert-icons.sh        # Icon conversion script
├── tests/                 # Unit tests
│   └── background.test.js  # Tests for title cleaning & media detection
├── popup/                  # Popup UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/                # Options page
│   ├── options.html
│   ├── options.js
│   └── options.css
├── shared/                 # Shared utilities
│   ├── api.js              # Overseerr API client
│   ├── i18n.js             # Internationalization helper
│   ├── storage.js           # Chrome storage wrapper
│   └── utils.js            # Utility functions
├── icons/                  # Extension icons
│   ├── icon*.svg           # SVG source icons
│   ├── icon*.png           # PNG generated icons
│   ├── camera.svg          # Camera/film icon
│   └── broken-image.svg    # Broken image placeholder
└── _locales/               # Translations
    └── {lang}/messages.json
```

## Notes

- Extension code runs in the browser, not in Deno
- Deno is used for linting, formatting, and i18n validation
- Chrome types are available via `// @ts-types` comments
- No `node_modules` - Deno caches dependencies automatically

## Translation Workflow

1. Add i18n keys to HTML with `data-i18n` attributes
2. Run `deno task i18n` to sync keys between locales
3. Update translations in `_locales/{lang}/messages.json`

## Deno vs npm

| npm                  | Deno                         |
| -------------------- | ---------------------------- |
| `npm install`         | No install step needed        |
| `npm run lint`       | `deno task lint`             |
| `npm run lint:fix`   | `deno task lint:fix`         |
| `npm run fmt`        | `deno task fmt`              |
| `package.json`       | `deno.json`                  |
| `node_modules/`      | Cached in `~/.cache/deno/`   |
| ESLint               | Built-in `deno lint`         |
| Prettier             | Built-in `deno fmt`          |
| i18n scripts         | `deno task i18n`             |
