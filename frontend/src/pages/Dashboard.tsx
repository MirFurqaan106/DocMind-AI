import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { UploadModal } from '../components/UploadModal';
import { useAuth } from '../context/AuthContext';
import { documentAPI } from '../services/api';
import { DocumentItem } from '../types';
import {
  FileText,
  Upload,
  Search,
  Trash2,
  MessageSquare,
  Database,
  Layers,
  Sparkles,
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentAPI.list();
      setDocuments(docs);
      setFilteredDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDocuments(documents);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredDocuments(
        documents.filter((doc) => doc.filename.toLowerCase().includes(q))
      );
    }
  }, [searchQuery, documents]);

  const handleDelete = async () => {
    if (!deleteDocId) return;
    setIsDeleting(true);
    try {
      await documentAPI.delete(deleteDocId);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDocId));
      setDeleteDocId(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 w-full flex-1 space-y-8">
        {/* Welcome & Stats Banner */}
        <div className="glass-card p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Workspace Ready
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{user?.email.split('@')[0]}</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-xl">
                Upload your PDF documents to chunk, embed, and query them in real-time with RAG AI.
              </p>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="btn-primary text-sm py-3 px-6 shadow-xl shadow-indigo-600/20 flex-shrink-0"
            >
              <Upload className="w-4 h-4" /> Upload PDF Document
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Uploaded PDF Docs</p>
                <p className="text-xl font-bold text-white">{documents.length}</p>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Vector Text Chunks</p>
                <p className="text-xl font-bold text-white">{totalChunks}</p>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Vector DB Status</p>
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ChromaDB Connected
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Your Document Library</h2>
              <p className="text-xs text-slate-400">Manage indexed files and vectors</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full pl-10 py-2 text-xs"
              />
            </div>
          </div>

          {/* Document Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card p-5 h-44 animate-pulse bg-slate-900/40" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            /* Empty State */
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No documents found</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm">
                {searchQuery
                  ? `No PDF files matching "${searchQuery}"`
                  : 'Upload your first PDF document to get started chatting with AI.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="btn-primary text-xs mt-5 py-2.5 px-4"
                >
                  <Plus className="w-4 h-4" /> Upload Document
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="glass-card glass-card-hover p-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>

                      <button
                        onClick={() => setDeleteDocId(doc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {doc.filename}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-400" /> {doc.chunk_count} Chunks
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3" /> {formatDate(doc.upload_date)}
                    </span>

                    <button
                      onClick={() => navigate('/chat')}
                      className="text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Start Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => fetchDocuments()}
      />

      {/* Delete Confirmation Modal */}
      {deleteDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-modal w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Document?</h3>
            <p className="text-xs text-slate-400 mt-2">
              This will permanently remove the document from disk and clear all vector embeddings from ChromaDB.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setDeleteDocId(null)}
                disabled={isDeleting}
                className="btn-secondary text-xs w-full py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-danger text-xs w-full py-2.5 justify-center"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
