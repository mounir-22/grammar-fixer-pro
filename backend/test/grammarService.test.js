const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  fallbackGrammarCorrection,
  generateSystemPrompt
} = require('../services/grammarService');

describe('Grammar Service', () => {
  describe('fallbackGrammarCorrection', () => {
    it('should fix double spaces', () => {
      const input = 'Hello  world';
      const result = fallbackGrammarCorrection(input);
      assert.strictEqual(result, 'Hello world');
    });

    it('should capitalize first letter of sentence', () => {
      const input = 'hello world';
      const result = fallbackGrammarCorrection(input);
      assert.strictEqual(result, 'Hello world');
    });

    it('should fix lowercase "i"', () => {
      const input = 'i think i am right';
      const result = fallbackGrammarCorrection(input);
      assert.ok(result.includes('I think'));
    });

    it('should fix common misspellings', () => {
      assert.strictEqual(
        fallbackGrammarCorrection('teh quick brown fox'),
        'The quick brown fox'
      );
      assert.strictEqual(
        fallbackGrammarCorrection('I recieve mail'),
        'I receive mail'
      );
      assert.strictEqual(
        fallbackGrammarCorrection('definately right'),
        'Definitely right'
      );
    });

    it('should fix "should of" to "should have"', () => {
      const input = 'I should of known';
      const result = fallbackGrammarCorrection(input);
      assert.strictEqual(result, 'I should have known');
    });

    it('should fix "alot" to "a lot"', () => {
      const input = 'I have alot of work';
      const result = fallbackGrammarCorrection(input);
      assert.strictEqual(result, 'I have a lot of work');
    });

    it('should fix "then" vs "than" in comparisons', () => {
      const input = 'This is better then that';
      const result = fallbackGrammarCorrection(input);
      assert.strictEqual(result, 'This is better than that');
    });

    it('should handle empty string', () => {
      const input = '';
      const result = fallbackGrammarCorrection(input);
      assert.strictEqual(result, '');
    });

    it('should remove space before punctuation', () => {
      const input = 'Hello world .';
      const result = fallbackGrammarCorrection(input);
      assert.strictEqual(result, 'Hello world.');
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate prompt with low naturalness', () => {
      const prompt = generateSystemPrompt({ naturalness: 'low', formality: 'neutral' });
      assert.ok(prompt.includes('minimal changes'));
    });

    it('should generate prompt with high naturalness', () => {
      const prompt = generateSystemPrompt({ naturalness: 'high', formality: 'neutral' });
      assert.ok(prompt.includes('significantly improve'));
    });

    it('should generate prompt with casual formality', () => {
      const prompt = generateSystemPrompt({ naturalness: 'medium', formality: 'casual' });
      assert.ok(prompt.includes('casual'));
      assert.ok(prompt.includes('Contractions'));
    });

    it('should generate prompt with formal formality', () => {
      const prompt = generateSystemPrompt({ naturalness: 'medium', formality: 'formal' });
      assert.ok(prompt.includes('formal language'));
      assert.ok(prompt.includes('Avoid contractions'));
    });
  });
});
