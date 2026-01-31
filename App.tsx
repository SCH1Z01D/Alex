/**
 * Alex Mobile - AI Reading Tutor with Voice Recognition
 * ============================================================
 * 
 * Features:
 * - Story Library with graded levels
 * - OCR for reading from book photos
 * - Real-time word highlighting synced with speech
 * - Gamification with gems and levels
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
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

// Services
import * as Gamification from './src/services/gamification';
import * as GraniteAI from './src/services/granite-ai';
import * as WatsonTTS from './src/services/watson-tts';
import * as WatsonSTT from './src/services/watson-stt';
import * as OCR from './src/services/ocr';

// Data
import { STORIES, Story, LEVEL_INFO } from './src/data/stories';

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
  const [message, setMessage] = useState("Sawubona! I'm Gogo Wisdom. Pick a story or take a photo, then tap the microphone to read aloud!");
  const [gems, setGems] = useState(0);
  const [level, setLevel] = useState(Gamification.LEVELS[0]);
  const [streak, setStreak] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  // Animation for listening indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const highlightAnim = useRef(new Animated.Value(1)).current;

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

  // Highlight animation when word changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(highlightAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(highlightAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [currentWordIndex]);

  async function initializeApp() {
    try {
      await Gamification.loadState();
      const summary = Gamification.getSummary();
      setGems(summary.gems);
      setLevel(summary.level);

      const audioPermission = await Audio.requestPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();

      if (!audioPermission.granted) {
        Alert.alert('Microphone Permission', 'Please allow microphone access to read aloud!');
      }

      await WatsonTTS.speak("Sawubona my child! Pick a story or take a photo of a book page, then tap the big microphone to read aloud!", 'normal');
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  // ============================================================
  // STORY SELECTION
  // ============================================================
  async function selectStory(story: Story) {
    setShowStoryModal(false);
    setCurrentStory(story);
    await loadStoryText(story);
  }

  async function loadStoryText(story: Story) {
    setIsLoading(true);

    const wordList = story.text.split(/\s+/)
      .filter(w => w.length > 0)
      .map(word => ({
        text: word.replace(/[^\\w'-]/g, ''),
        isRead: false,
        isCorrect: false,
      }))
      .filter(w => w.text.length > 0);

    setWords(wordList);
    setCurrentWordIndex(0);
    setWordsRead(0);
    setStreak(0);

    const intro = await GraniteAI.generateResponse(
      `You are Gogo Wisdom. A child is about to read "${story.title}".
      Text preview: "${story.text.substring(0, 100)}..."
      
      Generate an EXCITED 1-2 sentence introduction to get them interested!`
    );

    setMessage(intro);
    await WatsonTTS.speak(intro, 'celebrating');
    setIsLoading(false);
  }

  // ============================================================
  // VOICE RECOGNITION - READ ALOUD
  // ============================================================
  async function startListening() {
    if (words.length === 0) {
      await WatsonTTS.speak("First pick a story or take a photo of a book page!", 'encouraging');
      return;
    }

    setIsListening(true);
    setHeardText('');

    await WatsonTTS.speak("I'm listening! Start reading aloud.", 'encouraging');
    await WatsonSTT.startListening(handleSpeechResult);
  }

  async function stopListening() {
    setIsListening(false);
    await WatsonSTT.stopListening();

    if (wordsRead > 0) {
      const praise = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child just finished reading. They read ${wordsRead} words with a best streak of ${streak}. Generate a warm closing message. Keep it under 2 sentences.`
      );
      setMessage(praise);
      await WatsonTTS.speak(praise, 'celebrating');
    }
  }

  async function handleSpeechResult(text: string, isFinal: boolean) {
    if (!text.trim()) return;

    setHeardText(text);
    console.log('🎤 Heard:', text);

    // Get the last few spoken words to match against
    const spokenWords = text.toLowerCase().split(/\s+/);
    const lastSpoken = spokenWords[spokenWords.length - 1];

    if (currentWordIndex >= words.length) return;

    const expected = words[currentWordIndex].text.toLowerCase().replace(/[^\\w]/g, '');
    const spokenClean = lastSpoken.replace(/[^\\w]/g, '');

    // Skip common filler words
    const fillers = ['um', 'uh', 'ah', 'hmm', 'er', 'like'];
    if (fillers.includes(spokenClean)) return;

    if (spokenClean === expected || isCloseMatch(spokenClean, expected)) {
      await handleCorrectWord();
    } else if (spokenClean.length > 2) {
      // Only count as mistake if it's a real word attempt
      await handleMistake(expected, spokenClean);
    }
  }

  // Improved fuzzy matching for pronunciation variations
  function isCloseMatch(spoken: string, expected: string): boolean {
    if (spoken.length < 2 || expected.length < 2) return spoken === expected;

    // Exact match after normalization
    if (spoken === expected) return true;

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(spoken, expected);
    const maxLen = Math.max(spoken.length, expected.length);

    // Allow more tolerance for longer words
    const tolerance = expected.length <= 4 ? 1 : expected.length <= 7 ? 2 : 3;

    return distance <= tolerance;
  }

  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // ============================================================
  // IMAGE PICKING & OCR
  // ============================================================
  async function pickImage() {
    setIsLoading(true);
    setCurrentStory(null);

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
    setCurrentStory(null);

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

      const wordList = text.split(/\s+/)
        .filter(w => w.length > 0)
        .map(word => ({
          text: word.replace(/[^\\w'-]/g, ''),
          isRead: false,
          isCorrect: false,
        }))
        .filter(w => w.text.length > 0);

      setWords(wordList);
      setCurrentWordIndex(0);
      setWordsRead(0);
      setStreak(0);

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

    const result = await Gamification.recordCorrectWord(newStreak);
    setGems(prev => prev + result.gems);

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
      const msg = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child finished reading the whole passage (${wordsRead + 1} words)! Generate an EXCITED closing celebration.`
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

    // Move to next word even on mistake
    setCurrentWordIndex(prev => prev + 1);

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
  }

  // ============================================================
  // STORY MODAL COMPONENT
  // ============================================================
  function renderStoryItem({ item }: { item: Story }) {
    const levelInfo = LEVEL_INFO[item.level];
    return (
      <TouchableOpacity
        style={[styles.storyCard, { borderLeftColor: levelInfo.color }]}
        onPress={() => selectStory(item)}
      >
        <Text style={styles.storyEmoji}>{item.coverEmoji}</Text>
        <View style={styles.storyInfo}>
          <Text style={styles.storyTitle}>{item.title}</Text>
          <View style={styles.storyMeta}>
            <Text style={[styles.levelBadge, { backgroundColor: levelInfo.color }]}>
              {levelInfo.emoji} {levelInfo.name}
            </Text>
            <Text style={styles.wordCountText}>{item.wordCount} words</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
            <Text style={styles.subtitle}>
              {currentStory ? `📖 ${currentStory.title}` : 'Read Aloud to Gogo!'}
            </Text>
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
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : words.length > 0 ? (
            <View style={styles.wordsContainer}>
              {words.map((word, index) => (
                <Animated.Text
                  key={index}
                  style={[
                    styles.word,
                    word.isRead && word.isCorrect && styles.wordCorrect,
                    word.isRead && !word.isCorrect && styles.wordIncorrect,
                    index === currentWordIndex && styles.wordCurrent,
                    index === currentWordIndex && { transform: [{ scale: highlightAnim }] },
                  ]}
                >
                  {word.text}{' '}
                </Animated.Text>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>Pick a story or take a photo to start!</Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
            <Text style={styles.buttonIcon}>🖼️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.storyButton} onPress={() => setShowStoryModal(true)}>
            <Text style={styles.buttonIcon}>📖</Text>
          </TouchableOpacity>

          {/* Big Microphone Button */}
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={isListening ? stopListening : startListening}
          >
            <Animated.View style={{ transform: [{ scale: isListening ? pulseAnim : 1 }] }}>
              <Text style={styles.micIcon}>{isListening ? '⏹️' : '🎤'}</Text>
            </Animated.View>
            <Text style={styles.micLabel}>{isListening ? 'STOP' : 'READ'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.storyButton} onPress={takePhoto}>
            <Text style={styles.buttonIcon}>📸</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallButton} onPress={() => {
            setWords([]);
            setCurrentWordIndex(0);
            setMessage("Pick a new story or take a photo!");
            setCurrentStory(null);
          }}>
            <Text style={styles.buttonIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Story Selection Modal */}
      <Modal
        visible={showStoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📚 Pick a Story</Text>
              <TouchableOpacity onPress={() => setShowStoryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={STORIES}
              keyExtractor={(item) => item.id}
              renderItem={renderStoryItem}
              contentContainerStyle={styles.storyList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
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
  wordsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  word: { fontSize: 22, color: '#374151', marginBottom: 8, marginRight: 6, lineHeight: 32 },
  wordCorrect: { color: '#10B981', fontWeight: '600' },
  wordIncorrect: { color: '#EF4444', textDecorationLine: 'underline' },
  wordCurrent: {
    backgroundColor: '#FEF08A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#854D0E',
    fontWeight: '800',
    fontSize: 26,
    borderWidth: 2,
    borderColor: '#FACC15',
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 10, color: '#6B7280' },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 16, gap: 12 },
  smallButton: { backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  storyButton: { backgroundColor: 'rgba(99,102,241,0.6)', width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  buttonIcon: { fontSize: 22 },
  micButton: { backgroundColor: '#10B981', width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  micButtonActive: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
  micIcon: { fontSize: 32 },
  micLabel: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1B4B' },
  modalClose: { fontSize: 24, color: '#6B7280', padding: 4 },
  storyList: { padding: 16 },
  storyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  storyEmoji: { fontSize: 36, marginRight: 16 },
  storyInfo: { flex: 1 },
  storyTitle: { fontSize: 16, fontWeight: '600', color: '#1E1B4B', marginBottom: 6 },
  storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, color: '#FFF', fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  wordCountText: { fontSize: 12, color: '#6B7280' },
});
