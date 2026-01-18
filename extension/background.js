// Background service worker - routes messages between panel and content scripts
console.log('[Background] Gotta Fill \'Em All service worker initialized');

// Listen for extension icon click - open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Route messages between panel and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message, 'from:', sender);
  
  // Message from panel to content script
  if (message.type === 'HIGHLIGHT_FIELD' || message.type === 'SCAN_PAGE') {
    console.log('[Background] Forwarding', message.type, 'to content script...');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.log('[Background] Active tab found:', tabs[0].id, tabs[0].url);
        
        // Try to send message to content script
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          // Check for connection error - content script not loaded
          if (chrome.runtime.lastError) {
            console.log('[Background] Content script not loaded, injecting...');
            
            // Inject CSS first
            chrome.scripting.insertCSS({
              target: { tabId: tabs[0].id },
              files: ['content.css']
            }).then(() => {
              console.log('[Background] CSS injected');
              
              // Then inject content script
              return chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
              });
            }).then(() => {
              console.log('[Background] Content script injected, retrying...');
              // Retry sending message after injection
              setTimeout(() => {
                chrome.tabs.sendMessage(tabs[0].id, message, (retryResponse) => {
                  handleContentResponse(message, retryResponse);
                });
              }, 100);
            }).catch((err) => {
              console.error('[Background] Failed to inject content script:', err);
            });
          } else {
            // Success - process response
            handleContentResponse(message, response);
          }
        });
      } else {
        console.error('[Background] No active tab found!');
      }
    });
  }
  
  // Helper to handle content script responses
  function handleContentResponse(message, response) {
    console.log('[Background] Content script response:', response);
    
    // Forward response back to panel
    if (message.type === 'SCAN_PAGE' && response?.data) {
      console.log('[Background] Forwarding PAGE_DATA back to panel...');
      chrome.runtime.sendMessage({
        type: 'PAGE_DATA',
        data: response.data
      });
    }
  }
  
  // Message from content script to panel - forward to all extension pages
  if (message.type === 'FIELD_FILLED' || message.type === 'PAGE_DATA') {
    chrome.runtime.sendMessage(message);
  }
  
  return true;
});

// Enable side panel on all sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.sidePanel.setOptions({
      tabId,
      path: 'panel.html',
      enabled: true
    });
  }
});
