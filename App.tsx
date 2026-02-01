/**
 * Alex Mobile - AI Reading Tutor with Watson Assistant UI
 * ============================================================
 * 
 * Conversational chat-style interface for Gogo Wisdom
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
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Word {
  text: string;
  isRead: boolean;
  isCorrect: boolean;
}

export default function App() {
  // ============================================================
  // STATE
  // ============================================================
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [heardText, setHeardText] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
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

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  async function initializeApp() {
    try {
      await Gamification.loadState();

      const audioPermission = await Audio.requestPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();

      if (!audioPermission.granted) {
        Alert.alert('Microphone Permission', 'Please allow microphone access to read aloud!');
      }

      // Add welcome message
      addBotMessage("Sawubona, my child! 👵🏾 I'm Gogo Wisdom, your reading friend. Take a photo of a book page or pick a story, then read aloud to me!");

      await WatsonTTS.speak("Sawubona my child! I'm Gogo Wisdom, your reading friend.", 'normal');
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  // ============================================================
  // MESSAGE HANDLING
  // ============================================================
  function addBotMessage(text: string) {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function addUserMessage(text: string) {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // ============================================================
  // QUICK ACTION HANDLERS
  // ============================================================
  async function handlePickStory() {
    setShowStoryModal(true);
  }

  async function handleTakePhoto() {
    setIsLoading(true);
    addUserMessage("📸 Taking a photo...");

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

  async function handlePickImage() {
    setIsLoading(true);
    addUserMessage("🖼️ Picking an image...");

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

  // ============================================================
  // STORY SELECTION
  // ============================================================
  async function selectStory(story: Story) {
    setShowStoryModal(false);
    addUserMessage(`📖 I want to read "${story.title}"`);
    setIsLoading(true);

    const wordList = story.text.split(/\s+/)
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
    setIsReadingMode(true);

    const intro = await GraniteAI.generateResponse(
      `You are Gogo Wisdom. A child wants to read "${story.title}". Generate an EXCITED 1-2 sentence introduction!`
    );

    addBotMessage(intro);
    await WatsonTTS.speak(intro, 'celebrating');

    addBotMessage(`📖 Here's your story:\n\n"${story.text}"\n\nTap the microphone and start reading aloud! I'll follow along. 🎤`);
    setIsLoading(false);
  }

  // ============================================================
  // IMAGE PROCESSING (OCR)
  // ============================================================
  async function processImage(imageUri: string) {
    try {
      addBotMessage("Let me read this page... 📖");
      await WatsonTTS.speak("Let me look at this page.", 'normal');

      let text = await OCR.extractTextFree(imageUri);

      if (!text || text.trim().length < 5) {
        const errorMsg = "Eish! I couldn't read that clearly. Try taking another photo with better lighting, my child.";
        addBotMessage(errorMsg);
        await WatsonTTS.speak(errorMsg, 'encouraging');
        setIsLoading(false);
        return;
      }

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
      setIsReadingMode(true);

      const intro = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. A child is about to read: "${text.substring(0, 100)}..."
        Generate an EXCITED 1-2 sentence introduction. Use South African expressions.`
      );

      addBotMessage(intro);
      await WatsonTTS.speak(intro, 'celebrating');

      addBotMessage(`📖 I found this text:\n\n"${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"\n\nTap the microphone and start reading aloud! 🎤`);
    } catch (error) {
      console.error('OCR error:', error);
      addBotMessage("Eish! Something went wrong. Let's try again, my child.");
    }

    setIsLoading(false);
  }

  // ============================================================
  // VOICE RECOGNITION
  // ============================================================
  async function startListening() {
    if (words.length === 0) {
      addBotMessage("First pick a story or take a photo of a book page, then we can read together! 📚");
      await WatsonTTS.speak("First pick a story or take a photo!", 'encouraging');
      return;
    }

    setIsListening(true);
    setHeardText('');
    addBotMessage("I'm listening! Start reading aloud... 👂");
    await WatsonTTS.speak("I'm listening! Start reading.", 'encouraging');
    await WatsonSTT.startListening(handleSpeechResult);
  }

  async function stopListening() {
    setIsListening(false);
    await WatsonSTT.stopListening();

    if (wordsRead > 0) {
      const praise = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child just finished reading ${wordsRead} words with a streak of ${streak}. Generate a warm closing message (1-2 sentences).`
      );
      addBotMessage(praise);
      await WatsonTTS.speak(praise, 'celebrating');
    }
  }

  async function handleSpeechResult(text: string, isFinal: boolean) {
    if (!text.trim()) return;

    setHeardText(text);

    const spokenWords = text.toLowerCase().split(/\s+/);
    const lastSpoken = spokenWords[spokenWords.length - 1];

    if (currentWordIndex >= words.length) return;

    const expected = words[currentWordIndex].text.toLowerCase().replace(/[^\w]/g, '');
    const spokenClean = lastSpoken.replace(/[^\w]/g, '');

    const fillers = ['um', 'uh', 'ah', 'hmm', 'er', 'like'];
    if (fillers.includes(spokenClean)) return;

    if (spokenClean === expected || isCloseMatch(spokenClean, expected)) {
      await handleCorrectWord();
    } else if (spokenClean.length > 2) {
      await handleMistake(expected, spokenClean);
    }
  }

  function isCloseMatch(spoken: string, expected: string): boolean {
    if (spoken.length < 2 || expected.length < 2) return spoken === expected;
    if (spoken === expected) return true;

    const distance = levenshteinDistance(spoken, expected);
    const tolerance = expected.length <= 4 ? 1 : expected.length <= 7 ? 2 : 3;

    return distance <= tolerance;
  }

  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }
    return matrix[b.length][a.length];
  }

  async function handleCorrectWord() {
    const newWords = [...words];
    newWords[currentWordIndex].isRead = true;
    newWords[currentWordIndex].isCorrect = true;
    setWords(newWords);

    const newStreak = streak + 1;
    setStreak(newStreak);
    setWordsRead(prev => prev + 1);
    setCurrentWordIndex(prev => prev + 1);

    await Gamification.recordCorrectWord(newStreak);

    if (newStreak === 5 || newStreak === 10 || newStreak === 15) {
      const msg = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child got ${newStreak} words right in a row! Quick 1-sentence celebration.`
      );
      addBotMessage(`🔥 ${msg}`);
      await WatsonTTS.speak(msg, 'celebrating');
    } else if (currentWordIndex + 1 >= words.length) {
      const msg = await GraniteAI.generateResponse(
        `You are Gogo Wisdom. The child finished reading! Generate an EXCITED closing (1-2 sentences).`
      );
      addBotMessage(`🎉 ${msg}`);
      await WatsonTTS.speak(msg, 'celebrating');
      await stopListening();
      setIsReadingMode(false);
    }
  }

  async function handleMistake(expected: string, spoken: string) {
    setStreak(0);
    await Gamification.recordMistake();

    const newWords = [...words];
    newWords[currentWordIndex].isRead = true;
    newWords[currentWordIndex].isCorrect = false;
    setWords(newWords);
    setCurrentWordIndex(prev => prev + 1);

    const correction = await GraniteAI.generateResponse(
      `You are Gogo Wisdom. Child said "${spoken}" instead of "${expected}". Gentle correction (1-2 sentences).`
    );
    addBotMessage(correction);
    await WatsonTTS.speak(correction, 'encouraging');
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👵🏾 Gogo Wisdom</Text>
          {isReadingMode && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                📖 {currentWordIndex}/{words.length} • 🔥 {streak}
              </Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Header (shown when no messages or first load) */}
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Sawubona, my child!</Text>
              <Text style={styles.welcomeSubtitle}>
                👵🏾 I'm Gogo Wisdom, your reading friend. Take a photo of a book page or pick a story to begin!
              </Text>
              <Text style={styles.disclaimer}>
                Accuracy of generated answers may vary. Please double-check responses.
              </Text>
            </View>
          )}

          {/* Chat Messages */}
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.botMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.botMessageText
              ]}>
                {message.text}
              </Text>
            </View>
          ))}

          {/* Reading Progress (when in reading mode) */}
          {isReadingMode && words.length > 0 && (
            <View style={styles.readingCard}>
              <Text style={styles.readingLabel}>Current Word:</Text>
              <Text style={styles.currentWord}>
                {words[currentWordIndex]?.text || "Done!"}
              </Text>
              {heardText && (
                <Text style={styles.heardText}>I heard: "{heardText}"</Text>
              )}
            </View>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1A73E8" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions (shown when not in reading mode) */}
        {!isReadingMode && messages.length > 0 && (
          <ScrollView
            horizontal
            style={styles.quickActionsScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
          >
            <TouchableOpacity style={styles.actionCard} onPress={handlePickStory}>
              <Text style={styles.actionTitle}>📚 Pick a Story</Text>
              <Text style={styles.actionDesc}>Choose from graded reading levels</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleTakePhoto}>
              <Text style={styles.actionTitle}>📸 Take a Photo</Text>
              <Text style={styles.actionDesc}>Capture a book page to read</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handlePickImage}>
              <Text style={styles.actionTitle}>🖼️ Pick an Image</Text>
              <Text style={styles.actionDesc}>Select from your gallery</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type something..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => {
              if (inputText.trim()) {
                addUserMessage(inputText);
                setInputText('');
              }
            }}
          />

          {/* Microphone Button */}
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={isListening ? stopListening : startListening}
          >
            <Animated.View style={{ transform: [{ scale: isListening ? pulseAnim : 1 }] }}>
              <Text style={styles.micIcon}>{isListening ? '⏹️' : '🎤'}</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              if (inputText.trim()) {
                addUserMessage(inputText);
                setInputText('');
              }
            }}
          >
            <Text style={styles.sendIcon}>▶</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
              renderItem={({ item }) => {
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
              }}
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#1A73E8',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '400',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 32,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#1A73E8',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#1F2937',
  },
  readingCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  readingLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 8,
  },
  currentWord: {
    fontSize: 36,
    fontWeight: '700',
    color: '#92400E',
  },
  heardText: {
    fontSize: 14,
    color: '#B45309',
    marginTop: 12,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickActionsScroll: {
    maxHeight: 160,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickActionsContent: {
    padding: 16,
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    width: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  actionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  actionArrow: {
    fontSize: 18,
    color: '#1A73E8',
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  micIcon: {
    fontSize: 22,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 30
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    padding: 4
  },
  storyList: {
    padding: 16
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4
  },
  storyEmoji: {
    fontSize: 36,
    marginRight: 16
  },
  storyInfo: {
    flex: 1
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden'
  },
  wordCountText: {
    fontSize: 12,
    color: '#6B7280'
  },
});
