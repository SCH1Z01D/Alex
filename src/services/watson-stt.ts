/**
 * Watson Speech-to-Text Service for React Native
 * ============================================================
 * Continuous voice recognition using IBM Watson STT
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { IBM_CONFIG } from '../config/ibm-config';

// Callback for when speech is recognized
type OnSpeechCallback = (text: string, isFinal: boolean) => void;

let recording: Audio.Recording | null = null;
let isListening = false;
let onSpeechCallback: OnSpeechCallback | null = null;
let recordingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start continuous listening
 */
export async function startListening(callback: OnSpeechCallback): Promise<void> {
    if (isListening) return;

    onSpeechCallback = callback;
    isListening = true;

    try {
        // Configure audio mode
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });

        // Start periodic recording and transcription
        recordingInterval = setInterval(async () => {
            if (isListening) {
                await recordAndTranscribe();
            }
        }, 3000); // Record in 3-second chunks

        console.log('🎤 Watson STT listening started');

    } catch (error) {
        console.error('❌ Failed to start listening:', error);
        isListening = false;
    }
}

/**
 * Stop listening
 */
export async function stopListening(): Promise<void> {
    isListening = false;

    if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
    }

    if (recording) {
        try {
            await recording.stopAndUnloadAsync();
        } catch (e) {
            // Ignore
        }
        recording = null;
    }

    console.log('🎤 Watson STT listening stopped');
}

/**
 * Record audio and send to Watson STT
 */
async function recordAndTranscribe(): Promise<void> {
    try {
        // Start recording
        const { recording: newRecording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recording = newRecording;

        // Record for 2.5 seconds
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Stop recording
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (!uri) return;

        // Read audio file as base64
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Send to Watson STT
        const transcription = await transcribeWithWatson(base64Audio);

        if (transcription && transcription.trim()) {
            onSpeechCallback?.(transcription, true);
        }

        // Cleanup
        await FileSystem.deleteAsync(uri, { idempotent: true });

    } catch (error) {
        console.error('Recording/transcription error:', error);
    }
}

/**
 * Send audio to Watson STT API
 */
async function transcribeWithWatson(base64Audio: string): Promise<string> {
    if (!IBM_CONFIG.speechToText.apiKey) {
        console.warn('⚠️ Watson STT not configured');
        return '';
    }

    try {
        const authHeader = 'Basic ' + btoa('apikey:' + IBM_CONFIG.speechToText.apiKey);

        // Convert base64 to binary
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const response = await fetch(
            `${IBM_CONFIG.speechToText.url}/v1/recognize?model=${IBM_CONFIG.speechToText.model}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'audio/mp3',
                },
                body: bytes,
            }
        );

        if (!response.ok) {
            console.error('Watson STT error:', response.status);
            return '';
        }

        const data = await response.json();

        // Extract transcription from Watson response
        const results = data.results || [];
        const transcription = results
            .map((r: any) => r.alternatives?.[0]?.transcript || '')
            .join(' ')
            .trim();

        console.log('🎤 Heard:', transcription);
        return transcription;

    } catch (error) {
        console.error('❌ Watson STT API error:', error);
        return '';
    }
}

/**
 * Check if currently listening
 */
export function getIsListening(): boolean {
    return isListening;
}
