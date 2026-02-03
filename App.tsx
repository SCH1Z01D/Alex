/**
 * Alex Mobile - AI Reading Tutor with Python Backend
 * ============================================================
 * 
 * Always-on voice call with Gogo Wisdom via Python backend
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
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

// Services
import * as Gamification from './src/services/gamification';
import { voiceClient } from './src/services/gemini-live';

// Data
import { STORIES, Story, LEVEL_INFO } from './src/data/stories';

// Types
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function App() {
  // ============================================================
  // STATE
  // ============================================================
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ============================================================
  // INITIALIZATION
  // ============================================================
  useEffect(() => {
    initializeApp();
    return () => {
      voiceClient.disconnect();
    };
  }, []);

  // Pulse animation for avatar
  useEffect(() => {
    if (connectionStatus === 'ready') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [connectionStatus]);

  async function initializeApp() {
    try {
      await Gamification.loadState();

      const audioPermission = await Audio.requestPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();

      if (!audioPermission.granted) {
        Alert.alert('Microphone Permission', 'Please allow microphone access to read aloud!');
        return;
      }

      addBotMessage("Connecting to Gogo Wisdom... 📞");

      // Connect to backend
      await voiceClient.connect(
        (text) => {
          // Received transcript from Gogo
          if (text && text.trim().length > 0) {
            addBotMessage(text);
          }
        },
        (status) => {
          // Status update
          setConnectionStatus(status);
          if (status === 'ready') {
            addBotMessage("👵🏾 Gogo is on the line! Start reading, my child.");
          }
        }
      );

      // Start recording (always-on)
      await voiceClient.startRecording();

    } catch (error) {
      console.error('Init error:', error);
      addBotMessage("❌ Could not connect to Gogo. Check your backend server.");
    }
  }

  // ============================================================
  // MESSAGE HANDLING
  // ============================================================
  function addBotMessage(text: string) {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && !last.isUser && last.text === text) return prev;

      return [...prev, {
        id: Date.now().toString(),
        text,
        isUser: false,
        timestamp: new Date(),
      }];
    });
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function addUserMessage(text: string) {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    }]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // ============================================================
  // ACTIONS
  // ============================================================
  async function handlePickStory() {
    setShowStoryModal(true);
  }

  async function handleTakePhoto() {
    setIsLoading(true);

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      addUserMessage("📸 Took a photo of the book");
      // Note: For now, photo sending to backend is not implemented
      // Could be added later if needed
    }
    setIsLoading(false);
  }

  async function selectStory(story: Story) {
    setShowStoryModal(false);
    setCurrentStory(story);
    addUserMessage(`📖 Selected "${story.title}"`);
    addBotMessage(`Here is "${story.title}".\n\n"${story.text}"\n\nRead it aloud, I am listening!`);
  }

  // ============================================================
  // RENDER
  // ============================================================
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'ready': return '#10B981';
      case 'connected': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'ready': return 'Live Call';
      case 'connected': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Offline';
    }
  };

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
          <View style={[styles.statusBadge, { backgroundColor: connectionStatus === 'ready' ? '#ECFDF5' : '#FEF3C7' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: connectionStatus === 'ready' ? '#059669' : '#92400E' }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Main Interface */}
        <View style={styles.callContainer}>
          <View style={styles.avatarContainer}>
            <Animated.Text style={[styles.gogoAvatar, { transform: [{ scale: pulseAnim }] }]}>
              👵🏾
            </Animated.Text>
            <Text style={styles.callStatusText}>
              {connectionStatus === 'ready' ? "Gogo is listening..." : "Connecting..."}
            </Text>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
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
          </ScrollView>

          {/* Story Display */}
          {currentStory && (
            <ScrollView style={styles.storyCard}>
              <Text style={styles.storyTitleSmall}>{currentStory.title}</Text>
              <Text style={styles.storyBody}>{currentStory.text}</Text>
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.iconButton} onPress={handlePickStory}>
            <Text style={styles.iconButtonText}>📚 Pick Story</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleTakePhoto}>
            <Text style={styles.iconButtonText}>📸 Show Book</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Story Modal */}
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.storyItem}
                  onPress={() => selectStory(item)}
                >
                  <Text style={styles.storyEmoji}>{item.coverEmoji}</Text>
                  <View>
                    <Text style={styles.storyItemTitle}>{item.title}</Text>
                    <Text style={styles.storyItemLevel}>{item.levelName}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },

  callContainer: { flex: 1, justifyContent: 'center' },
  avatarContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  gogoAvatar: { fontSize: 70 },
  callStatusText: { marginTop: 5, fontSize: 14, color: '#666', fontWeight: '500' },

  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: 20, paddingBottom: 20 },
  messageBubble: { padding: 12, borderRadius: 16, marginBottom: 10, maxWidth: '85%' },
  userMessage: { backgroundColor: '#E0F2FE', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  botMessage: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 16 },
  userMessageText: { color: '#0369A1' },
  botMessageText: { color: '#1F2937' },

  storyCard: { marginHorizontal: 20, marginBottom: 10, padding: 16, backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', maxHeight: 150 },
  storyTitleSmall: { fontWeight: 'bold', marginBottom: 8, color: '#92400E' },
  storyBody: { fontSize: 16, lineHeight: 24, color: '#4B5563' },

  bottomBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, borderTopWidth: 1, borderColor: '#f0f0f0', backgroundColor: '#fff' },
  iconButton: { alignItems: 'center', padding: 10, backgroundColor: '#F3F4F6', borderRadius: 12, minWidth: 120 },
  iconButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { padding: 20, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalClose: { fontSize: 24, color: '#666' },
  storyItem: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#f0f0f0' },
  storyEmoji: { fontSize: 24, marginRight: 16 },
  storyItemTitle: { fontWeight: '600', fontSize: 16 },
  storyItemLevel: { fontSize: 12, color: '#666' },
});
