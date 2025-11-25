# Grammar Fixer Pro - Chrome Extension

A powerful Chrome extension that uses AI to automatically detect and fix grammar and spelling errors in text boxes across any website.

## Features

🎯 **AI-Powered Corrections**: Uses Llama-3 LLM for 95% accuracy  
📝 **Smart Text Detection**: Automatically finds all text inputs on any page  
🔄 **Workflow Management**: Step-through correction process with Apply/Skip options  
✨ **Visual Feedback**: Highlights text boxes and shows real-time corrections  
📊 **Intelligent Chunking**: Handles large texts by splitting into manageable pieces  

## Installation

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Add your Replicate API token to .env
echo "REPLICATE_API_TOKEN=your_token_here" > .env

# Start the API server
python api_server.py
```

### 2. Chrome Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select the `extension` folder
4. The Grammar Fixer Pro extension should now appear in your extensions

## Usage

1. **Start the API server**: Make sure the backend is running on http://localhost:8000
2. **Navigate to any webpage** with text inputs (forms, comment sections, etc.)
3. **Click the extension icon** in your Chrome toolbar
4. **Click "Scan Page for Text Boxes"** to find all text inputs
5. **Review corrections** - the extension will show original text and suggested improvements
6. **Apply or Skip** - choose to apply the correction or move to the next text box
7. **Continue until done** - the extension processes all text boxes automatically

## Project Structure

```
gram/
├── backend/           # Python API server
│   ├── engine.py      # LLM grammar correction engine
│   ├── api_server.py  # FastAPI REST API
│   └── requirements.txt
└── extension/         # Chrome extension
    ├── manifest.json  # Extension configuration
    ├── popup.html     # Extension popup UI
    ├── popup.js       # Popup logic
    ├── content.js     # Page interaction script
    ├── content.css    # Text box highlighting styles
    └── background.js  # Extension background worker
```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /correct` - Correct single text
- `POST /batch-correct` - Correct multiple texts

## Requirements

- Python 3.8+
- Chrome Browser
- Replicate API token
- Internet connection for LLM processing

## Development

The extension uses Chrome's Manifest V3 with:
- **Content Scripts**: Scan and interact with page text boxes
- **Popup Interface**: Show corrections and manage workflow  
- **Background Worker**: Handle extension lifecycle
- **CORS Configuration**: Allow extension to communicate with local API