// BDownloader - Background Service Worker (Simplified)

// Extract Google Drive file ID from URL
function extractDriveId(input) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{25,})$/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return input;
}

// Parse video URL and title from page content
function getVideoUrl(pageContent) {
  const contentList = pageContent.split('&');
  let video = null;
  let title = null;

  for (const content of contentList) {
    if (content.startsWith('title=') && !title) {
      title = decodeURIComponent(content.split('=').pop());
    } else if (content.includes('videoplayback') && !video) {
      video = decodeURIComponent(content).split('|').pop();
    }
    if (video && title) break;
  }

  return { video, title };
}

// Sanitize filename
function sanitizeFilename(filename) {
  let valid = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
  valid = valid.replace(/[. ]+$/, '');
  return valid || 'download';
}

// Send progress update to popup
async function sendProgress(percent, text = null) {
  try {
    await chrome.runtime.sendMessage({
      action: 'progress',
      percent,
      text
    });
  } catch (e) {
    // Popup might be closed, ignore
  }
}

// Send error to popup
async function sendError(error) {
  try {
    await chrome.runtime.sendMessage({
      action: 'error',
      error
    });
  } catch (e) {
    // Popup might be closed, ignore
  }
}

// Send completion message
async function sendComplete() {
  try {
    await chrome.runtime.sendMessage({
      action: 'complete'
    });
  } catch (e) {
    // Popup might be closed, ignore
  }
}

// Main download handler
async function startDownload(fileId) {
  try {
    sendProgress(10, 'Connecting to Google Drive...');

    // Get video info from Google Drive
    const driveUrl = `https://drive.google.com/u/0/get_video_info?docid=${fileId}&drive_originator_app=303`;

    const response = await fetch(driveUrl, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to connect (${response.status})`);
    }

    sendProgress(30, 'Extracting download link...');

    const pageContent = await response.text();
    const { video, title } = getVideoUrl(pageContent);

    if (!video) {
      throw new Error('Could not extract download link. File may be restricted.');
    }

    const filename = sanitizeFilename(title || 'download');

    sendProgress(50, 'Starting download...');

    // Use Chrome's download API
    return new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: video,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendError(chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          sendProgress(100, 'Download started!');
          sendComplete();
          resolve({ success: true, downloadId });
        }
      });
    });

  } catch (error) {
    sendError(error.message);
    return { error: error.message };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startDownload') {
    startDownload(message.fileId || message.url)
      .then(sendResponse);
    return true; // Keep channel open for async response
  }
});

// Listen for keyboard shortcut from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'quickDownload') {
    startDownload(message.fileId)
      .then(sendResponse);
    return true;
  }
});
