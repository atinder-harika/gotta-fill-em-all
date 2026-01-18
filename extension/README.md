# Chrome Extension Setup

## Loading the Extension

1. **Start the Next.js dev server:**
   ```bash
   npm run dev
   ```
   Make sure it's running on `http://localhost:3000`

2. **Open Chrome Extensions page:**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)

3. **Load the extension:**
   - Click **"Load unpacked"**
   - Select the `extension/` folder from this project
   - The "Gotta Fill 'Em All" extension should appear

4. **Open the Side Panel:**
   - Click the extension icon in Chrome toolbar
   - OR click the puzzle piece icon → Pin "Gotta Fill 'Em All"
   - Side panel will open showing your Next.js app

5. **Test on a government form:**
   - Navigate to any form (e.g., `canada.ca` or test HTML file)
   - Use chat/voice to ask about form fields
   - Extension will highlight fields in gold when data is found

## Architecture

```
┌─────────────────┐
│  Chrome Side    │
│  Panel (iframe) │  ← Loads localhost:3000
│                 │
│  panel.html     │
└────────┬────────┘
         │
         ├─ Messages ─→ background.js ─→ content.js
         │                                     │
         │                                     ▼
         │                           ┌─────────────────┐
         │                           │ Government Page │
         └─ XP Events ──────────────│ (Field Highlight)│
                                    └─────────────────┘
```

## Key Files

- **manifest.json** - Extension configuration
- **panel.html** - Loads Next.js app in iframe
- **panel.js** - Handles messaging between app and extension
- **content.js** - Runs on all web pages, highlights form fields
- **content.css** - Golden glow effect for highlighted fields
- **background.js** - Service worker that routes messages

## Testing Field Highlighting

Send a test message from your app:
```javascript
window.parent.postMessage({
  type: 'HIGHLIGHT_FIELD',
  fieldName: 'email',  // or 'dli', 'uci', etc.
  fieldValue: 'test@example.com'
}, '*')
```

The content script will find and highlight the matching field!

## TODO

- [ ] Convert SVG icon to PNG (16x16, 48x48, 128x128)
- [ ] Add autofill as stretch goal
- [ ] Test on actual canada.ca forms
- [ ] Add production URL support (not just localhost)
