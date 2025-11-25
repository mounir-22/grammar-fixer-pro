/**
 * Grammar Correction Service
 * 
 * This service handles grammar correction with LLM integration.
 * It supports naturalness and formality enhancements.
 */

// LLM provider configuration
const LLM_CONFIG = {
  provider: process.env.LLM_PROVIDER || 'openai',
  apiKey: process.env.LLM_API_KEY || '',
  model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
  baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
};

/**
 * Generate a system prompt based on naturalness and formality settings
 */
function generateSystemPrompt(options) {
  const { naturalness, formality } = options;

  let naturalnessBehavior = '';
  switch (naturalness) {
    case 'low':
      naturalnessBehavior = 'Make minimal changes, focusing only on grammar errors.';
      break;
    case 'medium':
      naturalnessBehavior = 'Fix grammar errors and improve sentence flow moderately.';
      break;
    case 'high':
      naturalnessBehavior = 'Fix grammar errors and significantly improve readability and flow while preserving the original meaning.';
      break;
  }

  let formalityBehavior = '';
  switch (formality) {
    case 'casual':
      formalityBehavior = 'Use a casual, conversational tone. Contractions are encouraged.';
      break;
    case 'neutral':
      formalityBehavior = 'Maintain a balanced tone appropriate for general communication.';
      break;
    case 'formal':
      formalityBehavior = 'Use formal language suitable for professional or academic contexts. Avoid contractions.';
      break;
  }

  return `You are a professional grammar correction assistant. Your task is to correct grammatical errors in the provided text while following these guidelines:

1. NATURALNESS: ${naturalnessBehavior}
2. FORMALITY: ${formalityBehavior}

Important rules:
- Preserve the original meaning and intent of the text
- Fix spelling, punctuation, and grammatical errors
- Do not add new information or change the subject matter
- Return ONLY the corrected text without explanations or annotations
- If the text is already correct, return it unchanged`;
}

/**
 * Call the LLM API to correct grammar
 */
async function callLLM(text, systemPrompt) {
  // If no API key is configured, use the fallback grammar correction
  if (!LLM_CONFIG.apiKey) {
    console.log('No LLM API key configured, using fallback grammar correction');
    return fallbackGrammarCorrection(text);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LLM_CONFIG.apiKey}`
  };

  const body = {
    model: LLM_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    temperature: 0.3,
    max_tokens: Math.max(text.length * 2, 1000)
  };

  try {
    const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LLM API error:', response.status, errorData);
      // Fall back to basic correction on API error
      return fallbackGrammarCorrection(text);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling LLM API:', error);
    // Fall back to basic correction on network error
    return fallbackGrammarCorrection(text);
  }
}

/**
 * Fallback grammar correction when LLM is not available
 * Implements basic rule-based corrections
 */
function fallbackGrammarCorrection(text) {
  let corrected = text;

  // Common grammar corrections
  const corrections = [
    // Double spaces
    { pattern: /\s{2,}/g, replacement: ' ' },
    // Capitalize first letter of sentences
    { pattern: /(?:^|[.!?]\s+)([a-z])/g, replacement: (match, p1) => match.slice(0, -1) + p1.toUpperCase() },
    // Space before punctuation
    { pattern: /\s+([.!?,;:])/g, replacement: '$1' },
    // Missing space after punctuation
    { pattern: /([.!?,;:])([A-Za-z])/g, replacement: '$1 $2' },
    // Common misspellings
    { pattern: /\bi\b/g, replacement: 'I' },
    { pattern: /\bteh\b/gi, replacement: 'the' },
    { pattern: /\brecieve\b/gi, replacement: 'receive' },
    { pattern: /\boccured\b/gi, replacement: 'occurred' },
    { pattern: /\bseperate\b/gi, replacement: 'separate' },
    { pattern: /\bdefinately\b/gi, replacement: 'definitely' },
    { pattern: /\buntill\b/gi, replacement: 'until' },
    { pattern: /\bwich\b/gi, replacement: 'which' },
    { pattern: /\bwether\b/gi, replacement: 'whether' },
    { pattern: /\bthier\b/gi, replacement: 'their' },
    { pattern: /\byour welcome\b/gi, replacement: 'you\'re welcome' },
    { pattern: /\bshould of\b/gi, replacement: 'should have' },
    { pattern: /\bcould of\b/gi, replacement: 'could have' },
    { pattern: /\bwould of\b/gi, replacement: 'would have' },
    // Its vs it's
    { pattern: /\bits\s+(?=a\s|an\s|the\s|not\s|been\s|going\s|been\s)/gi, replacement: 'it\'s ' },
    // Then vs than in comparisons
    { pattern: /\bbetter then\b/gi, replacement: 'better than' },
    { pattern: /\bmore then\b/gi, replacement: 'more than' },
    { pattern: /\bless then\b/gi, replacement: 'less than' },
    // Affect vs effect
    { pattern: /\beffect\s+(?=on|the|your|my|our|his|her)/gi, replacement: 'affect ' },
    // A lot (not alot)
    { pattern: /\balot\b/gi, replacement: 'a lot' }
  ];

  for (const { pattern, replacement } of corrections) {
    corrected = corrected.replace(pattern, replacement);
  }

  // Ensure first character is capitalized
  if (corrected.length > 0 && /[a-z]/.test(corrected[0])) {
    corrected = corrected[0].toUpperCase() + corrected.slice(1);
  }

  return corrected;
}

/**
 * Main function to correct grammar
 */
async function correctGrammar(text, options = {}) {
  const { naturalness = 'medium', formality = 'neutral' } = options;

  if (!text || text.trim().length === 0) {
    return text;
  }

  const systemPrompt = generateSystemPrompt({ naturalness, formality });
  const correctedText = await callLLM(text, systemPrompt);

  return correctedText;
}

module.exports = {
  correctGrammar,
  generateSystemPrompt,
  fallbackGrammarCorrection,
  LLM_CONFIG
};
