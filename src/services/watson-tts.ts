/**
 * Watson Text-to-Speech Service for React Native
 * ============================================================
 * Uses IBM Watson TTS API for natural, expressive voice
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { IBM_CONFIG } from '../config/ibm-config';

// Sound object for playback
let currentSound: Audio.Sound | null = null;

/**
 * Speak text using Watson TTS with specified emotion/tone
 */
export async function speak(text: string, tone: 'normal' | 'calm' | 'celebrating' | 'encouraging' = 'normal'): Promise<void> {
    if (!IBM_CONFIG.textToSpeech.apiKey) {
        console.warn('⚠️ Watson TTS not configured, using fallback');
        return speakFallback(text);
    }

    try {
        // Stop any currently playing audio
        if (currentSound) {
            await currentSound.stopAsync();
            await currentSound.unloadAsync();
        }

        // Add SSML for expressiveness based on tone
        let ssmlText = text;
        switch (tone) {
            case 'calm':
                ssmlText = `<speak><prosody rate="slow" pitch="-10%">${text}</prosody></speak>`;
                break;
            case 'celebrating':
                ssmlText = `<speak><prosody rate="fast" pitch="+15%">${text}</prosody></speak>`;
                break;
            case 'encouraging':
                ssmlText = `<speak><prosody pitch="+5%">${text}</prosody></speak>`;
                break;
            default:
                ssmlText = `<speak>${text}</speak>`;
        }

        // Create Basic Auth header
        const authHeader = 'Basic ' + btoa('apikey:' + IBM_CONFIG.textToSpeech.apiKey);

        // Call Watson TTS API
        const response = await fetch(
            `${IBM_CONFIG.textToSpeech.url}/v1/synthesize?voice=${IBM_CONFIG.textToSpeech.voice}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mp3',
                },
                body: JSON.stringify({ text: ssmlText }),
            }
        );

        if (!response.ok) {
            throw new Error(`Watson TTS error: ${response.status}`);
        }

        // Get audio as blob and save to file
        const audioBlob = await response.blob();
        const audioUri = FileSystem.cacheDirectory + 'gogo_speech.mp3';

        // Convert blob to base64 and save
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);

        await new Promise<void>((resolve, reject) => {
            reader.onloadend = async () => {
                try {
                    const base64 = (reader.result as string).split(',')[1];
                    await FileSystem.writeAsStringAsync(audioUri, base64, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
        });

        // Play the audio
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        currentSound = sound;
        await sound.playAsync();

        // Wait for playback to complete
        return new Promise((resolve) => {
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    resolve();
                }
            });
        });

    } catch (error) {
        console.error('❌ Watson TTS error:', error);
        return speakFallback(text);
    }
}

/**
 * Fallback using expo-speech if Watson fails
 */
async function speakFallback(text: string): Promise<void> {
    const Speech = await import('expo-speech');
    return new Promise((resolve) => {
        Speech.speak(text, {
            language: 'en-US',
            pitch: 0.95,
            rate: 0.85,
            onDone: () => resolve(),
        });
    });
}

/**
 * Stop any currently playing speech
 */
export async function stop(): Promise<void> {
    if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        currentSound = null;
    }
}
