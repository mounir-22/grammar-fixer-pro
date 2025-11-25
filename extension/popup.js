// Grammar Fixer Pro - Popup Script
// Manages the correction interface and communication with content script

class GrammarFixerPopup {
  constructor() {
    this.API_BASE = 'http://localhost:8000';
    this.currentText = '';
    this.correctionResult = null;
    this.apiKey = '';
    
    this.initializeElements();
    this.bindEvents();
    this.loadApiKey();
    this.updateStatus();
  }
  
  initializeElements() {
    this.scanBtn = document.getElementById('scan-btn');
    this.status = document.getElementById('status');
    this.correctionSection = document.getElementById('correction-section');
    this.originalText = document.getElementById('original-text');
    this.correctedText = document.getElementById('corrected-text');
    this.changesList = document.getElementById('changes-list');
    this.applyBtn = document.getElementById('apply-btn');
    this.skipBtn = document.getElementById('skip-btn');
    this.loading = document.getElementById('loading');
    
    // API Key elements
    this.apiKeyInput = document.getElementById('api-key-input');
    this.saveApiKeyBtn = document.getElementById('save-api-key-btn');
    this.apiKeyStatus = document.getElementById('api-key-status');
    
    // Enhancement elements - Fixed naming conflict
    this.enhancementSection = document.getElementById('enhancement-section');
    this.currentTextElement = document.getElementById('current-text'); // Changed name to avoid conflict
    this.enhanceNaturalBtn = document.getElementById('enhance-natural-btn');
    this.enhanceFormalBtn = document.getElementById('enhance-formal-btn');
    this.continueBtn = document.getElementById('continue-btn');
    
    this.enhancementResultSection = document.getElementById('enhancement-result-section');
    this.enhancedText = document.getElementById('enhanced-text');
    this.enhancementChanges = document.getElementById('enhancement-changes');
    this.applyEnhancementBtn = document.getElementById('apply-enhancement-btn');
    this.skipEnhancementBtn = document.getElementById('skip-enhancement-btn');
    
    // Debug: Check if elements exist
    console.log('🔍 Element check:');
    console.log('  correctionSection:', !!this.correctionSection);
    console.log('  originalText:', !!this.originalText);
    console.log('  correctedText:', !!this.correctedText);
    console.log('  changesList:', !!this.changesList);
  }
  
  bindEvents() {
    this.scanBtn.addEventListener('click', () => this.startScanning());
    this.applyBtn.addEventListener('click', () => this.applyCorrection());
    this.skipBtn.addEventListener('click', () => this.skipTextBox());
    
    // API Key events
    this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
    this.apiKeyInput.addEventListener('input', () => this.onApiKeyInput());
    
    // Enhancement events
    this.enhanceNaturalBtn.addEventListener('click', () => this.enhanceText('naturalness'));
    this.enhanceFormalBtn.addEventListener('click', () => this.enhanceText('formality'));
    this.continueBtn.addEventListener('click', () => this.showEnhancementOptions());
    this.applyEnhancementBtn.addEventListener('click', () => this.applyEnhancement());
    this.skipEnhancementBtn.addEventListener('click', () => this.skipEnhancement());
  }
  
  async loadApiKey() {
    try {
      const result = await chrome.storage.local.get(['replicateApiKey']);
      if (result.replicateApiKey) {
        this.apiKey = result.replicateApiKey;
        this.apiKeyInput.value = this.apiKey;
        this.updateApiKeyStatus('API key loaded', 'success');
        this.scanBtn.disabled = false;
      } else {
        this.updateApiKeyStatus('Please enter your Replicate API key', 'error');
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      this.updateApiKeyStatus('Error loading API key', 'error');
    }
  }
  
  async saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.updateApiKeyStatus('Please enter an API key', 'error');
      return;
    }
    
    if (!apiKey.startsWith('r8_')) {
      this.updateApiKeyStatus('Invalid API key format (should start with r8_)', 'error');
      return;
    }
    
    try {
      await chrome.storage.local.set({ replicateApiKey: apiKey });
      this.apiKey = apiKey;
      this.updateApiKeyStatus('✅ API key saved successfully!', 'success');
      this.scanBtn.disabled = false;
    } catch (error) {
      console.error('Error saving API key:', error);
      this.updateApiKeyStatus('Error saving API key', 'error');
    }
  }
  
  onApiKeyInput() {
    const apiKey = this.apiKeyInput.value.trim();
    if (apiKey.length > 10) {
      this.updateApiKeyStatus('Click Save to store your API key', '');
    } else {
      this.updateApiKeyStatus('', '');
    }
  }
  
  updateApiKeyStatus(message, type) {
    this.apiKeyStatus.textContent = message;
    this.apiKeyStatus.className = `api-key-status ${type}`;
  }
  
  async startScanning() {
    this.showLoading('Scanning page for text boxes...');
    
    try {
      const tab = await this.getCurrentTab();
      
      // Try to communicate with content script first
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanTextBoxes' });
        
        if (response && response.success) {
          if (response.count > 0) {
            this.updateStatus(`Found ${response.count} text boxes. Starting corrections...`);
            this.processNextTextBox();
          } else {
            this.updateStatus('No text boxes found on this page.');
          }
          this.hideLoading();
          return;
        }
      } catch (error) {
        console.log('Content script not ready, injecting...');
      }
      
      // If communication fails, inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Wait a moment for script to initialize
      setTimeout(async () => {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanTextBoxes' });
          
          if (response && response.success) {
            if (response.count > 0) {
              this.updateStatus(`Found ${response.count} text boxes. Starting corrections...`);
              this.processNextTextBox();
            } else {
              this.updateStatus('No text boxes found on this page.');
            }
          } else {
            this.updateStatus('No text inputs found on this page.');
          }
        } catch (e) {
          console.error('Still cannot communicate:', e);
          this.updateStatus('Error: Please refresh the page and try again.');
        }
        this.hideLoading();
      }, 1000);
      
    } catch (error) {
      console.error('Scanning error:', error);
      this.updateStatus('Error: Could not access page. Please refresh and try again.');
      this.hideLoading();
    }
  }
  
  async processNextTextBox() {
    try {
      const tab = await this.getCurrentTab();
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getNextTextBox' });
      
      if (response.success) {
        this.currentText = response.text;
        this.updateStatus(`Processing text box ${response.index + 1} of ${response.total}...`);
        
        if (this.currentText.trim().length > 0) {
          this.showLoading('Checking grammar and spelling...');
          await this.correctText(this.currentText);
        } else {
          // Skip empty text boxes
          this.skipTextBox();
        }
      } else {
        this.updateStatus('✅ All text boxes completed!');
        this.showSuccessMessage('All text boxes have been processed!');
      }
    } catch (error) {
      console.error('Processing error:', error);
      this.updateStatus('Error processing text box.');
    }
  }
  
  async correctText(text) {
    console.log('🚀 correctText called with:', text.substring(0, 50) + '...');
    
    if (!this.apiKey) {
      this.updateStatus('Error: API key required. Please save your Replicate API key first.');
      return;
    }
    
    try {
      console.log('📡 Sending request to API...');
      const response = await fetch(`${this.API_BASE}/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text,
          api_key: this.apiKey
        })
      });
      
      console.log('📊 Response status:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      this.correctionResult = await response.json();
      console.log('✅ Correction result received:', this.correctionResult);
      console.log('📈 Success:', this.correctionResult.success);
      console.log('📝 Suggestions count:', this.correctionResult.suggestions?.length || 0);
      
      this.hideLoading();
      
      if (this.correctionResult.success) {
        console.log('🎯 Calling displayCorrection()...');
        this.displayCorrection();
      } else {
        console.log('❌ Correction failed:', this.correctionResult.error);
        this.updateStatus('Error: Could not correct text.');
        setTimeout(() => this.skipTextBox(), 2000);
      }
    } catch (error) {
      console.error('❌ Correction error:', error);
      this.hideLoading();
      this.updateStatus('Error: Grammar service unavailable. Make sure the backend is running and API key is valid.');
      setTimeout(() => this.skipTextBox(), 3000);
    }
  }
  
  displayCorrection() {
    console.log('🎨 displayCorrection() started');
    console.log('📊 Correction result:', this.correctionResult);
    
    const hasChanges = this.correctionResult.suggestions && this.correctionResult.suggestions.length > 0;
    console.log('📈 Has changes:', hasChanges, 'Suggestions:', this.correctionResult.suggestions);
    
    if (!hasChanges) {
      console.log('✅ No changes found, showing enhancement options');
      this.updateStatus('✅ No errors found in this text box.');
      this.showEnhancementOptions();
      return;
    }
    
    console.log('🔍 Checking DOM elements...');
    console.log('  originalText exists:', !!this.originalText);
    console.log('  correctedText exists:', !!this.correctedText);
    console.log('  changesList exists:', !!this.changesList);
    console.log('  correctionSection exists:', !!this.correctionSection);
    
    if (!this.originalText || !this.correctedText || !this.changesList || !this.correctionSection) {
      console.error('❌ Missing DOM elements!');
      return;
    }
    
    // Show original text
    this.originalText.textContent = this.truncateText(this.currentText, 100);
    console.log('📝 Set original text:', this.originalText.textContent);
    
    // Show corrected text
    this.correctedText.textContent = this.truncateText(this.correctionResult.text, 100);
    console.log('✅ Set corrected text:', this.correctedText.textContent);
    
    // Show changes
    this.changesList.innerHTML = '';
    if (this.correctionResult.suggestions.length > 0) {
      const changesTitle = document.createElement('div');
      changesTitle.textContent = `${this.correctionResult.suggestions.length} changes found:`;
      changesTitle.style.fontWeight = 'bold';
      changesTitle.style.marginBottom = '8px';
      this.changesList.appendChild(changesTitle);
      
      this.correctionResult.suggestions.slice(0, 5).forEach(change => {
        const changeItem = document.createElement('div');
        changeItem.className = 'change-item';
        changeItem.textContent = change;
        this.changesList.appendChild(changeItem);
      });
      
      if (this.correctionResult.suggestions.length > 5) {
        const moreItem = document.createElement('div');
        moreItem.textContent = `... and ${this.correctionResult.suggestions.length - 5} more`;
        moreItem.style.fontStyle = 'italic';
        moreItem.style.opacity = '0.8';
        this.changesList.appendChild(moreItem);
      }
    }
    
    this.updateStatus('Review the corrections below:');
    this.correctionSection.style.display = 'block';
    console.log('🎨 displayCorrection() completed, section shown');
  }
  
  showEnhancementOptions() {
    console.log('🌟 showEnhancementOptions() called');
    this.correctionSection.style.display = 'none';
    this.enhancementResultSection.style.display = 'none';
    
    // Store the current corrected text
    this.finalText = this.correctionResult ? this.correctionResult.text : this.currentText;
    
    // Fix the element reference
    if (this.currentTextElement) {
      this.currentTextElement.textContent = this.truncateText(this.finalText, 100);
    }
    
    this.enhancementSection.style.display = 'block';
    this.updateStatus('Grammar fixed! Choose an enhancement option:');
    console.log('🌟 Enhancement section shown');
  }
  
  async enhanceText(enhancementType) {
    if (!this.apiKey) {
      this.updateStatus('Error: API key required for enhancement.');
      return;
    }
    
    this.showLoading(`Enhancing text for ${enhancementType}...`);
    this.enhancementSection.style.display = 'none';
    
    try {
      const response = await fetch(`${this.API_BASE}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: this.finalText,
          enhancement_type: enhancementType,
          api_key: this.apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      this.enhancementResult = await response.json();
      
      this.hideLoading();
      
      if (this.enhancementResult.success) {
        this.displayEnhancementResult();
      } else {
        this.updateStatus(`Enhancement failed: ${this.enhancementResult.error}`);
        this.enhancementSection.style.display = 'block';
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      this.hideLoading();
      this.updateStatus('Enhancement service unavailable. Continuing without enhancement...');
      setTimeout(() => this.continueWithoutEnhancement(), 2000);
    }
  }
  
  displayEnhancementResult() {
    const enhancementType = this.enhancementResult.enhancement_type;
    const icon = enhancementType === 'naturalness' ? '🌿' : '🎩';
    
    // Show enhanced text
    this.enhancedText.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">
        ${icon} Enhanced for ${enhancementType}:
      </div>
      <div>${this.truncateText(this.enhancementResult.enhanced_text, 150)}</div>
    `;
    
    // Show enhancement changes
    this.enhancementChanges.innerHTML = '';
    if (this.enhancementResult.changes && this.enhancementResult.changes.length > 0) {
      const changesTitle = document.createElement('div');
      changesTitle.textContent = `${this.enhancementResult.changes.length} enhancements made:`;
      changesTitle.style.fontWeight = 'bold';
      changesTitle.style.marginBottom = '8px';
      this.enhancementChanges.appendChild(changesTitle);
      
      this.enhancementResult.changes.slice(0, 3).forEach(change => {
        const changeItem = document.createElement('div');
        changeItem.className = 'change-item';
        changeItem.textContent = `${change.original} → ${change.suggestion}`;
        if (change.reason) {
          changeItem.title = change.reason;
        }
        this.enhancementChanges.appendChild(changeItem);
      });
      
      if (this.enhancementResult.changes.length > 3) {
        const moreItem = document.createElement('div');
        moreItem.textContent = `... and ${this.enhancementResult.changes.length - 3} more`;
        moreItem.style.fontStyle = 'italic';
        moreItem.style.opacity = '0.8';
        this.enhancementChanges.appendChild(moreItem);
      }
    }
    
    this.updateStatus('Enhancement complete! Apply or keep original:');
    this.enhancementResultSection.style.display = 'block';
  }
  
  async applyEnhancement() {
    if (!this.enhancementResult) return;
    
    try {
      const tab = await this.getCurrentTab();
      await chrome.tabs.sendMessage(tab.id, {
        action: 'applyCorrection',
        correctedText: this.enhancementResult.enhanced_text
      });
      
      this.enhancementResultSection.style.display = 'none';
      this.updateStatus('✅ Enhancement applied! Ready for more edits.');
      
      // Stay on current text box instead of moving to next
      await chrome.tabs.sendMessage(tab.id, { action: 'stayOnCurrentTextBox' });
      
      // Show scan button again for re-editing
      this.showScanAgainOption();
    } catch (error) {
      console.error('Apply enhancement error:', error);
      this.updateStatus('Error applying enhancement.');
    }
  }
  
  async skipEnhancement() {
    this.continueWithoutEnhancement();
  }
  
  async continueWithoutEnhancement() {
    try {
      const tab = await this.getCurrentTab();
      await chrome.tabs.sendMessage(tab.id, {
        action: 'applyCorrection',
        correctedText: this.finalText
      });
      
      this.enhancementSection.style.display = 'none';
      this.enhancementResultSection.style.display = 'none';
      this.updateStatus('✅ Text applied! Ready for more edits.');
      
      // Stay on current text box instead of moving to next
      await chrome.tabs.sendMessage(tab.id, { action: 'stayOnCurrentTextBox' });
      
      // Show scan button again for re-editing
      this.showScanAgainOption();
    } catch (error) {
      console.error('Continue error:', error);
      this.updateStatus('Error applying text.');
    }
  }
  
  async applyCorrection() {
    if (!this.correctionResult) return;
    
    try {
      const tab = await this.getCurrentTab();
      await chrome.tabs.sendMessage(tab.id, {
        action: 'applyCorrection',
        correctedText: this.correctionResult.text
      });
      
      this.correctionSection.style.display = 'none';
      this.updateStatus('✅ Correction applied! Ready for more edits.');
      
      // Stay on current text box instead of moving to next
      await chrome.tabs.sendMessage(tab.id, { action: 'stayOnCurrentTextBox' });
      
      // Show scan button again for re-editing
      this.showScanAgainOption();
    } catch (error) {
      console.error('Apply error:', error);
      this.updateStatus('Error applying correction.');
    }
  }
  
  async skipTextBox() {
    try {
      const tab = await this.getCurrentTab();
      await chrome.tabs.sendMessage(tab.id, { action: 'skipTextBox' });
      
      this.correctionSection.style.display = 'none';
      this.updateStatus('Skipped. Moving to next...');
      
      setTimeout(() => this.processNextTextBox(), 500);
    } catch (error) {
      console.error('Skip error:', error);
      this.updateStatus('Error skipping text box.');
    }
  }
  
  updateStatus(message = 'Enter your Replicate API key above to get started!') {
    this.status.textContent = message;
  }
  
  showLoading(message = 'Loading...') {
    this.loading.style.display = 'block';
    this.loading.querySelector('span').textContent = message;
    this.scanBtn.disabled = true;
  }
  
  hideLoading() {
    this.loading.style.display = 'none';
    this.scanBtn.disabled = false;
  }
  
  showScanAgainOption() {
    // Reset the interface to allow scanning again
    this.correctionSection.style.display = 'none';
    this.enhancementSection.style.display = 'none';
    this.enhancementResultSection.style.display = 'none';
    
    // Re-enable the scan button
    this.scanBtn.disabled = false;
    this.scanBtn.textContent = '🔍 Check Again';
  }
  
  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">🎉</div>
      <div>${message}</div>
    `;
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    mainContent.appendChild(successDiv);
    
    // Add restart button
    const restartBtn = document.createElement('button');
    restartBtn.textContent = '🔄 Scan Again';
    restartBtn.className = 'btn-scan';
    restartBtn.onclick = () => location.reload();
    mainContent.appendChild(restartBtn);
  }
  
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new GrammarFixerPopup();
});