import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db import User, Document
from app.schemas.schemas import DocumentResponse
from app.services.pdf_service import validate_pdf_file, extract_and_chunk_pdf
from app.services.vector_store import vector_store_manager

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF document (max 25MB). 
    Extracts text, cleans text, splits into chunks, indexes embeddings in ChromaDB, 
    and saves document metadata in SQLite.
    """
    contents = await file.read()
    validate_pdf_file(file, contents)

    # Generate unique filename for server storage
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save physical file to uploads directory
    with open(saved_path, "wb") as f:
        f.write(contents)

    try:
        # 1. Save document record to SQLite database
        doc_record = Document(
            user_id=current_user.id,
            filename=file.filename,
            stored_filename=unique_filename,
            file_size=len(contents),
            chunk_count=0
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

        # 2. Extract and chunk text from PDF
        chunks = extract_and_chunk_pdf(
            file_path=saved_path,
            filename=file.filename,
            document_id=doc_record.id,
            user_id=current_user.id
        )

        # 3. Add chunks to ChromaDB vector store
        vector_store_manager.add_documents(chunks)

        # 4. Update chunk count in database
        doc_record.chunk_count = len(chunks)
        db.commit()
        db.refresh(doc_record)

        return doc_record

    except Exception as e:
        # Cleanup saved file if processing failed
        if os.path.exists(saved_path):
            os.remove(saved_path)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all uploaded documents for the currently authenticated user.
    """
    documents = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.upload_date.desc()).all()
    return documents


@router.get("/search", response_model=List[DocumentResponse])
def search_documents(
    q: str = Query(..., min_length=1, description="Search term for filename"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search user's uploaded documents by filename.
    """
    query = f"%{q}%"
    documents = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.filename.ilike(query)
    ).order_by(Document.upload_date.desc()).all()
    return documents


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document by ID. 
    Removes the SQLite record, physical file, and vector embeddings from ChromaDB.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or unauthorized access."
        )

    # 1. Delete vector embeddings from ChromaDB
    try:
        vector_store_manager.delete_document_vectors(document_id=doc.id, user_id=current_user.id)
    except Exception as e:
        print(f"Warning deleting vectors from ChromaDB: {e}")

    # 2. Remove physical file from uploads folder
    file_path = os.path.join(settings.UPLOAD_DIR, doc.stored_filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    # 3. Delete database record
    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully", "document_id": document_id}
