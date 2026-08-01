import os
import re
from typing import List, Tuple
from fastapi import UploadFile, HTTPException, status
from pypdf import PdfReader
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    try:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
    except ImportError:
        from langchain_community.text_splitter import RecursiveCharacterTextSplitter

try:
    from langchain_core.documents import Document as LangChainDocument
except ImportError:
    from langchain.docstore.document import Document as LangChainDocument

from app.core.config import settings

def validate_pdf_file(file: UploadFile, contents: bytes):
    """
    Validate uploaded file extension and maximum file size (25MB limit).
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files are allowed."
        )

    file_size_mb = len(contents) / (1024 * 1024)
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )


def clean_text(text: str) -> str:
    """
    Clean raw text extracted from PDF: normalize whitespace, remove null characters and non-printable control symbols.
    """
    if not text:
        return ""
    # Replace non-printable ASCII/control chars
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    # Normalize multiple whitespace/newlines into standard single spacing
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_and_chunk_pdf(file_path: str, filename: str, document_id: int, user_id: int) -> List[LangChainDocument]:
    """
    Extract text page-by-page from PDF, clean it, split it into chunks, 
    and attach rich metadata (page_number, document_id, user_id, source).
    """
    reader = PdfReader(file_path)
    page_docs: List[LangChainDocument] = []

    for page_idx, page in enumerate(reader.pages):
        raw_text = page.extract_text()
        cleaned = clean_text(raw_text)
        if cleaned:
            page_docs.append(
                LangChainDocument(
                    page_content=cleaned,
                    metadata={
                        "user_id": user_id,
                        "document_id": document_id,
                        "filename": filename,
                        "page_number": page_idx + 1
                    }
                )
            )

    if not page_docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF contains no extractable text."
        )

    # Recursive text splitter suitable for RAG chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )


    chunks = text_splitter.split_documents(page_docs)
    return chunks
