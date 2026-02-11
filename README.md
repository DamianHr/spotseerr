# SpotSeerr

A Chrome extension that detects movies and TV shows playing on YouTube and allows you to request them on your Overseerr instance with one click.

> **Note:** This project was created with the assistance of LLM (Large Language Model) tools.

## Features

- **Automatic Detection**: Extracts and cleans video titles from YouTube pages
- **Smart Title Cleaning**: Removes trailer keywords, years, and promotional text
- **Media Type Detection**: Automatically identifies movies vs TV shows
- **One-Click Requests**: Request content directly from the popup
- **Status Indicators**: Shows if content is already available or requested
- **Notifications**: Get notified when requests succeed or fail
- **Easy Configuration**: Simple settings page for SpotSeerr connection

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `spotseerr` folder
6. The extension icon should appear in your toolbar

### First Setup

1. Click the extension icon and select "Settings" (or right-click the icon and choose "Options")
2. Enter your Overseerr URL (e.g., `https://overseerr.example.com`)
3. Enter your Overseerr API key (found in Overseerr Settings > General > API Key)
4. Click "Test Connection" to verify everything works
5. Click "Save Settings"

## Usage

1. Navigate to any YouTube video (movie trailer, TV show clip, etc.)
2. Click the SpotSeerr extension icon in your toolbar
3. The extension will automatically detect the video title and search your Overseerr instance
4. Click "Request" on any matching result to add it to your Overseerr requests

## How It Works

### Title Cleaning
The extension automatically cleans YouTube video titles by removing:
- Trailer keywords ("Official Trailer", "Teaser", "Clip", etc.)
- Years and dates
- Channel promotional text
- Resolution indicators ("4K", "HD", etc.)

**Example:**
- Input: `DUNE: PART TWO Official Trailer (2024) Denis Villeneuve`
- Output: `Dune: Part Two`

### Media Type Detection
The extension automatically detects whether a video is for a movie or TV show based on:
- Keywords like "season", "episode", "series"
- Title patterns
- Defaults to "movie" for ambiguous cases

## File Structure

```
spotseerr/
├── manifest.json              # Extension configuration
├── background.js              # Service worker for API calls
├── content.js                 # YouTube page interaction
├── popup/
│   ├── popup.html           # Extension popup UI
│   ├── popup.css            # Popup styles
│   └── popup.js             # Popup logic
├── options/
│   ├── options.html         # Settings page
│   ├── options.css          # Settings styles
│   └── options.js           # Settings logic
├── shared/
│   ├── api.js               # Overseerr API client
│   ├── storage.js           # Chrome storage wrapper
│   └── utils.js             # Utility functions
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/
    └── en/
        └── messages.json    # Translations
```

## Troubleshooting

### Extension Not Working

1. **Check Settings**: Ensure your Overseerr URL and API key are correct
2. **Test Connection**: Use the "Test Connection" button in settings
3. **Check Permissions**: Make sure the extension has permission to access youtube.com
4. **Reload Extension**: Go to `chrome://extensions/` and click the reload button

### "Cannot connect to Overseerr" Error

- Verify your Overseerr instance is accessible from your browser
- Check if your URL includes `http://` or `https://`
- Ensure your API key is correct and has proper permissions

### No Results Found

- The extension searches based on the cleaned video title
- Some videos may have titles that don't match Overseerr's database
- Try manually searching on your Overseerr instance

### Title Not Detected

- YouTube's page structure changes occasionally
- Try refreshing the page
- Ensure you're on a standard YouTube video page (not Shorts or Live)

## Privacy & Security

- **API Key Storage**: Your API key is stored in Chrome's encrypted sync storage
- **HTTPS Only**: The extension enforces HTTPS connections to Overseerr
- **No Data Collection**: The extension does not collect or transmit any data to third parties
- **Local Processing**: Title cleaning and detection happens locally in your browser

## Development

### Prerequisites
- Chrome or Edge browser
- Basic knowledge of JavaScript, HTML, and CSS

### Local Development
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the reload button on the extension
4. Test your changes

### Building for Production
No build step is required for this extension. It's designed to work directly as source files.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

See [LICENSE](LICENSE) file for details.

## Support

For issues related to:
- **This Extension**: Open an issue on GitHub
- **Overseerr**: Visit the [Overseerr documentation](https://docs.overseerr.dev) or [GitHub](https://github.com/sct/overseerr)

## Acknowledgments

- Built for the [Overseerr](https://overseerr.dev) community
- Uses the Overseerr API v1
- Icons and design inspired by Overseerr's UI
