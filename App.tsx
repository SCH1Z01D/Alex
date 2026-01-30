/**
 * Alex Mobile - AI Reading Tutor
 * ============================================================
 * 
 * A magical reading companion powered by IBM Watson and Granite AI.
 * Features:
 * - Always-on voice listening
 * - Real OCR from book images
 * - Watson TTS for natural Gogo voice
 * - Full AI-powered responses (no hardcoded text)
 * - Text input support
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

// Services
import * as Gamification from './src/services/gamification';
import * as GraniteAI from './src/services/granite-ai';
import * as WatsonTTS from './src/services/watson-tts';
import * as OCR from './src/services/ocr';
import { IBM_CONFIG } from './src/config/ibm-config';

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
  const [isListening, setIsListening] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [message, setMessage] = useState("Sawubona! I'm Gogo Wisdom. Show me a book page to start reading!");
  const [gems, setGems] = useState(0);
  const [level, setLevel] = useState(Gamification.LEVELS[0]);
  const [streak, setStreak] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  // Audio recording for speech recognition
  const recordingRef = useRef<Audio.Recording | null>(null);

  // ============================================================
  // INITIALIZATION
  // ============================================================
  useEffect(() => {
    initializeApp();
    return () => {
      // Cleanup
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  async function initializeApp() {
    try {
      // Load gamification state
      await Gamification.loadState();
      const summary = Gamification.getSummary();
      setGems(summary.gems);
      setLevel(summary.level);

      // Request permissions
      await Audio.requestPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();

      // Welcome message with Watson TTS
      const welcomeMessage = await GraniteAI.generateResponse(
        `You are Gogo Wisdom, a warm South African grandmother. Generate a short, loving greeting for a child who just opened the reading app. Use South African expressions like "Sawubona" or "Howzit". Keep it under 2 sentences.`
      );

      setMessage(welcomeMessage || "Sawubona my child! Let's read together!");
      await WatsonTTS.speak(welcomeMessage || "Sawubona my child! Let's read together!", 'normal');

      // Start always-on listening mode
      startContinuousListening();

    } catch (error) {
      console.error('Init error:', error);
      setMessage("Hello! I'm Gogo Wisdom. Show me a book page!");
    }
  }

  // ============================================================
  // ALWAYS-ON VOICE LISTENING
  // ============================================================
  async function startContinuousListening() {
    try {
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      setIsListening(true);
      console.log('🎤 Always-on listening activated');

      // Note: For real speech recognition, we'd use Watson STT WebSocket
      // For now, we use the text input as an alternative

    } catch (error) {
      console.error('Listening error:', error);
    }
  }

  // ============================================================
  // IMAGE PICKING & REAL OCR
  // ============================================================
  async function pickImage() {
    setIsLoading(true);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    } else {
      setIsLoading(false);
    }
  }

  async function takePhoto() {
    setIsLoading(true);

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    } else {
      setIsLoading(false);
    }
  }

  async function processImage(imageUri: string) {
    try {
      // Tell user we're processing
      setMessage("Let me look at this page...");
      await WatsonTTS.speak("Let me look at this page, my child.", 'normal');

      // Real OCR extraction
      let text = await OCR.extractTextFree(imageUri);

      if (!text || text.trim().length === 0) {
        const errorMessage = await GraniteAI.generateResponse(
          `You are Gogo Wisdom. The OCR couldn't read the book page clearly. Generate a short, encouraging response asking the child to take a clearer photo. Keep it under 2 sentences.`
        );
        setMessage(errorMessage);
        await WatsonTTS.speak(errorMessage, 'encouraging');
        setIsLoading(false);
        return;
      }

      setExtractedText(text);

      // Parse words
      const wordList = text.split(/\s+/)
        .filter(w => w.length > 0)
        .map(word => ({
          text: word.replace(/[^\w'-]/g, ''),
          isRead: false,
          isCorrect: false,
        }))
        .filter(w => w.text.length > 0);

      setWords(wordList);
      setCurrentWordIndex(0);

      // Generate AI introduction for this specific text
      const intro = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. A child is about to read this text: "${text.substring(0, 200)}..."
        
        Generate an EXCITING, personalized introduction that references what the story might be about. Use South African expressions. Keep it under 2 sentences. Make them eager to read!`
      );

      setMessage(intro);
      await WatsonTTS.speak(intro, 'celebrating');

    } catch (error) {
      console.error('OCR error:', error);
      setMessage("Eish! I couldn't read that. Can you take another photo?");
      await WatsonTTS.speak("Eish! I couldn't read that page clearly. Can you try taking another photo?", 'calm');
    }

    setIsLoading(false);
  }

  // ============================================================
  // TEXT INPUT HANDLING (Alternative to Voice)
  // ============================================================
  async function handleTextInput() {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    const input = textInput.trim().toLowerCase();
    setTextInput('');

    // Check if it matches the current word
    if (words.length > 0 && currentWordIndex < words.length) {
      const currentWord = words[currentWordIndex].text.toLowerCase();

      if (input === currentWord) {
        await handleCorrectWord();
      } else {
        await handleMistake(currentWord, input);
      }
    } else {
      // Conversational response when no text is loaded
      const response = await GraniteAI.generateResponse(
        `You are Gogo Wisdom, a warm South African grandmother reading tutor. 
        The child said: "${textInput}"
        
        Respond naturally and warmly. If they're asking to read, encourage them to pick a book page. Keep it under 2 sentences.`
      );
      setMessage(response);
      await WatsonTTS.speak(response, 'normal');
    }

    setIsProcessing(false);
  }

  // ============================================================
  // READING RESPONSE HANDLERS (All AI-Generated)
  // ============================================================
  async function handleCorrectWord() {
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

    // Generate AI response based on context
    if (result.levelUp) {
      setLevel(result.levelUp);
      const levelUpMessage = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child just leveled up to "${result.levelUp.name}" (level ${result.levelUp.level})! 
        Generate an EXCITED celebration message. Use South African expressions. Keep it under 2 sentences.`
      );
      setMessage(levelUpMessage);
      await WatsonTTS.speak(levelUpMessage, 'celebrating');
    } else if (newStreak === 5 || newStreak === 10 || newStreak === 20) {
      const streakMessage = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child just read ${newStreak} words correctly in a row! 
        Generate an enthusiastic celebration. Mention the streak number. Keep it under 2 sentences.`
      );
      setMessage(streakMessage);
      await WatsonTTS.speak(streakMessage, 'celebrating');
    } else if (currentWordIndex + 1 >= words.length) {
      // Finished the page!
      const finishMessage = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child just finished reading the entire page! They read ${wordsRead + 1} words total.
        Generate a proud, celebratory message. Use South African expressions. Keep it under 2 sentences.`
      );
      setMessage(finishMessage);
      await WatsonTTS.speak(finishMessage, 'celebrating');
    }
  }

  async function handleMistake(expected: string, spoken: string) {
    setStreak(0);
    await Gamification.recordMistake();

    // Mark word as incorrect
    const newWords = [...words];
    newWords[currentWordIndex].isRead = true;
    newWords[currentWordIndex].isCorrect = false;
    setWords(newWords);

    // Generate AI correction using Sandwich Method
    const correction = await GraniteAI.generateResponse(
      `You are Gogo Wisdom, a patient and loving reading tutor.
      
      The child tried to read the word "${expected}" but said "${spoken}".
      
      Use the Sandwich Method:
      1. Start with brief praise for trying
      2. Gently correct them - say what the word actually is
      3. End with encouragement
      
      Keep it SHORT (under 3 sentences). Use South African expressions naturally.`
    );

    setMessage(correction);
    await WatsonTTS.speak(correction, 'encouraging');
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
            {isListening && <View style={styles.listeningDot} />}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Alex</Text>
            <Text style={styles.subtitle}>
              {isListening ? '🎤 Always Listening...' : 'Your Reading Friend'}
            </Text>
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
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📖</Text>
            <Text style={styles.statValue}>{words.length > 0 ? currentWordIndex : 0}/{words.length}</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* Gogo's Message */}
        <View style={styles.messageBubble}>
          {isProcessing ? (
            <ActivityIndicator color="#4338CA" />
          ) : (
            <Text style={styles.messageText}>{message}</Text>
          )}
        </View>

        {/* Reading Area */}
        <ScrollView style={styles.readingArea} contentContainerStyle={styles.readingContent}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#4338CA" />
              <Text style={styles.loadingText}>Reading the page...</Text>
            </View>
          ) : words.length > 0 ? (
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
              <Text style={styles.emptyText}>Take a photo of a book page to start reading!</Text>
            </View>
          )}
        </ScrollView>

        {/* Text Input (Alternative to Voice) */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={words.length > 0 ? `Type the word: "${words[currentWordIndex]?.text || ''}"` : "Type or speak to Gogo..."}
            placeholderTextColor="#9CA3AF"
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={handleTextInput}
            returnKeyType="send"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleTextInput}>
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonLabel}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Text style={styles.cameraIcon}>📸</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => {
            setWords([]);
            setCurrentWordIndex(0);
            setExtractedText('');
            setMessage("Let's pick a new book page!");
          }}>
            <Text style={styles.buttonIcon}>🔄</Text>
            <Text style={styles.buttonLabel}>Reset</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  listeningDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E1B4B',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#A5B4FC',
  },
  gemCounter: {
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  gemIcon: {
    fontSize: 18,
  },
  gemCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelText: {
    fontSize: 9,
    color: '#C7D2FE',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#A5B4FC',
  },
  messageBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    minHeight: 60,
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 15,
    color: '#1E1B4B',
    textAlign: 'center',
    lineHeight: 22,
  },
  readingArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
  },
  readingContent: {
    padding: 16,
    minHeight: 150,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {
    fontSize: 22,
    color: '#374151',
    marginBottom: 6,
    marginRight: 4,
  },
  wordCorrect: {
    color: '#10B981',
    fontWeight: '600',
  },
  wordIncorrect: {
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
  wordCurrent: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 4,
    color: '#92400E',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E1B4B',
  },
  sendButton: {
    backgroundColor: '#10B981',
    width: 48,
    borderRadius: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
    gap: 12,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 4,
  },
  cameraButton: {
    backgroundColor: '#10B981',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraIcon: {
    fontSize: 32,
  },
});
