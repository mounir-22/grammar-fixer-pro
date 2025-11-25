const express = require('express');
const cors = require('cors');
const { correctGrammar } = require('./services/grammarService');
const { chunkText } = require('./services/chunkingService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main grammar correction endpoint
app.post('/api/correct', async (req, res) => {
  try {
    const { text, naturalness = 'medium', formality = 'neutral' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text field is required and must be a string'
      });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text cannot be empty'
      });
    }

    // Validate naturalness and formality options
    const validNaturalness = ['low', 'medium', 'high'];
    const validFormality = ['casual', 'neutral', 'formal'];

    if (!validNaturalness.includes(naturalness)) {
      return res.status(400).json({
        error: 'Invalid option',
        message: `Naturalness must be one of: ${validNaturalness.join(', ')}`
      });
    }

    if (!validFormality.includes(formality)) {
      return res.status(400).json({
        error: 'Invalid option',
        message: `Formality must be one of: ${validFormality.join(', ')}`
      });
    }

    // Process the text with intelligent chunking for long texts
    const chunks = chunkText(text);
    const correctedChunks = [];

    for (const chunk of chunks) {
      const corrected = await correctGrammar(chunk, { naturalness, formality });
      correctedChunks.push(corrected);
    }

    const correctedText = correctedChunks.join(' ');

    res.json({
      originalText: text,
      correctedText: correctedText,
      options: { naturalness, formality },
      chunksProcessed: chunks.length
    });
  } catch (error) {
    console.error('Error processing grammar correction:', error);
    res.status(500).json({
      error: 'Processing error',
      message: error.message || 'An error occurred while processing your text'
    });
  }
});

// Chunking endpoint (for testing/debugging)
app.post('/api/chunk', (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text field is required and must be a string'
      });
    }

    const chunks = chunkText(text);
    res.json({
      originalLength: text.length,
      chunks: chunks,
      chunkCount: chunks.length
    });
  } catch (error) {
    console.error('Error chunking text:', error);
    res.status(500).json({
      error: 'Chunking error',
      message: error.message || 'An error occurred while chunking your text'
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Grammar Fixer Pro backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api/correct`);
  });
}

module.exports = app;
