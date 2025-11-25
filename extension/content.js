// Grammar Fixer Pro - Content Script
// Scans page for text inputs and manages correction workflow

class GrammarFixerContent {
  constructor() {
    this.textBoxes = [];
    this.currentIndex = 0;
    this.isScanning = false;
    this.API_BASE = 'http://localhost:8000';
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }
  
  handleMessage(request, sender, sendResponse) {
    console.log('Content script received message:', request.action);
    
    try {
      switch(request.action) {
        case 'scanTextBoxes':
          this.scanTextBoxes();
          sendResponse({success: true, count: this.textBoxes.length});
          break;
          
        case 'getNextTextBox':
          const textBox = this.getNextTextBox();
          if (textBox) {
            sendResponse({
              success: true,
              text: textBox.value || textBox.textContent,
              index: this.currentIndex,
              total: this.textBoxes.length
            });
          } else {
            sendResponse({success: false, message: 'No more text boxes'});
          }
          break;
          
        case 'applyCorrection':
          this.applyCorrection(request.correctedText);
          // Don't automatically move to next - stay on current text box
          sendResponse({success: true});
          break;
          
        case 'skipTextBox':
          this.moveToNext();
          sendResponse({success: true});
          break;
          
        case 'stayOnCurrentTextBox':
          // Reset current index to stay on the same text box
          if (this.textBoxes.length > 0) {
            this.currentIndex = 0;
            this.highlightTextBoxes();
          }
          sendResponse({success: true});
          break;
          
        case 'getStatus':
          sendResponse({
            total: this.textBoxes.length,
            current: this.currentIndex,
            hasMore: this.currentIndex < this.textBoxes.length
          });
          break;
          
        default:
          sendResponse({success: false, message: 'Unknown action'});
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({success: false, message: error.message});
    }
    
    return true; // Keep message channel open
  }
  
  scanTextBoxes() {
    // Clear previous scan
    this.clearHighlights();
    this.textBoxes = [];
    this.currentIndex = 0;
    
    // Find all text input elements
    const selectors = [
      'input[type="text"]',
      'input[type="email"]', 
      'input[type="search"]',
      'input:not([type])',
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable=""]'
    ];
    
    // Only work with the FIRST text box found
    let firstTextBox = null;
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Skip hidden or very small elements
        const rect = element.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 20) {
          const text = this.getElementText(element);
          if (text && text.trim().length > 5) { // Only include elements with meaningful text
            firstTextBox = element;
            break;
          }
        }
      }
      if (firstTextBox) break;
    }
    
    if (firstTextBox) {
      this.textBoxes.push(firstTextBox);
      console.log(`Grammar Fixer: Working with first text box only`);
      this.highlightTextBoxes();
    } else {
      console.log(`Grammar Fixer: No suitable text boxes found`);
    }
  }
  
  getElementText(element) {
    if (element.value !== undefined) {
      return element.value;
    } else if (element.textContent !== undefined) {
      return element.textContent;
    }
    return '';
  }
  
  setElementText(element, text) {
    if (element.value !== undefined) {
      element.value = text;
      // Trigger change event
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element.textContent !== undefined) {
      element.textContent = text;
      // Trigger input event for contenteditable
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  highlightTextBoxes() {
    this.textBoxes.forEach((element, index) => {
      element.classList.add('grammar-fixer-highlight');
      if (index === this.currentIndex) {
        element.classList.add('grammar-fixer-current');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  
  clearHighlights() {
    document.querySelectorAll('.grammar-fixer-highlight').forEach(element => {
      element.classList.remove('grammar-fixer-highlight', 'grammar-fixer-current');
    });
  }
  
  getNextTextBox() {
    if (this.currentIndex < this.textBoxes.length) {
      const element = this.textBoxes[this.currentIndex];
      return {
        element: element,
        value: this.getElementText(element),
        type: element.tagName.toLowerCase()
      };
    }
    return null;
  }
  
  applyCorrection(correctedText) {
    if (this.currentIndex < this.textBoxes.length) {
      const element = this.textBoxes[this.currentIndex];
      this.setElementText(element, correctedText);
      
      // Visual feedback
      element.style.transition = 'all 0.3s ease';
      element.style.backgroundColor = '#d4edda';
      element.style.borderColor = '#28a745';
      
      setTimeout(() => {
        element.style.backgroundColor = '';
        element.style.borderColor = '';
      }, 2000);
    }
  }
  
  moveToNext() {
    // Remove current highlight
    if (this.currentIndex < this.textBoxes.length) {
      this.textBoxes[this.currentIndex].classList.remove('grammar-fixer-current');
    }
    
    this.currentIndex++;
    
    // Add highlight to next element
    if (this.currentIndex < this.textBoxes.length) {
      const nextElement = this.textBoxes[this.currentIndex];
      nextElement.classList.add('grammar-fixer-current');
      nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // All done - clear highlights
      this.clearHighlights();
    }
  }
}

// Initialize content script
const grammarFixer = new GrammarFixerContent();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  grammarFixer.clearHighlights();
});