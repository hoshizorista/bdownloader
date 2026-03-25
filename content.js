// BDownloader - Content Script
// Runs on Google Drive pages

(function() {
  'use strict';

  // Extract file ID from current URL
  function getCurrentFileId() {
    const url = window.location.href;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Get file name from page
  function getFileName() {
    const selectors = [
      'div[role="heading"]',
      '.a-s-fa-Ha-p',
      '[data-tooltip]'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent && el.textContent.length < 200) {
        return el.textContent.trim();
      }
    }
    return null;
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getFileInfo') {
      sendResponse({
        fileId: getCurrentFileId(),
        fileName: getFileName(),
        url: window.location.href
      });
    }
    return true;
  });

  // Keyboard shortcut: Ctrl+Shift+D
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      const fileId = getCurrentFileId();
      if (fileId) {
        chrome.runtime.sendMessage({
          action: 'quickDownload',
          fileId: fileId
        });
      }
    }
  });

})();
