// BDownloader - Popup Script (Simplified)

document.addEventListener('DOMContentLoaded', async () => {
  const downloadBtn = document.getElementById('downloadBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const status = document.getElementById('status');

  let currentFileId = null;

  // Auto-detect file on popup open
  async function detectFile() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Open a Google Drive file first', 'info');
        return;
      }

      // Check if on Google Drive
      if (!tab.url.includes('drive.google.com') && !tab.url.includes('docs.google.com')) {
        showStatus('Navigate to a Google Drive file first', 'info');
        return;
      }

      // Extract file ID from URL
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/
      ];

      for (const pattern of patterns) {
        const match = tab.url.match(pattern);
        if (match) {
          currentFileId = match[1];
          break;
        }
      }

      if (!currentFileId) {
        showStatus('No Google Drive file detected on this page', 'info');
        return;
      }

      // Try to get file name from content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getFileInfo' });
        if (response && response.fileName) {
          fileName.textContent = response.fileName;
          fileInfo.classList.add('show');
        } else {
          fileName.textContent = 'Google Drive File';
          fileInfo.classList.add('show');
        }
      } catch (e) {
        fileName.textContent = 'Google Drive File';
        fileInfo.classList.add('show');
      }

      showStatus('Ready to download', 'success');

    } catch (e) {
      showStatus('Error detecting file: ' + e.message, 'error');
    }
  }

  // Download button click
  downloadBtn.addEventListener('click', async () => {
    if (!currentFileId) {
      showStatus('No file detected. Click Refresh.', 'error');
      return;
    }

    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    progressContainer.classList.add('show');
    setProgress(0, 'Fetching file info...');
    hideStatus();

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'startDownload',
        fileId: currentFileId
      });

      if (response && response.error) {
        showStatus(response.error, 'error');
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download';
        progressContainer.classList.remove('show');
      }
    } catch (e) {
      showStatus('Failed: ' + e.message, 'error');
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download';
      progressContainer.classList.remove('show');
    }
  });

  // Refresh button
  refreshBtn.addEventListener('click', () => {
    detectFile();
  });

  // Listen for progress updates from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'progress') {
      setProgress(message.percent, message.text || null);
    } else if (message.action === 'complete') {
      showStatus('Download complete!', 'success');
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download';
      setProgress(100, 'Done!');
    } else if (message.action === 'error') {
      showStatus(message.error, 'error');
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download';
      progressContainer.classList.remove('show');
    }
  });

  function setProgress(percent, text = null) {
    progressFill.style.width = percent + '%';
    progressText.textContent = text || Math.round(percent) + '%';
  }

  function showStatus(text, type) {
    status.textContent = text;
    status.className = 'status show ' + type;
  }

  function hideStatus() {
    status.classList.remove('show');
  }

  // Auto-detect on open
  detectFile();
});
