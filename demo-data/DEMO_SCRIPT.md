# Gotta Fill 'Em All - Demo Script

## Pre-Demo Setup (5 minutes before)
1. **Open Chrome Extension** (load unpacked from `extension/` folder)
2. **Open Demo Form** in browser: `http://localhost:3000/demo-form.html`
3. **Have sample documents ready** in `demo-data/` folder
4. **Clear any previous chat history** (refresh extension)
5. **Test microphone permission** (click voice button once to grant access)

---

## Demo Flow (10 minutes)

### Part 1: Character Introduction (1 minute)
**Script:** "Meet Ashly, your AI form-filling trainer, and her sidekick Pik-A-Boo. They help you catch all the forms - I mean, fill all the forms!"

**Actions:**
- Show landing screen with Pokemon-style characters
- Point out XP bar and gamification elements
- Show the three main buttons: Chat, Voice, Scan

---

### Part 2: Document Upload (2 minutes)
**Script:** "First, let's give Ashly some memory. Just like training Pokemon with items, we'll feed her documents."

**Actions:**
1. Click **"+"** (Upload) button
2. Upload `letter-of-acceptance.txt`
   - Show XP gain (+10 points)
   - Show coin sound effect
3. Upload `passport-copy.txt`
4. Upload `proof-of-funds.txt`
5. Click **Pokedex** (menu) to show uploaded documents
   - Point out document preview
   - Show tags ("document", timestamps)

**Key Line:** "The AI now has context about my study permit application. It knows my DLI number, passport info, and financial status."

---

### Part 3: Page Scanning (2 minutes)
**Script:** "But Ashly doesn't just remember documents - she can SEE the webpage too!"

**Actions:**
1. Navigate to demo form (`/demo-form.html`)
2. Click **Scan Page** button (document with arrows icon)
3. Show confirmation: "I scanned 8 form fields. Saved to my memory."
4. Open **Pokedex** again
   - Show scanned page entry with Globe icon
   - Show it lists all form fields detected
   - Point out it's stored alongside uploaded docs

**Key Line:** "Now Ashly knows BOTH my documents AND the empty form fields. She can match them together."

---

### Part 4: Chat Mode - Form Filling (3 minutes)
**Script:** "Let's ask Ashly to help fill out this Canadian study permit form."

**Actions:**
1. Click **Chat** button (message bubble)
2. Type: "What's my DLI number?"
3. Show response with typewriter effect:
   ```
   FIELD: DLI Number
   VALUE: O19374268000
   ```
4. Click **"Copy & Fill"** button that appears
   - Show value copied to clipboard
   - Show golden field highlight animation
   - Show coin sound + XP gain
5. Type: "What's my passport number?"
6. Repeat copy & fill process
7. Type: "Fill in my email and school name"
8. Show AI finds multiple pieces of information

**Key Lines:**
- "Notice the typewriter effect - classic Pokemon battle text!"
- "The golden glow shows which field to paste into"
- "Ashly formats the response as FIELD/VALUE pairs for easy copying"

---

### Part 5: Voice Mode (1.5 minutes)
**Script:** "For accessibility, we have hands-free voice mode. Perfect for users with motor disabilities."

**Actions:**
1. Close chat (X button to return to landing)
2. Click **Microphone** button
3. Speak: "What is my date of birth?"
4. Show:
   - Voice bubble appears with your question (with quotes)
   - AI responds in voice bubble (with quotes)
   - Text-to-speech plays response
   - Chat history updates in background
5. Click Chat to show conversation is preserved with quotes

**Key Line:** "Voice mode shows everything in bubbles. Chat mode shows full history. They work together but never at the same time - clean separation for ADHD-friendly focus."

---

### Part 6: The Tech Stack (30 seconds wrap-up)
**Script:** "Behind the scenes, we're using:"

**Points to mention:**
- Chrome Extension (Manifest V3) with side panel
- Next.js 15 with React 19
- Google Gemini 2.5-flash for AI + RAG
- MongoDB Atlas for document storage
- ElevenLabs for multi-accent text-to-speech
- Deployed on Digital Ocean with Docker
- Full TypeScript, Framer Motion animations

---

## Demo Tips

### If Something Goes Wrong:
- **AI not responding:** "Gemini quota exceeded, but you can see the UI flow"
- **Voice not working:** "Need to manually allow mic permission first"
- **Field not highlighting:** "Normalized matching - sometimes needs exact field names"

### Strong Closing Points:
1. **Accessibility First** - Voice mode, ADHD-friendly responses, screen reader compatible
2. **RAG Innovation** - AI sees BOTH documents AND webpage forms simultaneously
3. **Gamification** - Makes boring bureaucracy fun (XP, levels, Pokemon theme)
4. **Production Ready** - Deployed on Digital Ocean, Docker containerized, full CI/CD
5. **Real Problem** - Helps immigrants fill complex government forms (Express Entry, study permits)

### Questions You Might Get:
- **Q: "Why Pokemon theme?"**
  - A: "Government forms are like catching Pokemon - gotta fill 'em all! Plus, familiar UI reduces learning curve."

- **Q: "How does RAG work here?"**
  - A: "We embed uploaded docs + scanned page fields into MongoDB Atlas. Gemini searches both simultaneously to find relevant data."

- **Q: "Can it handle PDFs?"**
  - A: "Currently text files for demo, but PDF text extraction is 20 lines with pdf-parse library."

- **Q: "Privacy concerns?"**
  - A: "All data stays in user's MongoDB. Extension runs locally. No third-party data sharing."

---

## Backup Demo (if live site down)
Run locally:
```bash
npm run dev
# Open http://localhost:3000 in Chrome
# Load extension from extension/ folder
```

---

## Post-Demo
- Share GitHub: `github.com/atinder-harika/gotta-fill-em-all`
- Mention: "Built in 48 hours for hackathon"
- Call out: "Looking for feedback on accessibility features"
