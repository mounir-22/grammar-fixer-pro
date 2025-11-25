document.addEventListener('DOMContentLoaded', async () => {
  const textInput = document.getElementById('text-input');
  const textOutput = document.getElementById('text-output');
  const fixBtn = document.getElementById('fix-btn');
  const copyBtn = document.getElementById('copy-btn');
  const naturalnessSelect = document.getElementById('naturalness');
  const formalitySelect = document.getElementById('formality');
  const apiUrlInput = document.getElementById('api-url');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  const settings = await chrome.storage.local.get(['apiUrl', 'naturalness', 'formality']);
  if (settings.apiUrl) {
    apiUrlInput.value = settings.apiUrl;
  }
  if (settings.naturalness) {
    naturalnessSelect.value = settings.naturalness;
  }
  if (settings.formality) {
    formalitySelect.value = settings.formality;
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }

  function clearStatus() {
    statusDiv.className = 'status';
    statusDiv.textContent = '';
  }

  // Save settings
  saveSettingsBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({
      apiUrl: apiUrlInput.value,
      naturalness: naturalnessSelect.value,
      formality: formalitySelect.value
    });
    showStatus('Settings saved!', 'success');
    setTimeout(clearStatus, 2000);
  });

  // Fix grammar
  fixBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
      showStatus('Please enter some text to fix.', 'error');
      return;
    }

    fixBtn.disabled = true;
    showStatus('Processing...', 'loading');

    try {
      const apiUrl = apiUrlInput.value.trim() || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          naturalness: naturalnessSelect.value,
          formality: formalitySelect.value
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      textOutput.value = data.correctedText;
      copyBtn.disabled = false;
      showStatus('Grammar corrected successfully!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showStatus(`Error: ${error.message}. Make sure the backend server is running.`, 'error');
    } finally {
      fixBtn.disabled = false;
    }
  });

  // Copy to clipboard
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textOutput.value);
      showStatus('Copied to clipboard!', 'success');
      setTimeout(clearStatus, 2000);
    } catch (error) {
      showStatus('Failed to copy to clipboard.', 'error');
    }
  });
});
