# Project Commands

This project uses [Deno](https://deno.land/) instead of Node.js/npm for tooling.

## Available Tasks

````bash
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

## Direct Deno Commands

```bash
# Run any script directly
deno run --allow-read --allow-write script.ts

# Check types
deno check **/*.ts **/*.js

# REPL
deno
````

## Prerequisites

- Install Deno: https://deno.land/#installation

### For icon conversion (optional):

**macOS:**

```bash
brew install imagemagick
# or
brew install librsvg
```

**Ubuntu/Debian:**

```bash
sudo apt-get install imagemagick
# or
sudo apt-get install librsvg2-bin
```

**Windows:**
Download ImageMagick from: https://imagemagick.org/script/download.php#windows

## Project Structure

```
.
├── content.js          # Content script (runs on YouTube)
├── background.js       # Service worker
├── popup/              # Popup UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/            # Options page
│   ├── options.html
│   ├── options.js
│   └── options.css
├── shared/             # Shared utilities
│   ├── storage.js
│   └── utils.js
├── icons/              # Extension icons
├── _locales/           # Translations
├── manifest.json       # Extension manifest
└── deno.json          # Deno configuration
```

## Notes

- The extension code runs in the browser, not in Deno
- Deno is used only for linting, formatting, and build scripts
- Chrome types are available via `// @ts-types` comments in the code
- No `node_modules` - Deno caches dependencies automatically

## Migration from npm

This project was migrated from npm to Deno. Key differences:

| npm                | Deno                       |
| ------------------ | -------------------------- |
| `npm install`      | No install step needed     |
| `npm run lint`     | `deno task lint`           |
| `npm run lint:fix` | `deno task lint:fix`       |
| `package.json`     | `deno.json`                |
| `node_modules/`    | Cached in `~/.cache/deno/` |
| ESLint             | Built-in `deno lint`       |
| Prettier           | Built-in `deno fmt`        |
