import json
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings
from app.models.db import User, UserSettings, ChatMessage
from app.schemas.schemas import SourceCitation
from app.services.vector_store import vector_store_manager

import os

class RAGService:
    """
    Core Retrieval-Augmented Generation (RAG) Service.
    Integrates ChromaDB retrieval with flexible LLM providers (Google Gemini / OpenAI).
    """

    def _get_llm(self, temperature: float, max_tokens: int):
        """
        Instantiate LLM dynamically based on environment configuration.
        """
        provider = (os.getenv("LLM_PROVIDER") or settings.LLM_PROVIDER).lower().strip()

        if provider == "gemini":
            google_key = os.getenv("GOOGLE_API_KEY") or settings.GOOGLE_API_KEY
            if not google_key:
                raise ValueError("GOOGLE_API_KEY is not set in environment variables.")
            os.environ["GOOGLE_API_KEY"] = google_key
            
            # Ensure Gemini 2.5 Flash reasoning thoughts + full text fit comfortably
            token_limit = max(max_tokens, 1024)
            
            try:
                return ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    google_api_key=google_key,
                    temperature=temperature,
                    max_output_tokens=token_limit
                )
            except Exception:
                try:
                    return ChatGoogleGenerativeAI(
                        model="gemini-2.0-flash",
                        google_api_key=google_key,
                        temperature=temperature,
                        max_output_tokens=token_limit
                    )
                except Exception:
                    return ChatGoogleGenerativeAI(
                        model="gemini-flash-latest",
                        google_api_key=google_key,
                        temperature=temperature,
                        max_output_tokens=token_limit
                    )



        elif provider == "openai":
            openai_key = os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
            if not openai_key:
                raise ValueError("OPENAI_API_KEY is not set in environment variables.")
            return ChatOpenAI(
                model="gpt-4o-mini",
                openai_api_key=openai_key,
                temperature=temperature,
                max_tokens=max_tokens
            )

        else:
            # Default fallback or mock response if keys aren't configured yet
            raise ValueError(f"Unsupported LLM_PROVIDER '{provider}'. Choose 'gemini' or 'openai'.")

    def answer_question(self, question: str, user: User, db: Session) -> ChatMessage:
        """
        Executes complete RAG workflow:
        1. Query ChromaDB for top-4 relevant chunks
        2. Format prompt with context and source metadata
        3. Query LLM (Gemini or OpenAI)
        4. Save chat message & citations to SQLite DB
        """
        # Fetch user settings (or use defaults)
        user_settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
        temp = user_settings.temperature if user_settings else 0.7
        max_tok = user_settings.max_tokens if user_settings else 500

        # Step 1: Determine optimal top_k retrieval count (fetch 8-10 chunks for summary queries)
        is_summary_query = any(term in question.lower() for term in ["summary", "summarize", "cv", "resume", "all", "everything", "overview", "full", "profile", "about"])
        top_k_count = 10 if is_summary_query else 8

        relevant_docs = vector_store_manager.search_similar_chunks(
            query=question,
            user_id=user.id,
            top_k=top_k_count
        )


        if not relevant_docs:
            answer_text = (
                "I couldn't find any relevant information in your uploaded documents. "
                "Please make sure you have uploaded PDF documents containing information related to your query."
            )
            chat_record = ChatMessage(
                user_id=user.id,
                question=question,
                answer=answer_text,
                sources=json.dumps([])
            )
            db.add(chat_record)
            db.commit()
            db.refresh(chat_record)
            return chat_record

        # Step 2: Format context and build structured sources list
        context_parts = []
        sources_list: List[Dict[str, Any]] = []

        for idx, doc in enumerate(relevant_docs):
            filename = doc.metadata.get("filename", "Unknown Document")
            page_num = doc.metadata.get("page_number", 1)
            content = doc.page_content

            context_parts.append(
                f"[Source {idx+1}: {filename} (Page {page_num})]\n{content}"
            )

            sources_list.append({
                "document_name": filename,
                "page_number": page_num,
                "content_snippet": content[:200] + "..." if len(content) > 200 else content
            })

        formatted_context = "\n\n".join(context_parts)

        # Step 3: Construct RAG prompt template
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", (
                "You are DocMind AI, an expert document assistant. Answer the user's question thoroughly and comprehensively "
                "based STRICTLY on the retrieved document context provided below.\n"
                "Provide a detailed, well-organized response using section headers and bullet points where appropriate.\n"
                "Do NOT cut off mid-sentence; synthesize all key facts found in the retrieved context into a complete explanation.\n"
                "If the context does not contain enough information to answer the question, state clearly that "
                "the provided documents do not contain the answer.\n\n"
                "RETRIEVED DOCUMENT CONTEXT:\n{context}"
            )),
            ("user", "{question}")
        ])


        # Step 4: Call LLM
        try:
            llm = self._get_llm(temperature=temp, max_tokens=max_tok)
            chain = prompt_template | llm
            response = chain.invoke({"context": formatted_context, "question": question})
            answer_text = response.content
        except Exception as e:
            # Graceful error handling for missing/invalid API key during development
            answer_text = (
                f"Note: API key configuration needed or LLM call failed. Error: {str(e)}\n\n"
                f"Retrieved context was successfully found in your document:\n{formatted_context[:400]}..."
            )

        # Step 5: Save ChatMessage record to SQLite
        chat_record = ChatMessage(
            user_id=user.id,
            question=question,
            answer=answer_text,
            sources=json.dumps(sources_list)
        )
        db.add(chat_record)
        db.commit()
        db.refresh(chat_record)

        return chat_record

rag_service = RAGService()
