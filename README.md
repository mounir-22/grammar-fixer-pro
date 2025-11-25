# Grammar Fixer Pro

Chrome extension + LLM backend for high-accuracy grammar correction, with post-correction "naturalness" and "formality" enhancements and intelligent chunking for long texts.

## Features

- **Grammar Correction**: Leverages LLM (OpenAI-compatible APIs) for high-accuracy grammar correction
- **Naturalness Enhancement**: Adjustable levels (low, medium, high) to control how much the text is improved for natural flow
- **Formality Control**: Switch between casual, neutral, and formal tones
- **Intelligent Chunking**: Automatically splits long texts at sentence boundaries for optimal processing
- **Context Menu Integration**: Right-click to fix selected text on any webpage
- **Fallback Correction**: Built-in rule-based correction when LLM is unavailable

## Project Structure

```
grammar-fixer-pro/
├── extension/           # Chrome extension
│   ├── manifest.json    # Extension manifest (v3)
│   ├── popup.html       # Extension popup UI
│   ├── popup.css        # Popup styles
│   ├── popup.js         # Popup logic
│   ├── background.js    # Service worker
│   ├── content.js       # Content script
│   ├── styles.css       # Content styles
│   └── icons/           # Extension icons
├── backend/             # Node.js backend server
│   ├── server.js        # Express server
│   ├── package.json     # Dependencies
│   ├── services/
│   │   ├── grammarService.js    # Grammar correction logic
│   │   └── chunkingService.js   # Text chunking logic
│   └── test/            # Test files
└── README.md
```

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   ```bash
   export LLM_API_KEY=your_openai_api_key
   export LLM_MODEL=gpt-3.5-turbo  # or gpt-4
   export LLM_BASE_URL=https://api.openai.com/v1
   export PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`.

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension icon will appear in your toolbar

## Usage

### Using the Popup

1. Click the Grammar Fixer Pro extension icon
2. Enter or paste text in the input field
3. Select naturalness level (Low, Medium, High)
4. Select formality (Casual, Neutral, Formal)
5. Click "Fix Grammar"
6. Copy the corrected text to clipboard

### Using Context Menu

1. Select text on any webpage
2. Right-click to open the context menu
3. Click "Fix Grammar with Grammar Fixer Pro"
4. A tooltip will show the corrected text

### Settings

- **Backend URL**: Configure the API endpoint (default: `http://localhost:3000`)
- Settings are saved automatically in Chrome storage

## API Endpoints

### `POST /api/correct`

Correct grammar in text.

**Request:**
```json
{
  "text": "your text here",
  "naturalness": "medium",
  "formality": "neutral"
}
```

**Response:**
```json
{
  "originalText": "your text here",
  "correctedText": "Your text here.",
  "options": {
    "naturalness": "medium",
    "formality": "neutral"
  },
  "chunksProcessed": 1
}
```

### `POST /api/chunk`

Split text into chunks (for debugging).

**Request:**
```json
{
  "text": "your long text here..."
}
```

**Response:**
```json
{
  "originalLength": 100,
  "chunks": ["chunk1...", "chunk2..."],
  "chunkCount": 2
}
```

### `GET /health`

Health check endpoint.

## Configuration Options

### Naturalness Levels

- **Low**: Minimal changes, only fixes grammar errors
- **Medium**: Fixes errors and improves sentence flow
- **High**: Comprehensive improvements to readability and flow

### Formality Levels

- **Casual**: Conversational tone, contractions encouraged
- **Neutral**: Balanced tone for general communication
- **Formal**: Professional/academic language, no contractions

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `LLM_PROVIDER` | `openai` | LLM provider name |
| `LLM_API_KEY` | - | API key for LLM service |
| `LLM_MODEL` | `gpt-3.5-turbo` | Model to use |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | API base URL |
| `MAX_CHUNK_SIZE` | `2000` | Maximum characters per chunk |
| `MIN_CHUNK_SIZE` | `100` | Minimum characters per chunk |

## Running Tests

```bash
cd backend
npm test
```

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Extension Development

After making changes to the extension:
1. Go to `chrome://extensions/`
2. Click the refresh icon on the Grammar Fixer Pro card

## License

MIT
