// Background service worker for Grammar Fixer Pro

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'fix-grammar',
    title: 'Fix Grammar with Grammar Fixer Pro',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'fix-grammar' && info.selectionText) {
    try {
      const settings = await chrome.storage.local.get(['apiUrl', 'naturalness', 'formality']);
      const apiUrl = settings.apiUrl || 'http://localhost:3000';
      const naturalness = settings.naturalness || 'medium';
      const formality = settings.formality || 'neutral';

      const response = await fetch(`${apiUrl}/api/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: info.selectionText,
          naturalness: naturalness,
          formality: formality
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Send corrected text to content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'showCorrectedText',
        originalText: info.selectionText,
        correctedText: data.correctedText
      });
    } catch (error) {
      console.error('Error correcting grammar:', error);
      chrome.tabs.sendMessage(tab.id, {
        action: 'showError',
        message: `Failed to correct grammar: ${error.message}`
      });
    }
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'correctGrammar') {
    handleGrammarCorrection(message.text, message.naturalness, message.formality)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleGrammarCorrection(text, naturalness, formality) {
  const settings = await chrome.storage.local.get(['apiUrl']);
  const apiUrl = settings.apiUrl || 'http://localhost:3000';

  const response = await fetch(`${apiUrl}/api/correct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      naturalness: naturalness || 'medium',
      formality: formality || 'neutral'
    })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return await response.json();
}
