import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base Directory: backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocMind AI"
    API_V1_STR: str = "/api/v1"
    
    # JWT Authentication
    SECRET_KEY: str = "docmind-secret-key-change-this-in-production-for-jwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Paths & Persistence
    DATABASE_URL: str = f"sqlite:///{BASE_DIR.parent / 'database' / 'docmind.db'}"
    UPLOAD_DIR: str = str(BASE_DIR.parent / "uploads")
    CHROMA_DB_DIR: str = str(BASE_DIR.parent / "database" / "chroma")

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # "gemini" or "openai"
    GOOGLE_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Embedding Model
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"

    # File limits
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: set = {".pdf"}

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_DB_DIR, exist_ok=True)
os.makedirs(Path(settings.DATABASE_URL.replace("sqlite:///", "")).parent, exist_ok=True)
