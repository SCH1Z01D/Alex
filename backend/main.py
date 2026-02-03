"""
Alex Voice Backend - FastAPI Server
====================================

WebSocket server that bridges the mobile app with Gemini Live API.

Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from gemini_live import GogoWisdomSession

# Setup logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Alex Voice Backend",
    description="Voice API bridge for Gogo Wisdom AI Reading Tutor",
    version="1.0.0"
)

# CORS (allow mobile app to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Alex Voice Backend is running"}


@app.get("/health")
async def health():
    """Health check for deployment platforms"""
    return {"status": "healthy"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for voice streaming
    
    Protocol:
    - Mobile sends: Binary audio chunks (16kHz PCM) or JSON control messages
    - Server sends: Binary audio chunks (24kHz PCM) or JSON (transcripts, status)
    """
    await websocket.accept()
    logger.info("📞 New voice session connected")
    
    session = GogoWisdomSession(api_key=settings.GEMINI_API_KEY)
    
    try:
        await session.run(websocket)
    except WebSocketDisconnect:
        logger.info("📴 Client disconnected")
    except Exception as e:
        logger.error(f"Session error: {e}", exc_info=True)
    finally:
        await session.cleanup()
        logger.info("Session cleaned up")


if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 Starting Alex Voice Backend on {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
