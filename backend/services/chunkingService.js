/**
 * Text Chunking Service
 * 
 * Implements intelligent chunking for long texts to handle
 * LLM token limits and improve processing quality.
 */

// Configuration
const CHUNK_CONFIG = {
  maxChunkSize: parseInt(process.env.MAX_CHUNK_SIZE) || 2000,
  minChunkSize: parseInt(process.env.MIN_CHUNK_SIZE) || 100,
  overlapSize: parseInt(process.env.OVERLAP_SIZE) || 50
};

/**
 * Find the best split point near the target position
 * Prioritizes sentence boundaries, then clause boundaries, then word boundaries
 */
function findBestSplitPoint(text, targetPosition, maxLookback = 200) {
  // If target is beyond text length, return text length
  if (targetPosition >= text.length) {
    return text.length;
  }

  // Search window
  const searchStart = Math.max(0, targetPosition - maxLookback);
  const searchEnd = Math.min(text.length, targetPosition + 50);
  const searchText = text.slice(searchStart, searchEnd);
  const baseOffset = searchStart;

  // Priority 1: Sentence boundaries (. ! ?)
  const sentencePattern = /[.!?]\s+/g;
  let match;
  let bestSentenceEnd = -1;
  
  while ((match = sentencePattern.exec(searchText)) !== null) {
    const absolutePosition = baseOffset + match.index + match[0].length;
    if (absolutePosition <= targetPosition + 50) {
      bestSentenceEnd = absolutePosition;
    }
  }

  if (bestSentenceEnd > 0 && bestSentenceEnd >= targetPosition - maxLookback) {
    return bestSentenceEnd;
  }

  // Priority 2: Clause boundaries (; : , - )
  const clausePattern = /[;:,\-]\s+/g;
  let bestClauseEnd = -1;
  
  while ((match = clausePattern.exec(searchText)) !== null) {
    const absolutePosition = baseOffset + match.index + match[0].length;
    if (absolutePosition <= targetPosition + 30) {
      bestClauseEnd = absolutePosition;
    }
  }

  if (bestClauseEnd > 0 && bestClauseEnd >= targetPosition - maxLookback) {
    return bestClauseEnd;
  }

  // Priority 3: Word boundaries (spaces)
  const wordPattern = /\s+/g;
  let bestWordEnd = -1;
  
  while ((match = wordPattern.exec(searchText)) !== null) {
    const absolutePosition = baseOffset + match.index + match[0].length;
    if (absolutePosition <= targetPosition + 10) {
      bestWordEnd = absolutePosition;
    }
  }

  if (bestWordEnd > 0) {
    return bestWordEnd;
  }

  // Fallback: return target position
  return targetPosition;
}

/**
 * Split text into intelligently-sized chunks
 * Respects sentence and paragraph boundaries where possible
 */
function chunkText(text, options = {}) {
  const {
    maxChunkSize = CHUNK_CONFIG.maxChunkSize,
    minChunkSize = CHUNK_CONFIG.minChunkSize
  } = options;

  // If text is short enough, return as single chunk
  if (!text || text.length <= maxChunkSize) {
    return text ? [text] : [];
  }

  const chunks = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    // Determine chunk end position
    const remainingLength = text.length - currentPosition;
    
    if (remainingLength <= maxChunkSize) {
      // Last chunk - take everything remaining
      chunks.push(text.slice(currentPosition).trim());
      break;
    }

    // Find the best split point
    const targetEnd = currentPosition + maxChunkSize;
    const splitPoint = findBestSplitPoint(text, targetEnd);

    // Extract chunk
    let chunk = text.slice(currentPosition, splitPoint).trim();

    // Handle edge case where chunk is too small
    if (chunk.length < minChunkSize && chunks.length > 0) {
      // Append to previous chunk if too small
      chunks[chunks.length - 1] += ' ' + chunk;
    } else if (chunk.length > 0) {
      chunks.push(chunk);
    }

    currentPosition = splitPoint;

    // Safety check to prevent infinite loop
    if (splitPoint <= currentPosition && currentPosition < text.length) {
      currentPosition++;
    }
  }

  return chunks;
}

/**
 * Split text by paragraphs first, then chunk if needed
 */
function chunkByParagraphs(text, options = {}) {
  const { maxChunkSize = CHUNK_CONFIG.maxChunkSize } = options;

  if (!text) return [];

  // Split by paragraph breaks
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If paragraph alone exceeds max size, chunk it
    if (paragraph.length > maxChunkSize) {
      // Save current chunk if not empty
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // Chunk the large paragraph
      const paragraphChunks = chunkText(paragraph, options);
      chunks.push(...paragraphChunks);
      continue;
    }

    // Check if adding this paragraph would exceed max size
    const potentialChunk = currentChunk 
      ? `${currentChunk}\n\n${paragraph}`
      : paragraph;

    if (potentialChunk.length > maxChunkSize) {
      // Save current chunk and start new one
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Estimate token count (rough approximation)
 * Average English word is ~1.3 tokens
 */
function estimateTokenCount(text) {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return Math.ceil(words.length * 1.3);
}

module.exports = {
  chunkText,
  chunkByParagraphs,
  findBestSplitPoint,
  estimateTokenCount,
  CHUNK_CONFIG
};
