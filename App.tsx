/**
 * Alex Mobile - Main App Component
 * ============================================================
 * AI-powered reading tutor with Gogo Wisdom as the guide
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// Services
import * as Gamification from './src/services/gamification';
import * as GraniteAI from './src/services/granite-ai';

// Types
interface Word {
  text: string;
  isRead: boolean;
  isCorrect: boolean;
}

export default function App() {
  // ============================================================
  // STATE
  // ============================================================
  const [isReading, setIsReading] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [message, setMessage] = useState("Sawubona! I'm Gogo Wisdom. Let's read together! 📖");
  const [gems, setGems] = useState(0);
  const [level, setLevel] = useState(Gamification.LEVELS[0]);
  const [streak, setStreak] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // ============================================================
  // INITIALIZATION
  // ============================================================
  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    // Load gamification state
    await Gamification.loadState();
    const summary = Gamification.getSummary();
    setGems(summary.gems);
    setLevel(summary.level);

    // Request permissions
    await Audio.requestPermissionsAsync();
    await ImagePicker.requestCameraPermissionsAsync();

    // Welcome message
    speakMessage("Sawubona my child! I'm Gogo Wisdom, your reading friend. Pick a book page to start reading!");
  }

  // ============================================================
  // TEXT-TO-SPEECH
  // ============================================================
  async function speakMessage(text: string) {
    setMessage(text);
    Speech.speak(text, {
      language: 'en-US',
      pitch: 0.95,
      rate: 0.85,
    });
  }

  // ============================================================
  // IMAGE PICKING & OCR
  // ============================================================
  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      // For demo, use sample text since Tesseract isn't available in Expo
      const sampleText = "The cat sat on the mat. The sun was warm. The bird sang in the tree.";
      processText(sampleText);
    }
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      // For demo, use sample text
      const sampleText = "Once upon a time there was a brave little lion. He lived in the big African savanna.";
      processText(sampleText);
    }
  }

  function processText(text: string) {
    const wordList = text.split(/\s+/).map(word => ({
      text: word.replace(/[.,!?]/g, ''),
      isRead: false,
      isCorrect: false,
    }));
    setWords(wordList);
    setCurrentWordIndex(0);

    speakMessage("Ayoba! Great choice! When you're ready, tap the microphone and start reading!");
  }

  // ============================================================
  // READING SIMULATION (Demo Mode)
  // ============================================================
  async function startReading() {
    if (!words.length) {
      Alert.alert('No Text', 'Please pick a book page first!');
      return;
    }

    setIsReading(true);
    setIsListening(true);
    speakMessage("I'm listening... Start reading, my child!");
  }

  async function stopReading() {
    setIsReading(false);
    setIsListening(false);

    const summary = Gamification.getSummary();
    speakMessage(`Sharp sharp! You read ${wordsRead} words and earned ${gems} gems! What a star! ⭐`);
  }

  // Demo: Simulate reading a word correctly
  async function simulateCorrectWord() {
    if (currentWordIndex >= words.length) {
      speakMessage("Hayibo! You finished the whole page! Amazing!");
      stopReading();
      return;
    }

    const newWords = [...words];
    newWords[currentWordIndex].isRead = true;
    newWords[currentWordIndex].isCorrect = true;
    setWords(newWords);

    const newStreak = streak + 1;
    setStreak(newStreak);
    setWordsRead(prev => prev + 1);
    setCurrentWordIndex(prev => prev + 1);

    // Award gems
    const result = await Gamification.recordCorrectWord(newStreak);
    setGems(prev => prev + result.gems);

    if (result.levelUp) {
      setLevel(result.levelUp);
      speakMessage(`Ayoba! You're now a ${result.levelUp.icon} ${result.levelUp.name}!`);
    } else if (newStreak === 5) {
      speakMessage("Sharp sharp! 5 words in a row!");
    } else if (newStreak === 10) {
      speakMessage("Hayibo! 10 in a row! You're on fire!");
    }
  }

  // Demo: Simulate a mistake
  async function simulateMistake() {
    if (currentWordIndex >= words.length) return;

    const word = words[currentWordIndex];
    setStreak(0);
    await Gamification.recordMistake();

    const correction = await GraniteAI.generateCorrection(word.text, 'different', 'the sentence');
    speakMessage(correction);
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#4338CA']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👵🏾</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Alex</Text>
            <Text style={styles.subtitle}>Your Reading Friend</Text>
          </View>
          <View style={styles.gemCounter}>
            <Text style={styles.gemIcon}>💎</Text>
            <Text style={styles.gemCount}>{gems}</Text>
            <Text style={styles.levelText}>{level.name}</Text>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{wordsRead}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Message Bubble */}
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{message}</Text>
        </View>

        {/* Reading Area */}
        <ScrollView style={styles.readingArea} contentContainerStyle={styles.readingContent}>
          {words.length > 0 ? (
            <View style={styles.wordsContainer}>
              {words.map((word, index) => (
                <Text
                  key={index}
                  style={[
                    styles.word,
                    word.isRead && word.isCorrect && styles.wordCorrect,
                    word.isRead && !word.isCorrect && styles.wordIncorrect,
                    index === currentWordIndex && styles.wordCurrent,
                  ]}
                >
                  {word.text}{' '}
                </Text>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>Pick a book page to start reading!</Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!words.length ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonIcon}>🖼️</Text>
                <Text style={styles.buttonLabel}>Pick Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={takePhoto}>
                <Text style={styles.buttonIcon}>📸</Text>
                <Text style={styles.buttonLabel}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.micButton, isReading && styles.micButtonActive]}
                onPress={isReading ? stopReading : startReading}
              >
                <Text style={styles.micIcon}>{isReading ? '⏹️' : '🎤'}</Text>
                <Text style={styles.micLabel}>{isReading ? 'Stop' : 'Start Reading'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Demo Controls (for testing without real speech recognition) */}
          {isReading && (
            <View style={styles.demoControls}>
              <Text style={styles.demoLabel}>Demo Controls:</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.demoButton} onPress={simulateCorrectWord}>
                  <Text style={styles.demoButtonText}>✓ Correct</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.demoButton, styles.demoButtonError]} onPress={simulateMistake}>
                  <Text style={styles.demoButtonText}>✗ Mistake</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#A5B4FC',
  },
  gemCounter: {
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.5)',
    padding: 10,
    borderRadius: 12,
  },
  gemIcon: {
    fontSize: 20,
  },
  gemCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelText: {
    fontSize: 10,
    color: '#A5B4FC',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#A5B4FC',
  },
  messageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  messageText: {
    fontSize: 16,
    color: '#1E1B4B',
    textAlign: 'center',
  },
  readingArea: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 15,
  },
  readingContent: {
    padding: 20,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {
    fontSize: 24,
    color: '#374151',
    marginBottom: 8,
  },
  wordCorrect: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  wordIncorrect: {
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
  wordCurrent: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  actions: {
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 130,
  },
  buttonIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  micButton: {
    backgroundColor: '#10B981',
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micIcon: {
    fontSize: 48,
  },
  micLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  demoControls: {
    marginTop: 20,
    alignItems: 'center',
  },
  demoLabel: {
    color: '#A5B4FC',
    marginBottom: 10,
    fontSize: 12,
  },
  demoButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  demoButtonError: {
    backgroundColor: '#EF4444',
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
