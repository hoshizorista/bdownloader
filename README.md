# BDownloader

A Chrome extension to download view-only Google Drive files.

## Features

- Download view-only Google Drive videos/files
- Multi-chunk parallel downloads with progress tracking
- Automatic file name detection
- Keyboard shortcut: `Ctrl+Shift+D` to quick download

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `bustdownloader` folder
5. The extension icon should appear in your toolbar

## Usage

### Method 1: Manual URL Entry
1. Click the BDownloader icon in your toolbar
2. Paste a Google Drive URL or file ID
3. Adjust chunk settings if needed (default: 4 chunks, 1024KB chunk size)
4. Click **Extract & Download**

### Method 2: Auto-fill from Tab
1. Navigate to a Google Drive file page
2. Click the BDownloader icon
3. Click **Get from Current Tab**
4. Click **Extract & Download**

### Method 3: Keyboard Shortcut
1. Navigate to a Google Drive file page
2. Press `Ctrl+Shift+D` to start download immediately

## Supported URLs

- `https://drive.google.com/file/d/{FILE_ID}/view`
- `https://drive.google.com/file/d/{FILE_ID}`
- `https://docs.google.com/file/d/{FILE_ID}`
- Direct file IDs (25+ alphanumeric characters)

## Settings

- **Chunks**: Number of parallel download connections (1-16)
- **Chunk Size**: Size of each chunk in KB (default: 1024)

Higher chunk counts can improve download speed for large files.

## Limitations

- Only works with files that have view access (not restricted)
- Some heavily restricted files may not be downloadable
- Very large files (>2GB) may require adjusting chunk settings

## Troubleshooting

### "Could not extract video URL"
- Make sure the file is accessible and you have view permission
- Try opening the file in a new tab first
- Check if the file is a Google Docs/Sheets (not supported)

### Download fails or is slow
- Reduce the number of chunks
- Increase chunk size
- Check your internet connection

## Development

### File Structure
```
bustdownloader/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── background.js      # Service worker (download logic)
├── content.js         # Content script for page interaction
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Building
No build process required. Load the folder directly as an unpacked extension.

## License

MIT License

## Credits

Based on the Python bustdownloader script.
