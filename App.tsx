/**
 * Alex Mobile - AI Reading Tutor with Voice Recognition
 * ============================================================
 * 
 * READ ALOUD mode - continuously listens and responds to speech
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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

// Services
import * as Gamification from './src/services/gamification';
import * as GraniteAI from './src/services/granite-ai';
import * as WatsonTTS from './src/services/watson-tts';
import * as WatsonSTT from './src/services/watson-stt';
import * as OCR from './src/services/ocr';

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
  const [message, setMessage] = useState("Sawubona! I'm Gogo Wisdom. Take a photo of a book page, then tap the microphone to read aloud!");
  const [gems, setGems] = useState(0);
  const [level, setLevel] = useState(Gamification.LEVELS[0]);
  const [streak, setStreak] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [heardText, setHeardText] = useState('');

  // Animation for listening indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ============================================================
  // INITIALIZATION
  // ============================================================
  useEffect(() => {
    initializeApp();
    return () => {
      WatsonSTT.stopListening();
    };
  }, []);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  async function initializeApp() {
    try {
      // Load gamification state
      await Gamification.loadState();
      const summary = Gamification.getSummary();
      setGems(summary.gems);
      setLevel(summary.level);

      // Request permissions
      const audioPermission = await Audio.requestPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();

      if (!audioPermission.granted) {
        Alert.alert('Microphone Permission', 'Please allow microphone access to read aloud!');
      }

      // Welcome message
      await WatsonTTS.speak("Sawubona my child! Take a photo of a book page, then tap the big microphone to read aloud!", 'normal');

    } catch (error) {
      console.error('Init error:', error);
    }
  }

  // ============================================================
  // VOICE RECOGNITION - READ ALOUD
  // ============================================================
  async function startListening() {
    if (words.length === 0) {
      await WatsonTTS.speak("First take a photo of a book page, then we can read together!", 'encouraging');
      return;
    }

    setIsListening(true);
    setHeardText('');

    await WatsonTTS.speak("I'm listening! Start reading aloud.", 'encouraging');

    // Start Watson STT
    await WatsonSTT.startListening(handleSpeechResult);
  }

  async function stopListening() {
    setIsListening(false);
    await WatsonSTT.stopListening();

    if (wordsRead > 0) {
      const praise = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child just finished a reading session. They read ${wordsRead} words with a best streak of ${streak}. Generate a warm closing message. Keep it under 2 sentences.`
      );
      setMessage(praise);
      await WatsonTTS.speak(praise, 'celebrating');
    }
  }

  async function handleSpeechResult(text: string, isFinal: boolean) {
    if (!text.trim()) return;

    setHeardText(text);
    console.log('🎤 Heard:', text);

    // Match spoken words against expected words
    const spokenWords = text.toLowerCase().split(/\s+/);

    for (const spoken of spokenWords) {
      if (currentWordIndex >= words.length) break;

      const expected = words[currentWordIndex].text.toLowerCase().replace(/[^\w]/g, '');
      const spokenClean = spoken.replace(/[^\w]/g, '');

      if (spokenClean === expected || isCloseMatch(spokenClean, expected)) {
        await handleCorrectWord();
      } else if (spokenClean.length > 2) {
        // Only count as mistake if it's a real word attempt
        await handleMistake(expected, spokenClean);
      }
    }
  }

  // Simple fuzzy matching for pronunciation variations
  function isCloseMatch(spoken: string, expected: string): boolean {
    if (spoken.length < 2 || expected.length < 2) return spoken === expected;

    // Allow 1 character difference for words under 5 chars
    // Allow 2 character difference for longer words
    const maxDiff = expected.length < 5 ? 1 : 2;
    let diff = 0;

    const longer = spoken.length > expected.length ? spoken : expected;
    const shorter = spoken.length > expected.length ? expected : spoken;

    diff = longer.length - shorter.length;

    for (let i = 0; i < shorter.length && diff <= maxDiff; i++) {
      if (shorter[i] !== longer[i]) diff++;
    }

    return diff <= maxDiff;
  }

  // ============================================================
  // IMAGE PICKING & OCR
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
      setMessage("Let me read this page...");
      await WatsonTTS.speak("Let me look at this page.", 'normal');

      // Real OCR extraction
      let text = await OCR.extractTextFree(imageUri);

      if (!text || text.trim().length < 5) {
        const errorMsg = await GraniteAI.generateResponse(
          `You are Gogo Wisdom. The camera couldn't read the book page clearly. Ask the child to take a clearer photo with good lighting. Keep it under 2 sentences.`
        );
        setMessage(errorMsg);
        await WatsonTTS.speak(errorMsg, 'encouraging');
        setIsLoading(false);
        return;
      }

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
      setWordsRead(0);
      setStreak(0);

      // AI introduction
      const intro = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. A child is about to read: "${text.substring(0, 150)}..."
        
        Generate an EXCITED introduction that:
        1. Mentions what the text seems to be about
        2. Encourages them to tap the microphone and start reading aloud
        
        Use South African expressions. Keep it under 2 sentences.`
      );

      setMessage(intro);
      await WatsonTTS.speak(intro, 'celebrating');

    } catch (error) {
      console.error('OCR error:', error);
      setMessage("Eish! Let's try taking another photo.");
      await WatsonTTS.speak("Eish! I couldn't read that. Let's try taking another photo with better light.", 'calm');
    }

    setIsLoading(false);
  }

  // ============================================================
  // WORD HANDLERS (AI-Generated Responses)
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

    // Celebrate milestones
    if (result.levelUp) {
      setLevel(result.levelUp);
      const msg = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child leveled up to ${result.levelUp.name}! Generate an EXCITED 1-sentence celebration.`
      );
      setMessage(msg);
      await WatsonTTS.speak(msg, 'celebrating');
    } else if (newStreak === 5 || newStreak === 10 || newStreak === 15) {
      const msg = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child got ${newStreak} words right in a row! Generate a quick 1-sentence celebration.`
      );
      setMessage(msg);
      await WatsonTTS.speak(msg, 'celebrating');
    } else if (currentWordIndex + 1 >= words.length) {
      // Finished!
      const msg = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child finished reading the whole page (${wordsRead + 1} words)! Generate an EXCITED closing celebration.`
      );
      setMessage(msg);
      await WatsonTTS.speak(msg, 'celebrating');
      await stopListening();
    }
  }

  async function handleMistake(expected: string, spoken: string) {
    setStreak(0);
    await Gamification.recordMistake();

    const newWords = [...words];
    newWords[currentWordIndex].isRead = true;
    newWords[currentWordIndex].isCorrect = false;
    setWords(newWords);

    // Pause listening while correcting
    await WatsonSTT.stopListening();

    const correction = await GraniteAI.generateResponse(
      `You are Gogo Wisdom. The child tried to read "${expected}" but said "${spoken}".
      
      Generate a GENTLE correction that:
      1. Brief praise for trying
      2. Says the correct word clearly
      3. Encourages them to continue
      
      Keep it under 2 sentences. Be warm and patient.`
    );

    setMessage(correction);
    await WatsonTTS.speak(correction, 'encouraging');

    // Resume listening
    if (isListening) {
      await WatsonSTT.startListening(handleSpeechResult);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#1E1B4B', '#312E81', '#4338CA']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👵🏾</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Alex</Text>
            <Text style={styles.subtitle}>Read Aloud to Gogo!</Text>
          </View>
          <View style={styles.gemCounter}>
            <Text style={styles.gemIcon}>💎</Text>
            <Text style={styles.gemCount}>{gems}</Text>
            <Text style={styles.levelText}>{level.name}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wordsRead}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentWordIndex}/{words.length}</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* Gogo's Message */}
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{message}</Text>
        </View>

        {/* What I Heard */}
        {heardText && (
          <View style={styles.heardBubble}>
            <Text style={styles.heardLabel}>I heard:</Text>
            <Text style={styles.heardText}>"{heardText}"</Text>
          </View>
        )}

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
              <Text style={styles.emptyText}>Take a photo of a book page to start!</Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
            <Text style={styles.buttonIcon}>🖼️</Text>
          </TouchableOpacity>

          {/* Big Microphone Button */}
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={isListening ? stopListening : startListening}
          >
            <Animated.View style={{ transform: [{ scale: isListening ? pulseAnim : 1 }] }}>
              <Text style={styles.micIcon}>{isListening ? '⏹️' : '🎤'}</Text>
            </Animated.View>
            <Text style={styles.micLabel}>{isListening ? 'STOP' : 'READ ALOUD'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallButton} onPress={takePhoto}>
            <Text style={styles.buttonIcon}>📸</Text>
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
  container: { flex: 1 },
  gradient: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarEmoji: { fontSize: 28 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 12, color: '#A5B4FC' },
  gemCounter: { alignItems: 'center', backgroundColor: 'rgba(99,102,241,0.6)', padding: 8, borderRadius: 12 },
  gemIcon: { fontSize: 16 },
  gemCount: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  levelText: { fontSize: 8, color: '#C7D2FE' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: '#A5B4FC' },
  messageBubble: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 8, minHeight: 50 },
  messageText: { fontSize: 14, color: '#1E1B4B', textAlign: 'center', lineHeight: 20 },
  heardBubble: { backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 12, padding: 10, marginBottom: 8 },
  heardLabel: { fontSize: 10, color: '#10B981', marginBottom: 2 },
  heardText: { fontSize: 14, color: '#FFF', fontStyle: 'italic' },
  readingArea: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12 },
  readingContent: { padding: 16, minHeight: 120 },
  wordsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  word: { fontSize: 20, color: '#374151', marginBottom: 6, marginRight: 4 },
  wordCorrect: { color: '#10B981', fontWeight: '600' },
  wordIncorrect: { color: '#EF4444', textDecorationLine: 'underline' },
  wordCurrent: { backgroundColor: '#FEF3C7', borderRadius: 4, paddingHorizontal: 4, color: '#92400E', fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 10, color: '#6B7280' },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 16, gap: 16 },
  smallButton: { backgroundColor: 'rgba(255,255,255,0.2)', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  buttonIcon: { fontSize: 24 },
  micButton: { backgroundColor: '#10B981', width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  micButtonActive: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
  micIcon: { fontSize: 36 },
  micLabel: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
});
