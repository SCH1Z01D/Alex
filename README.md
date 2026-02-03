# Alex - AI Reading Tutor 📚👵🏾

An AI-powered reading tutor app featuring **Gogo Wisdom**, a warm South African grandmother who helps children learn to read through real-time voice interaction.

## Architecture

```
┌─────────────────────────────────────┐
│       Mobile App (Expo/React Native) │
│  - Records audio from microphone     │
│  - Plays Gogo's voice responses      │
│  - Shows conversation transcript     │
└──────────────┬──────────────────────┘
               │ WebSocket (audio bytes)
               ▼
┌─────────────────────────────────────┐
│       Python Backend (FastAPI)       │
│  - Bridges mobile ↔ Gemini Live API  │
│  - Converts PCM audio to WAV         │
│  - Manages conversation sessions     │
└──────────────┬──────────────────────┘
               │ Google SDK
               ▼
┌─────────────────────────────────────┐
│       Gemini Multimodal Live API     │
│  - Real-time speech recognition      │
│  - AI conversation (Gogo persona)    │
│  - Voice synthesis (24kHz audio)     │
└─────────────────────────────────────┘
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Expo Go** app on your phone
- Phone and PC on the **same WiFi network**

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/SCH1Z01D/Alex.git
cd Alex
git checkout feature/gemini-live-voice
```

### 2. Start the Backend

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
.\venv\Scripts\activate
# Or on Mac/Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

You should see:
```
🚀 Starting Alex Voice Backend on 0.0.0.0:8000
INFO: Uvicorn running on http://0.0.0.0:8000
```

### 3. Find Your PC's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig | grep inet
```

### 4. Configure the Mobile App

Edit `src/services/gemini-live.ts` line 13:
```typescript
const BACKEND_URL = 'ws://YOUR_PC_IP:8000/ws';
// Example: 'ws://192.168.1.100:8000/ws'
```

### 5. Start the Mobile App

```bash
# In the Alex root folder (not backend)
cd ..
npm install
npx expo start --clear
```

Scan the QR code with Expo Go on your phone.

---

## Testing the App

1. Open the app on your phone
2. You should see "Connecting to Gogo Wisdom..."
3. Status changes to "Live Call" when connected
4. **Gogo will greet you!** 🎤
5. Start reading aloud - Gogo will respond

---

## Project Structure

```
Alex/
├── App.tsx                    # Main app component
├── backend/                   # Python backend
│   ├── main.py               # FastAPI server
│   ├── gemini_live.py        # Gogo Wisdom session manager
│   ├── config.py             # Settings
│   └── requirements.txt      # Python dependencies
├── src/
│   ├── config/
│   │   └── gemini-config.ts  # Gemini API config
│   ├── services/
│   │   ├── gemini-live.ts    # Voice client (WebSocket)
│   │   ├── gamification.ts   # Progress tracking
│   │   └── ocr.ts           # OCR for book photos
│   └── data/
│       └── stories.ts        # Built-in stories
└── package.json
```

---

## Configuration

### Backend (`backend/config.py`)

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | Set in file | Your Google AI API key |
| `VOICE_MODEL` | `Aoede` | Voice style (Puck, Charon, Kore, Fenrir, Aoede) |
| `PORT` | `8000` | Server port |

### Mobile App (`src/services/gemini-live.ts`)

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | WebSocket URL to your backend |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Check firewall, ensure same WiFi |
| Backend won't start | Check Python 3.10+ installed |
| No audio from Gogo | Check phone volume, not on silent |
| Recording errors | Grant microphone permission in Expo Go |

---

## API Key

The Gemini API key is stored in `backend/config.py`. To use your own key:

1. Get a key from [Google AI Studio](https://aistudio.google.com/)
2. Replace the key in `backend/config.py`

---

## Branch Info

- **main**: Stable release
- **feature/gemini-live-voice**: Latest voice features (this branch)

---

## Team

Built with ❤️ for helping children learn to read.
