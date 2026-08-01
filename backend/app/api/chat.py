import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db import User, ChatMessage
from app.schemas.schemas import ChatQueryRequest, ChatMessageResponse, SourceCitation
from app.services.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/query", response_model=ChatMessageResponse)
def query_rag(
    request: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send question to RAG pipeline.
    Retrieves top 4 document chunks from ChromaDB, queries LLM (Gemini or OpenAI),
    and returns generated answer with source page citations.
    """
    chat_record = rag_service.answer_question(
        question=request.question,
        user=current_user,
        db=db
    )

    # Parse JSON sources back to Pydantic objects
    sources_data = []
    if chat_record.sources:
        try:
            parsed = json.loads(chat_record.sources)
            sources_data = [SourceCitation(**src) for src in parsed]
        except Exception:
            sources_data = []

    return ChatMessageResponse(
        id=chat_record.id,
        question=chat_record.question,
        answer=chat_record.answer,
        sources=sources_data,
        timestamp=chat_record.timestamp
    )


@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve previous chat conversations for the current user.
    """
    records = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.timestamp.asc()).all()

    response_list = []
    for rec in records:
        sources_data = []
        if rec.sources:
            try:
                parsed = json.loads(rec.sources)
                sources_data = [SourceCitation(**src) for src in parsed]
            except Exception:
                sources_data = []

        response_list.append(
            ChatMessageResponse(
                id=rec.id,
                question=rec.question,
                answer=rec.answer,
                sources=sources_data,
                timestamp=rec.timestamp
            )
        )

    return response_list


@router.delete("/history", status_code=status.HTTP_200_OK)
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clear all chat history messages for the current user.
    """
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Chat history cleared successfully"}
