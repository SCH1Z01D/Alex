# Alex - AI Reading Tutor 📚

An AI-powered reading companion that transforms reading practice into a magical adventure, powered by IBM Watson and Granite AI.

## 🌟 Features

### 👵🏾 Gogo Wisdom - Your Reading Friend
- Warm, encouraging South African grandmother persona
- Uses culturally relevant expressions (Sharp sharp! Ayoba! Hayibo!)
- Provides gentle corrections using the Sandwich Method
- Celebrates every success

### 💎 Gamification System
- **Gem Collection**: Earn gems for correct words + streak bonuses
- **10 Levels**: From "Little Acorn" 🌰 to "Legend" 👑
- **Animal Companions**: Unlock Professor Hoot 🦉, Memory 🐘, Speedy 🐆, and more!
- **Adventure Map**: Progress through The Friendly Forest 🌲 to The Story Castle 🏰

### 🎯 Real-Time Feedback
- Word-by-word highlighting as you read
- Instant pronunciation feedback
- Streak tracking with celebrations

### ❤️ Emotional Intelligence
- Detects frustration, fatigue, and confidence
- Proactive support when struggling
- Celebrates confidence boosts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation

```bash
# Navigate to the project
cd AlexMobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Your Phone

1. Open Expo Go on your phone
2. Scan the QR code from the terminal
3. Alex will load on your device!

## 🔧 Configuration

The app uses IBM Watson services. API keys are configured in:
- `src/config/ibm-config.ts`

### Services Used
| Service | Purpose |
|---------|---------|
| Watson Speech-to-Text | Listens to reading |
| Watson Text-to-Speech | Gogo's voice |
| watsonx.ai Granite | AI-powered responses |

## 📱 Testing Demo Mode

Since speech recognition requires native SDKs, the app includes **Demo Controls** for testing in Expo Go:

1. Pick an image (sample text loads automatically)
2. Tap the microphone to start "reading"
3. Use the demo buttons:
   - **✓ Correct** - Simulates reading a word correctly
   - **✗ Mistake** - Simulates making a mistake

Watch gems accumulate and level up!

## 🏗️ Project Structure

```
AlexMobile/
├── App.tsx              # Main application component
├── src/
│   ├── config/
│   │   └── ibm-config.ts    # IBM Watson configuration
│   ├── services/
│   │   ├── granite-ai.ts    # AI response generation
│   │   └── gamification.ts  # Gems, levels, companions
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── assets/              # Images and icons
└── app.json             # Expo configuration
```

## 🎨 Design Philosophy

Alex is designed with love for South African children learning to read:

- **Culturally Relevant**: Gogo Wisdom uses familiar South African expressions
- **Encouragement-First**: Never scolds, always celebrates progress
- **Gamified Learning**: Makes reading practice feel like an adventure
- **Emotionally Aware**: Responds to the child's emotional state

## 🔮 Future Features

- [ ] Real speech recognition integration
- [ ] Parent dashboard
- [ ] Comprehension questions
- [ ] Phonics tracking
- [ ] Offline mode
- [ ] Multiple language support

## 📄 License

MIT License - Built with ❤️ for children learning to read.

## 🙏 Acknowledgments

- IBM Watson for AI services
- Expo for the React Native framework
- All the amazing teachers who inspired this project
