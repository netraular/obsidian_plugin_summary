# Voice Note Webhook

An Obsidian plugin that automatically sends voice recordings to a webhook when added to date-titled notes (YYYY-MM-DD format) and inserts the transcription response below the audio.

## Features

- **Automatic detection**: Monitors notes with date-formatted titles (e.g., `2026-01-05.md`) for new audio recordings
- **Webhook integration**: Sends audio files to a configurable webhook URL (designed for n8n workflows)
- **Transcription insertion**: Automatically inserts the transcription text returned by the webhook below the audio embed
- **Configurable settings**: 
  - Webhook URL
  - API Key for authentication
  - Language code for transcription

## How it works

1. When you add an audio recording to a note with a date title (format: `YYYY-MM-DD`), the plugin detects the new audio embed (e.g., `![[Recording 20260105012858.m4a]]`)
2. The audio file is sent to your configured webhook as FormData
3. If the webhook response contains a `text` field, it's automatically inserted below the audio in your note

## Installation

### Manual installation

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder in your vault: `<vault>/.obsidian/plugins/voice-note-webhook/`
3. Copy the downloaded files into that folder
4. Reload Obsidian
5. Enable the plugin in **Settings → Community plugins**

### Development

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start development mode with auto-rebuild
4. Copy the built files to your vault's plugins folder

## Configuration

Go to **Settings → Voice Note Webhook** to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Webhook URL | The n8n webhook URL to send audio files to | - |
| API Key | Authentication key sent in `obsidian_vault` header | - |
| Language | Language code for transcription (es, en, fr, etc.) | `es` |

## Webhook Request Format

The plugin sends a `POST` request with `multipart/form-data` containing:

| Field | Description |
|-------|-------------|
| `audio` | The audio file binary |
| `action` | `"audio_file_upload"` |
| `audioFileName` | Name of the audio file |
| `noteFileName` | Name of the note (the date) |
| `noteDate` | The date from the note title |
| `mimeType` | Audio MIME type (e.g., `audio/mp4`) |
| `language` | Configured language code |
| `timestamp` | ISO timestamp of the request |

### Headers

- `obsidian_vault`: Your configured API key

### Expected Response

The webhook should return JSON with:

```json
{
  "text": "The transcribed text to insert in the note",
  "answer": "Optional success message to display"
}
```

## Commands

- **Test webhook connection**: Tests the connection to your configured webhook

## Supported Audio Formats

- `.m4a`
- `.mp3`
- `.wav`
- `.webm`
- `.ogg`

## Building

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build
```

## License

MIT
