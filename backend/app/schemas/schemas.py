from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None

# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    chunk_count: int
    upload_date: datetime

    class Config:
        from_attributes = True

# --- Chat Schemas ---
class SourceCitation(BaseModel):
    document_name: str
    page_number: Optional[int] = None
    content_snippet: str

class ChatQueryRequest(BaseModel):
    question: str = Field(..., min_length=1)

class ChatMessageResponse(BaseModel):
    id: int
    question: str
    answer: str
    sources: Optional[List[SourceCitation]] = []
    timestamp: datetime

    class Config:
        from_attributes = True

# --- User Settings Schemas ---
class SettingsUpdate(BaseModel):
    temperature: float = Field(0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(500, ge=100, le=2000)

class SettingsResponse(BaseModel):
    temperature: float
    max_tokens: int

    class Config:
        from_attributes = True
