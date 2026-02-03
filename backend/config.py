"""
Configuration for Alex Voice Backend
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AIzaSyCTZRRTs9j9nehlDdLStv1RlmkhLcZAZJ8")
    
    # Voice Model (Aoede = warm, expressive)
    VOICE_MODEL: str = os.getenv("VOICE_MODEL", "Aoede")
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Debug
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

settings = Settings()
