// Content script for Grammar Fixer Pro

// Create tooltip element for showing corrections
function createTooltip() {
  const tooltip = document.createElement('div');
  tooltip.id = 'grammar-fixer-pro-tooltip';
  tooltip.className = 'grammar-fixer-pro-tooltip';
  document.body.appendChild(tooltip);
  return tooltip;
}

function getTooltip() {
  let tooltip = document.getElementById('grammar-fixer-pro-tooltip');
  if (!tooltip) {
    tooltip = createTooltip();
  }
  return tooltip;
}

function showTooltip(content, isError = false) {
  const tooltip = getTooltip();
  tooltip.innerHTML = content;
  tooltip.classList.add('visible');
  tooltip.classList.toggle('error', isError);
  
  // Position near the selection
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    tooltip.style.top = `${window.scrollY + rect.bottom + 10}px`;
    tooltip.style.left = `${window.scrollX + rect.left}px`;
    
    // Ensure tooltip stays within viewport
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
    }
  }

  // Auto-hide after 10 seconds
  setTimeout(() => {
    hideTooltip();
  }, 10000);
}

function hideTooltip() {
  const tooltip = document.getElementById('grammar-fixer-pro-tooltip');
  if (tooltip) {
    tooltip.classList.remove('visible');
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showCorrectedText') {
    const content = `
      <div class="grammar-fixer-pro-header">
        <strong>Grammar Fixer Pro</strong>
        <button class="grammar-fixer-pro-close">×</button>
      </div>
      <div class="grammar-fixer-pro-body">
        <div class="grammar-fixer-pro-original">
          <span class="grammar-fixer-pro-label">Original:</span>
          <span class="grammar-fixer-pro-text">${escapeHtml(message.originalText)}</span>
        </div>
        <div class="grammar-fixer-pro-corrected">
          <span class="grammar-fixer-pro-label">Corrected:</span>
          <span class="grammar-fixer-pro-text">${escapeHtml(message.correctedText)}</span>
        </div>
        <button class="grammar-fixer-pro-copy" data-text="${escapeHtml(message.correctedText)}">Copy Corrected Text</button>
      </div>
    `;
    showTooltip(content);
    
    // Add event listeners for buttons
    setTimeout(() => {
      // Close button
      const closeBtn = document.querySelector('.grammar-fixer-pro-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          hideTooltip();
        });
      }
      
      // Copy button
      const copyBtn = document.querySelector('.grammar-fixer-pro-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(message.correctedText).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy Corrected Text';
            }, 2000);
          });
        });
      }
    }, 0);
  } else if (message.action === 'showError') {
    const content = `
      <div class="grammar-fixer-pro-header">
        <strong>Grammar Fixer Pro</strong>
        <button class="grammar-fixer-pro-close">×</button>
      </div>
      <div class="grammar-fixer-pro-body">
        <p class="grammar-fixer-pro-error">${escapeHtml(message.message)}</p>
      </div>
    `;
    showTooltip(content, true);
    
    // Add event listener for close button
    setTimeout(() => {
      const closeBtn = document.querySelector('.grammar-fixer-pro-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          hideTooltip();
        });
      }
    }, 0);
  }
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Click outside to hide tooltip
document.addEventListener('click', (e) => {
  const tooltip = document.getElementById('grammar-fixer-pro-tooltip');
  if (tooltip && !tooltip.contains(e.target)) {
    hideTooltip();
  }
});
