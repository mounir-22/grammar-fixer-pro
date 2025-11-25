const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  chunkText,
  chunkByParagraphs,
  findBestSplitPoint,
  estimateTokenCount
} = require('../services/chunkingService');

describe('Chunking Service', () => {
  describe('chunkText', () => {
    it('should return single chunk for short text', () => {
      const text = 'This is a short text.';
      const chunks = chunkText(text, { maxChunkSize: 100 });
      assert.strictEqual(chunks.length, 1);
      assert.strictEqual(chunks[0], text);
    });

    it('should return empty array for empty text', () => {
      const chunks = chunkText('');
      assert.strictEqual(chunks.length, 0);
    });

    it('should return empty array for null text', () => {
      const chunks = chunkText(null);
      assert.strictEqual(chunks.length, 0);
    });

    it('should split long text into multiple chunks', () => {
      const text = 'This is sentence one. This is sentence two. This is sentence three. This is sentence four. This is sentence five.';
      const chunks = chunkText(text, { maxChunkSize: 50, minChunkSize: 10 });
      assert.ok(chunks.length > 1);
    });

    it('should preserve all content after chunking', () => {
      const text = 'First sentence here. Second sentence follows. Third one comes next. Fourth is last.';
      const chunks = chunkText(text, { maxChunkSize: 100, minChunkSize: 10 });
      const rejoined = chunks.join(' ');
      // Check that key words are preserved
      assert.ok(rejoined.includes('First'));
      assert.ok(rejoined.includes('Fourth'));
    });

    it('should split at sentence boundaries when possible', () => {
      const text = 'This is the first sentence. This is the second sentence. This is the third sentence.';
      const chunks = chunkText(text, { maxChunkSize: 60, minChunkSize: 10 });
      // Each chunk should end with proper sentence ending or be the last chunk
      for (let i = 0; i < chunks.length - 1; i++) {
        assert.ok(
          chunks[i].endsWith('.') || chunks[i].endsWith('!') || chunks[i].endsWith('?'),
          `Chunk ${i} should end with sentence boundary: "${chunks[i]}"`
        );
      }
    });
  });

  describe('chunkByParagraphs', () => {
    it('should split by paragraph breaks', () => {
      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const chunks = chunkByParagraphs(text, { maxChunkSize: 1000 });
      assert.strictEqual(chunks.length, 1); // All fit in one chunk
      assert.ok(chunks[0].includes('First'));
      assert.ok(chunks[0].includes('Third'));
    });

    it('should create separate chunks when paragraphs exceed size', () => {
      const text = 'First paragraph content here.\n\nSecond paragraph content here.\n\nThird paragraph content here.';
      const chunks = chunkByParagraphs(text, { maxChunkSize: 50 });
      assert.ok(chunks.length >= 2);
    });

    it('should handle single paragraph', () => {
      const text = 'This is just one paragraph.';
      const chunks = chunkByParagraphs(text, { maxChunkSize: 1000 });
      assert.strictEqual(chunks.length, 1);
      assert.strictEqual(chunks[0], text);
    });

    it('should handle empty text', () => {
      const chunks = chunkByParagraphs('');
      assert.strictEqual(chunks.length, 0);
    });
  });

  describe('findBestSplitPoint', () => {
    it('should find sentence boundary', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const splitPoint = findBestSplitPoint(text, 20);
      // Should find a sentence boundary within the search window
      // The function finds the last sentence boundary before targetPosition + 50
      assert.ok(splitPoint >= 16 && splitPoint <= 35);
    });

    it('should return text length if target is beyond text', () => {
      const text = 'Short text.';
      const splitPoint = findBestSplitPoint(text, 100);
      assert.strictEqual(splitPoint, text.length);
    });

    it('should handle text without sentence boundaries', () => {
      const text = 'word1 word2 word3 word4 word5 word6';
      const splitPoint = findBestSplitPoint(text, 15);
      // Should find a word boundary
      assert.ok(text[splitPoint - 1] === ' ' || splitPoint === 15);
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate token count for text', () => {
      const text = 'This is a five word sentence';
      const estimate = estimateTokenCount(text);
      // 5 words * 1.3 ≈ 7 tokens
      assert.ok(estimate >= 6 && estimate <= 8);
    });

    it('should return 0 for empty text', () => {
      assert.strictEqual(estimateTokenCount(''), 0);
    });

    it('should return 0 for null text', () => {
      assert.strictEqual(estimateTokenCount(null), 0);
    });
  });
});
