import os
import chromadb
from typing import List
from langchain_google_genai import GoogleGenerativeAIEmbeddings

try:
    from langchain_community.embeddings import HuggingFaceEmbeddings


except ImportError:
    HuggingFaceEmbeddings = None

try:
    from langchain_chroma import Chroma
except ImportError:
    from langchain_community.vectorstores import Chroma

try:
    from langchain_core.documents import Document as LangChainDocument
except ImportError:
    from langchain.docstore.document import Document as LangChainDocument

from app.core.config import settings

class VectorStoreManager:
    """
    Manages ChromaDB persistent vector database with dynamic lightweight embeddings.
    Lazy-loads embedding model to prevent memory overhead during server startup.
    """
    def __init__(self):
        self._embeddings = None
        self._vector_store = None
        self.chroma_client = None

    @property
    def embeddings(self):
        if self._embeddings is None:
            google_key = os.getenv("GOOGLE_API_KEY") or settings.GOOGLE_API_KEY
            if google_key and not google_key.startswith("your-"):
                try:
                    self._embeddings = GoogleGenerativeAIEmbeddings(
                        model="models/gemini-embedding-001",
                        google_api_key=google_key
                    )
                except Exception:
                    self._embeddings = GoogleGenerativeAIEmbeddings(
                        model="models/gemini-embedding-2",
                        google_api_key=google_key
                    )
            elif HuggingFaceEmbeddings is not None:
                self._embeddings = HuggingFaceEmbeddings(
                    model_name=settings.EMBEDDING_MODEL_NAME,
                    model_kwargs={'device': 'cpu'},
                    encode_kwargs={'normalize_embeddings': True}
                )
            else:
                raise ValueError("No valid embedding model available. Please configure GOOGLE_API_KEY.")
        return self._embeddings



    @property
    def vector_store(self):
        if self._vector_store is None:
            if self.chroma_client is None:
                self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
            self._vector_store = Chroma(
                client=self.chroma_client,
                collection_name="docmind_chunks",
                embedding_function=self.embeddings
            )
        return self._vector_store

    def add_documents(self, documents: List[LangChainDocument]) -> List[str]:
        if not documents:
            return []
        return self.vector_store.add_documents(documents)

    def search_similar_chunks(self, query: str, user_id: int, top_k: int = 4) -> List[LangChainDocument]:
        search_filter = {"user_id": user_id}
        return self.vector_store.similarity_search(
            query=query,
            k=top_k,
            filter=search_filter
        )

    def delete_document_vectors(self, document_id: int, user_id: int):
        if self.chroma_client is None:
            self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
        collection = self.chroma_client.get_or_create_collection("docmind_chunks")
        collection.delete(
            where={
                "$and": [
                    {"user_id": {"$eq": user_id}},
                    {"document_id": {"$eq": document_id}}
                ]
            }
        )

# Global Vector Store Manager Instance
vector_store_manager = VectorStoreManager()
