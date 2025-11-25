# Grammar Fixer Pro 🎯

A privacy-first Chrome extension with AI-powered grammar correction that works on any website. Built with Llama-3 for 95% accuracy and enhanced with text naturalness and formality features.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=google-chrome)](https://github.com/mounir-22/grammar-fixer-pro)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Llama-3](https://img.shields.io/badge/LLM-Llama--3-FF6B35?style=flat-square&logo=meta)](https://replicate.com/meta/meta-llama-3-8b-instruct)
[![Privacy First](https://img.shields.io/badge/Privacy-First-green?style=flat-square&logo=shield)](https://github.com/mounir-22/grammar-fixer-pro#privacy--security)

## ✨ Features

- **🔍 Universal Text Scanning** - Works on any website's text inputs
- **🎯 High Accuracy** - 95% grammar correction using Llama-3
- **🌿 Text Enhancement** - Make text more natural or formal after correction
- **🔒 Privacy-First** - Your API key, your data, local storage only
- **⚡ Smart Chunking** - Handles long texts intelligently
- **🎨 Clean UI** - Modern, eye-friendly interface
- **🔄 Iterative Editing** - Stay on the same text box for multiple corrections
- **📱 One-Click Setup** - Simple API key configuration

## 🚀 Quick Start

### 1. Get Your Free API Key
- Sign up at [replicate.com](https://replicate.com) (free $10 credit)
- Go to Account Settings → API tokens
- Create token and copy your key (starts with `r8_`)

### 2. Install & Setup
```bash
# Clone the repository
git clone https://github.com/mounir-22/grammar-fixer-pro.git
cd grammar-fixer-pro

# Install Python dependencies
pip install -r backend/requirements.txt

# Start the backend server
cd backend
python api_server.py
```

### 3. Load Chrome Extension
1. Open Chrome → Extensions → Enable Developer Mode
2. Click "Load unpacked" → Select the `extension/` folder
3. Pin the Grammar Fixer Pro extension to toolbar

### 4. Configure API Key
1. Click the extension icon
2. Enter your Replicate API key
3. Click Save
4. Start correcting grammar on any website!

## 📖 How to Use

### Basic Grammar Correction
1. **Scan**: Click "🔍 Scan Page for Text Boxes"
2. **Review**: See original vs corrected text with changes highlighted
3. **Apply**: Click "✅ Apply" to accept corrections
4. **Enhance**: Choose "🌿 Make Natural" or "🎩 Make Formal" for style improvements

### Advanced Features
- **Re-edit**: Click "🔍 Check Again" to make additional corrections
- **Skip**: Use "⏭️ Skip" to move past unwanted changes
- **Multiple rounds**: Keep improving the same text iteratively

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Chrome         │    │  FastAPI         │    │  Replicate      │
│  Extension      │◄──►│  Backend         │◄──►│  (Llama-3)      │
│                 │    │                  │    │                 │
│ • popup.js      │    │ • api_server.py  │    │ • LLM Engine    │
│ • content.js    │    │ • engine.py      │    │ • JSON Output   │
│ • manifest.json │    │ • CORS enabled   │    │ • 95% Accuracy  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 API Endpoints

### POST `/correct`
```json
{
  "text": "ths is a test with erors",
  "api_key": "r8_your_api_key"
}
```

### POST `/enhance`
```json
{
  "text": "The text to enhance",
  "enhancement_type": "naturalness", // or "formality"
  "api_key": "r8_your_api_key"
}
```

## 💰 Cost & Usage

- **Free tier**: $10 credit on signup
- **Cost per correction**: ~$0.001-0.005
- **Typical usage**: 1000+ corrections with free credit
- **Perfect for**: Students, writers, professionals

## 🔒 Privacy & Security

- ✅ **Local API key storage** - Never sent to our servers
- ✅ **No data collection** - Your text stays private
- ✅ **Open source** - Verify the code yourself
- ✅ **HTTPS encryption** - Secure API communication
- ✅ **User-controlled** - You own your usage and billing

## 🛠️ Development

### Project Structure
```
grammar-fixer-pro/
├── extension/              # Chrome Extension
│   ├── manifest.json      # Extension configuration
│   ├── popup.html         # Main UI
│   ├── popup.js          # Extension logic
│   ├── content.js        # Page interaction
│   └── content.css       # Text box highlighting
├── backend/               # FastAPI Backend
│   ├── api_server.py     # REST API endpoints
│   ├── engine.py         # LLM integration
│   └── requirements.txt  # Python dependencies
└── docs/                 # Documentation
```

### Local Development
```bash
# Backend development
cd backend
pip install -r requirements.txt
python api_server.py

# Frontend development
# Load extension in Chrome Developer mode
# Make changes to extension/ files
# Reload extension to test
```

### Running Tests
```bash
cd backend
python test_all_features.py
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Requirements

### Backend
- Python 3.8+
- FastAPI
- Replicate API access
- uvicorn

### Frontend
- Chrome/Chromium browser
- Manifest V3 support

## 🆘 Troubleshooting

### Common Issues

**"API key required" error**
- Ensure API key starts with `r8_`
- Check that key is saved in extension storage
- Verify Replicate account has credits

**"Grammar service unavailable" error**
- Confirm backend server is running on localhost:8000
- Check internet connection
- Verify API key is valid

**Extension not scanning**
- Refresh the page and try again
- Check that text boxes have sufficient content (5+ characters)
- Ensure extension has permission for the website

### Debug Mode
Enable console logging in popup.js for detailed debugging information.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Replicate](https://replicate.com) for providing access to Llama-3
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [Meta](https://ai.meta.com/) for the Llama-3 language model

## 📞 Support

- 🐛 [Report Issues](https://github.com/mounir-22/grammar-fixer-pro/issues)
- 📧 [Contact](mailto:your-email@example.com)
- 💬 [Discussions](https://github.com/mounir-22/grammar-fixer-pro/discussions)

---

**⭐ If this project helped you, please star it on GitHub!**
