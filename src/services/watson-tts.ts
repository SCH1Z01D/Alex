/**
 * Watson Text-to-Speech Service for React Native
 * ============================================================
 * Uses expo-speech with enhanced voice settings
 * (Direct Watson TTS API has CORS issues in mobile apps)
 */

import * as Speech from 'expo-speech';

// Speech queue to prevent overlapping
let isSpeaking = false;
const speechQueue: { text: string; tone: string }[] = [];

/**
 * Speak text with Gogo Wisdom's voice
 */
export async function speak(
    text: string,
    tone: 'normal' | 'calm' | 'celebrating' | 'encouraging' = 'normal'
): Promise<void> {
    return new Promise((resolve) => {
        // Configure voice based on tone
        let rate = 0.9;
        let pitch = 1.0;

        switch (tone) {
            case 'calm':
                rate = 0.75;
                pitch = 0.9;
                break;
            case 'celebrating':
                rate = 1.0;
                pitch = 1.15;
                break;
            case 'encouraging':
                rate = 0.85;
                pitch = 1.05;
                break;
            default:
                rate = 0.85;
                pitch = 0.95;
        }

        // Stop any current speech
        Speech.stop();

        // Speak with configured settings
        Speech.speak(text, {
            language: 'en-US',
            pitch: pitch,
            rate: rate,
            onDone: () => {
                console.log('🔊 Finished speaking');
                resolve();
            },
            onError: (error) => {
                console.error('❌ Speech error:', error);
                resolve();
            },
        });

        console.log(`🔊 Speaking (${tone}):`, text.substring(0, 50) + '...');
    });
}

/**
 * Stop any current speech
 */
export async function stop(): Promise<void> {
    Speech.stop();
}

/**
 * Check if currently speaking
 */
export async function isSpeakingNow(): Promise<boolean> {
    return Speech.isSpeakingAsync();
}
