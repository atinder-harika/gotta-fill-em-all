// Panel script - handles communication between iframe and extension
console.log('[Panel] Gotta Fill \'Em All panel loaded');

const appFrame = document.getElementById('app-frame');
let recognitionInstance = null;

// Initialize Web Speech API in extension context (not blocked!)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Listen for messages from the Next.js app
window.addEventListener('message', (event) => {
  // Security check - only accept messages from our app
  if (event.origin !== 'http://localhost:3000') return;
  
  console.log('[Panel] Message from app:', event.data);
  
  // Handle voice recording requests
  if (event.data.type === 'START_RECORDING') {
    startVoiceRecording();
  }
  
  if (event.data.type === 'STOP_RECORDING') {
    stopVoiceRecording();
  }
  
  // Forward field highlight messages to content script via background worker
  if (event.data.type === 'HIGHLIGHT_FIELD') {
    chrome.runtime.sendMessage(event.data);
  }
  
  // Forward scan page requests to background worker
  if (event.data.type === 'SCAN_PAGE') {
    console.log('[Panel] Forwarding SCAN_PAGE to background worker...');
    chrome.runtime.sendMessage(event.data);
  }
  
  if (event.data.type === 'COPY_TO_CLIPBOARD') {
    // Copy text to clipboard
    navigator.clipboard.writeText(event.data.text).then(() => {
      console.log('[Panel] Copied to clipboard:', event.data.text);
      // Send confirmation back to app
      appFrame.contentWindow.postMessage({
        type: 'CLIPBOARD_SUCCESS'
      }, 'http://localhost:3000');
    });
  }
});

// Voice recording functions (works in extension context!)
async function startVoiceRecording() {
  if (!SpeechRecognition) {
    console.error('[Panel] Web Speech API not available');
    appFrame.contentWindow.postMessage({
      type: 'RECORDING_ERROR',
      error: 'Speech recognition not supported'
    }, 'http://localhost:3000');
    return;
  }
  
  // Request microphone permission first
  try {
    console.log('[Panel] Requesting microphone permission...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately - we only needed permission
    stream.getTracks().forEach(track => track.stop());
    console.log('[Panel] Microphone permission granted');
  } catch (permError) {
    console.error('[Panel] Microphone permission denied:', permError);
    appFrame.contentWindow.postMessage({
      type: 'RECORDING_ERROR',
      error: 'not-allowed',
      message: 'Please allow microphone access for the extension'
    }, 'http://localhost:3000');
    return;
  }
  
  console.log('[Panel] Starting voice recognition...');
  
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    console.log('[Panel] Recording started');
    appFrame.contentWindow.postMessage({
      type: 'RECORDING_STARTED'
    }, 'http://localhost:3000');
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('[Panel] Transcript:', transcript);
    appFrame.contentWindow.postMessage({
      type: 'RECORDING_RESULT',
      transcript: transcript
    }, 'http://localhost:3000');
  };
  
  recognition.onerror = (event) => {
    console.log('[Panel] Recording error:', event.error);
    appFrame.contentWindow.postMessage({
      type: 'RECORDING_ERROR',
      error: event.error
    }, 'http://localhost:3000');
  };
  
  recognition.onend = () => {
    console.log('[Panel] Recording ended');
    appFrame.contentWindow.postMessage({
      type: 'RECORDING_ENDED'
    }, 'http://localhost:3000');
    recognitionInstance = null;
  };
  
  recognitionInstance = recognition;
  recognition.start();
}

function stopVoiceRecording() {
  if (recognitionInstance) {
    console.log('[Panel] Stopping recording...');
    recognitionInstance.stop();
  }
}

// Listen for messages from content script (via background)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Panel] Message from content script:', message);
  
  // Forward to Next.js app
  if (message.type === 'FIELD_FILLED') {
    appFrame.contentWindow.postMessage(message, 'http://localhost:3000');
  }
  
  // Forward page data to app
  if (message.type === 'PAGE_DATA') {
    console.log('[Panel] Forwarding page data to app:', message.data);
    appFrame.contentWindow.postMessage(message, 'http://localhost:3000');
  }
});
