// Grammar Fixer Pro - Background Service Worker
// Handles extension lifecycle and communication

chrome.runtime.onInstalled.addListener(() => {
  console.log('Grammar Fixer Pro installed successfully!');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup (default behavior)
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'getTabId':
      sendResponse({ tabId: sender.tab.id });
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
  
  return true;
});