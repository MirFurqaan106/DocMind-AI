export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface DocumentItem {
  id: number;
  filename: str;
  file_size: number;
  chunk_count: number;
  upload_date: string;
}

export interface SourceCitation {
  document_name: string;
  page_number?: number;
  content_snippet: string;
}

export interface ChatMessage {
  id: number;
  question: string;
  answer: string;
  sources?: SourceCitation[];
  timestamp: string;
}

export interface UserSettings {
  temperature: number;
  max_tokens: number;
}
