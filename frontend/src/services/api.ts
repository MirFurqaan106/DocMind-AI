import axios from 'axios';
import { AuthToken, User, DocumentItem, ChatMessage, UserSettings } from '../types';

const API_BASE_URL = '/api/v1';




const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('docmind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('docmind_token');
      // Redirect to login if unauthorized
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const authAPI = {
  signup: async (data: { email: string; password: string }): Promise<User> => {
    const res = await api.post<User>('/auth/signup', data);
    return res.data;
  },
  login: async (data: { email: string; password: string }): Promise<AuthToken> => {
    const res = await api.post<AuthToken>('/auth/login', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const documentAPI = {
  upload: async (file: File): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<DocumentItem>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  list: async (): Promise<DocumentItem[]> => {
    const res = await api.get<DocumentItem[]>('/documents');
    return res.data;
  },
  search: async (query: string): Promise<DocumentItem[]> => {
    const res = await api.get<DocumentItem[]>(`/documents/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },
  delete: async (documentId: number): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/documents/${documentId}`);
    return res.data;
  },
};

export const chatAPI = {
  query: async (question: string): Promise<ChatMessage> => {
    const res = await api.post<ChatMessage>('/chat/query', { question });
    return res.data;
  },
  getHistory: async (): Promise<ChatMessage[]> => {
    const res = await api.get<ChatMessage[]>('/chat/history');
    return res.data;
  },
  clearHistory: async (): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>('/chat/history');
    return res.data;
  },
};

export const settingsAPI = {
  get: async (): Promise<UserSettings> => {
    const res = await api.get<UserSettings>('/settings');
    return res.data;
  },
  update: async (settings: UserSettings): Promise<UserSettings> => {
    const res = await api.put<UserSettings>('/settings', settings);
    return res.data;
  },
};

export default api;
