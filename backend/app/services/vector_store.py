from typing import List
import chromadb
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
try:
    from langchain_core.documents import Document as LangChainDocument
except ImportError:
    from langchain.docstore.document import Document as LangChainDocument

from app.core.config import settings

class VectorStoreManager:
    """
    Manages ChromaDB persistent vector database and SentenceTransformers embedding model.
    """
    def __init__(self):
        # Initialize SentenceTransformers embeddings locally
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL_NAME,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        # Persistent ChromaDB client
        self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
        
        # LangChain Chroma wrapper around collection
        self.vector_store = Chroma(
            client=self.chroma_client,
            collection_name="docmind_chunks",
            embedding_function=self.embeddings
        )

    def add_documents(self, documents: List[LangChainDocument]) -> List[str]:
        """
        Generates embeddings for document chunks and stores them in ChromaDB.
        """
        if not documents:
            return []
        ids = self.vector_store.add_documents(documents)
        return ids

    def search_similar_chunks(self, query: str, user_id: int, top_k: int = 4) -> List[LangChainDocument]:
        """
        Performs similarity search in ChromaDB filtered by user_id.
        """
        # Filter chunks by current user to enforce tenant isolation
        search_filter = {"user_id": user_id}
        
        results = self.vector_store.similarity_search(
            query=query,
            k=top_k,
            filter=search_filter
        )
        return results

    def delete_document_vectors(self, document_id: int, user_id: int):
        """
        Removes all vector embeddings associated with a deleted document.
        """
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
