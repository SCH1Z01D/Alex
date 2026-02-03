/**
 * Alex Voice Client
 * ============================================================
 * Connects to the Python backend for real-time voice streaming.
 * Sends audio to backend, receives audio/transcripts back.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// Backend URL - change this when deploying
const BACKEND_URL = 'ws://10.0.0.162:8000/ws'; // Your PC's local IP
// For production: 'wss://your-backend.onrender.com/ws'

export class VoiceClient {
    private ws: WebSocket | null = null;
    private isConnected = false;
    private isRecording = false;
    private onTextCallback: ((text: string) => void) | null = null;
    private onStatusCallback: ((status: string) => void) | null = null;

    // Audio playback
    private audioQueue: ArrayBuffer[] = [];
    private isPlaying = false;
    private currentSound: Audio.Sound | null = null;

    /**
     * Connect to the Python backend
     */
    async connect(
        onText: (text: string) => void,
        onStatus: (status: string) => void
    ): Promise<void> {
        this.onTextCallback = onText;
        this.onStatusCallback = onStatus;

        // Setup audio mode
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });

        return new Promise((resolve, reject) => {
            try {
                console.log(`🔌 Connecting to backend: ${BACKEND_URL}`);
                this.ws = new WebSocket(BACKEND_URL);

                this.ws.binaryType = 'arraybuffer';

                this.ws.onopen = () => {
                    console.log('✅ Connected to backend');
                    this.isConnected = true;
                    this.onStatusCallback?.('connected');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    if (event.data instanceof ArrayBuffer) {
                        // Binary = audio from Gogo
                        console.log(`🔊 Received ${event.data.byteLength} bytes of audio`);
                        this.queueAudio(event.data);
                    } else if (typeof event.data === 'string') {
                        // JSON message
                        try {
                            const msg = JSON.parse(event.data);
                            this.handleMessage(msg);
                        } catch (e) {
                            console.error('Failed to parse message', e);
                        }
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.onStatusCallback?.('error');
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('🔌 Disconnected from backend');
                    this.isConnected = false;
                    this.onStatusCallback?.('disconnected');
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    private handleMessage(msg: any) {
        switch (msg.type) {
            case 'status':
                console.log(`📡 Status: ${msg.state}`);
                this.onStatusCallback?.(msg.state);
                break;

            case 'transcript':
                console.log(`💬 Gogo: ${msg.text}`);
                this.onTextCallback?.(msg.text);
                break;

            case 'turn_complete':
                console.log('🏁 Turn complete');
                break;

            case 'error':
                console.error(`❌ Error: ${msg.message}`);
                this.onStatusCallback?.('error');
                break;
        }
    }

    // ============================================================
    // AUDIO PLAYBACK
    // ============================================================

    private queueAudio(buffer: ArrayBuffer) {
        this.audioQueue.push(buffer);
        if (!this.isPlaying) {
            this.playNextChunk();
        }
    }

    private async playNextChunk() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const buffer = this.audioQueue.shift()!;

        try {
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);

            // Write to temp file
            const tempPath = `${FileSystem.cacheDirectory}gogo_audio_${Date.now()}.wav`;
            await FileSystem.writeAsStringAsync(tempPath, base64, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Play audio
            const { sound } = await Audio.Sound.createAsync(
                { uri: tempPath },
                { shouldPlay: true }
            );
            this.currentSound = sound;

            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    await sound.unloadAsync();
                    await FileSystem.deleteAsync(tempPath, { idempotent: true });
                    this.currentSound = null;
                    this.playNextChunk();
                }
            });

        } catch (e) {
            console.error('Error playing audio:', e);
            this.playNextChunk();
        }
    }

    // ============================================================
    // AUDIO RECORDING
    // ============================================================

    async startRecording() {
        if (this.isRecording || !this.isConnected) return;
        this.isRecording = true;

        console.log('🎙️ Starting recording loop...');
        this.recordingLoop();
    }

    private async recordingLoop() {
        while (this.isRecording && this.isConnected) {
            let recording: Audio.Recording | null = null;

            try {
                recording = new Audio.Recording();
                await recording.prepareToRecordAsync({
                    android: {
                        extension: '.pcm',
                        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
                        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
                        sampleRate: 16000,
                        numberOfChannels: 1,
                        bitRate: 128000,
                    },
                    ios: {
                        extension: '.pcm',
                        audioQuality: Audio.IOSAudioQuality.HIGH,
                        sampleRate: 16000,
                        numberOfChannels: 1,
                        bitRate: 128000,
                        linearPCMBitDepth: 16,
                        linearPCMIsBigEndian: false,
                        linearPCMIsFloat: false,
                    },
                    web: {},
                });

                await recording.startAsync();
                await new Promise(r => setTimeout(r, 500)); // Record 500ms chunks
                await recording.stopAndUnloadAsync();

                if (!this.isRecording) break;

                const uri = recording.getURI();
                if (uri && this.ws && this.ws.readyState === WebSocket.OPEN) {
                    // Read file as base64
                    const base64 = await FileSystem.readAsStringAsync(uri, {
                        encoding: 'base64'
                    });

                    // Convert base64 to ArrayBuffer (binary)
                    const binary = atob(base64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }

                    // Send raw bytes to backend
                    this.ws.send(bytes.buffer);
                    console.log(`📤 Sent ${bytes.length} bytes to backend`);

                    // Cleanup
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                }

            } catch (error) {
                console.error('Recording loop error:', error);
                try {
                    if (recording) await recording.stopAndUnloadAsync();
                } catch (e) { /* ignore */ }
                await new Promise(r => setTimeout(r, 500));
            }
        }

        console.log('🛑 Recording loop stopped');
    }

    async stopRecording() {
        this.isRecording = false;
    }

    disconnect() {
        this.stopRecording();

        if (this.currentSound) {
            this.currentSound.unloadAsync();
            this.currentSound = null;
        }

        this.audioQueue = [];
        this.isPlaying = false;

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
    }
}

export const voiceClient = new VoiceClient();
