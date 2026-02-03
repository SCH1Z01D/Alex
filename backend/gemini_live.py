"""
Alex Voice Backend - Gogo Wisdom Session Manager
================================================

Handles bidirectional audio streaming between the mobile app and Gemini Live API.
Based on Google's AudioLoop pattern from gemini-live-medical-intake.
"""

import asyncio
import logging
import struct
from typing import Optional
from google import genai
from google.genai import types

from config import settings

logger = logging.getLogger(__name__)


def create_wav_header(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, bits_per_sample: int = 16) -> bytes:
    """Create a WAV file header for PCM audio data"""
    data_size = len(pcm_data)
    file_size = data_size + 36  # 36 bytes for header (minus 8 for RIFF header)
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',           # ChunkID
        file_size,         # ChunkSize
        b'WAVE',           # Format
        b'fmt ',           # Subchunk1ID
        16,                # Subchunk1Size (16 for PCM)
        1,                 # AudioFormat (1 for PCM)
        channels,          # NumChannels
        sample_rate,       # SampleRate
        byte_rate,         # ByteRate
        block_align,       # BlockAlign
        bits_per_sample,   # BitsPerSample
        b'data',           # Subchunk2ID
        data_size          # Subchunk2Size
    )
    return header + pcm_data

# Audio Configuration
FORMAT = "pcm"
CHANNELS = 1
SEND_SAMPLE_RATE = 16000    # Input from mobile
RECEIVE_SAMPLE_RATE = 24000  # Output to mobile

# Model
MODEL = "models/gemini-2.5-flash-native-audio-preview-09-2025"

# Gogo Wisdom System Instruction
SYSTEM_INSTRUCTION = """You are Gogo Wisdom, a warm, loving South African grandmother and reading tutor.

Your personality:
- Warm, patient, and endlessly encouraging
- Use South African expressions: "Sawubona", "Sharp sharp", "Eish", "My child", "Yebo", "Haibo!"
- Celebrate every small success with genuine joy
- Never criticize - only guide gently

Your role:
1. When the call starts, greet the child warmly: "Sawubona, my child! It's so good to hear your voice. What shall we read today?"
2. Listen to the child reading aloud
3. If they struggle with a word, gently help them sound it out
4. Give short, encouraging feedback: "Beautiful!", "You're shining!", "That's it!"
5. Keep responses SHORT so the child can keep reading

IMPORTANT:
- This is like a phone call - speak naturally and conversationally
- Don't be too chatty - let the child do the reading
- Be patient with pauses and hesitations
- Always start by greeting them when the call connects
"""


class GogoWisdomSession:
    """
    Manages a single voice session with Gogo Wisdom (Gemini Live)
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = genai.Client(
            http_options={"api_version": "v1beta"},
            api_key=api_key
        )
        
        # Queues for bidirectional audio
        self.audio_in_queue: Optional[asyncio.Queue] = None   # From Gemini → Mobile
        self.audio_out_queue: Optional[asyncio.Queue] = None  # From Mobile → Gemini
        
        self.session = None
        self.websocket = None
    
    async def run(self, websocket):
        """Main session loop - manages bidirectional audio streaming"""
        self.websocket = websocket
        
        # Configure Gemini Live session
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=settings.VOICE_MODEL
                    )
                )
            ),
            system_instruction=types.Content(
                parts=[types.Part(text=SYSTEM_INSTRUCTION)]
            ),
        )
        
        logger.info("Connecting to Gemini Live API...")
        
        try:
            async with self.client.aio.live.connect(model=MODEL, config=config) as session:
                self.session = session
                logger.info("✅ Connected to Gemini Live API")
                
                # Initialize queues
                self.audio_in_queue = asyncio.Queue()
                self.audio_out_queue = asyncio.Queue(maxsize=5)
                
                # Send ready status
                await websocket.send_json({
                    "type": "status",
                    "state": "ready",
                    "message": "Connected to Gogo Wisdom"
                })
                
                # Run concurrent tasks
                tasks = [
                    asyncio.create_task(self._trigger_greeting()),  # NEW: Trigger greeting first
                    asyncio.create_task(self._receive_from_mobile()),
                    asyncio.create_task(self._send_to_gemini()),
                    asyncio.create_task(self._receive_from_gemini()),
                    asyncio.create_task(self._send_to_mobile()),
                ]
                
                await asyncio.gather(*tasks, return_exceptions=True)
                
        except asyncio.CancelledError:
            logger.info("Session cancelled")
        except Exception as e:
            logger.error(f"Session error: {e}", exc_info=True)
            try:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
            except:
                pass
    
    async def _trigger_greeting(self):
        """Send initial prompt to make Gogo greet the user"""
        try:
            await asyncio.sleep(1)  # Wait for connection to stabilize
            logger.info("🎤 Triggering Gogo's greeting...")
            
            # Send a text prompt to get Gogo talking
            await self.session.send(
                input="The child just picked up the phone. Greet them warmly!",
                end_of_turn=True
            )
            logger.info("✅ Greeting trigger sent")
        except Exception as e:
            logger.error(f"Error triggering greeting: {e}")
    
    async def _receive_from_mobile(self):
        """Receive audio from mobile app"""
        logger.info("Started receiving from mobile")
        try:
            while True:
                message = await self.websocket.receive()
                
                if "bytes" in message:
                    # Audio chunk from mobile
                    audio_chunk = message["bytes"]
                    logger.debug(f"Received {len(audio_chunk)} bytes from mobile")
                    
                    await self.audio_out_queue.put({
                        "data": audio_chunk,
                        "mime_type": "audio/pcm"
                    })
                    
                elif "text" in message:
                    import json
                    try:
                        data = json.loads(message["text"])
                        if data.get("type") == "end_session":
                            logger.info("End session requested")
                            raise asyncio.CancelledError("User ended session")
                    except json.JSONDecodeError:
                        pass
                        
        except asyncio.CancelledError:
            logger.info("Mobile receiver stopped")
            raise
        except Exception as e:
            logger.error(f"Error receiving from mobile: {e}")
            raise
    
    async def _send_to_gemini(self):
        """Send audio to Gemini Live API"""
        logger.info("Started sending to Gemini")
        try:
            while True:
                audio_data = await self.audio_out_queue.get()
                await self.session.send(input=audio_data)
                logger.debug(f"Sent {len(audio_data['data'])} bytes to Gemini")
                
        except asyncio.CancelledError:
            logger.info("Gemini sender stopped")
            raise
        except Exception as e:
            logger.error(f"Error sending to Gemini: {e}")
            raise
    
    async def _receive_from_gemini(self):
        """Receive responses from Gemini Live API"""
        logger.info("Started receiving from Gemini")
        try:
            while True:
                turn = self.session.receive()
                
                async for response in turn:
                    # Handle audio data
                    if data := response.data:
                        logger.debug(f"Received {len(data)} bytes from Gemini")
                        await self.audio_in_queue.put({
                            "type": "audio",
                            "data": data
                        })
                    
                    # Handle text transcript
                    if text := response.text:
                        logger.info(f"Gogo: {text[:50]}...")
                        await self.audio_in_queue.put({
                            "type": "text",
                            "text": text
                        })
                    
                    # Handle turn complete
                    if hasattr(response, 'server_content') and response.server_content:
                        if hasattr(response.server_content, 'turn_complete') and response.server_content.turn_complete:
                            await self.audio_in_queue.put({
                                "type": "turn_complete"
                            })
                            
        except asyncio.CancelledError:
            logger.info("Gemini receiver stopped")
            raise
        except Exception as e:
            logger.error(f"Error receiving from Gemini: {e}")
            raise
    
    async def _send_to_mobile(self):
        """Send responses to mobile app"""
        logger.info("Started sending to mobile")
        audio_buffer = b""  # Accumulate audio chunks
        
        try:
            while True:
                response = await self.audio_in_queue.get()
                
                if response["type"] == "audio":
                    # Accumulate audio chunks
                    audio_buffer += response["data"]
                    logger.debug(f"Buffered {len(response['data'])} bytes (total: {len(audio_buffer)})")
                    
                elif response["type"] == "text":
                    await self.websocket.send_json({
                        "type": "transcript",
                        "text": response["text"]
                    })
                    
                elif response["type"] == "turn_complete":
                    # Turn complete - send accumulated audio as WAV
                    if audio_buffer:
                        logger.info(f"📤 Converting {len(audio_buffer)} bytes to WAV and sending...")
                        wav_data = create_wav_header(audio_buffer)
                        await self.websocket.send_bytes(wav_data)
                        logger.info(f"✅ Sent {len(wav_data)} bytes WAV to mobile")
                        audio_buffer = b""  # Clear buffer
                    
                    await self.websocket.send_json({
                        "type": "turn_complete"
                    })
                    
        except asyncio.CancelledError:
            logger.info("Mobile sender stopped")
            raise
        except Exception as e:
            logger.error(f"Error sending to mobile: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup session resources"""
        logger.info("Cleaning up session")
