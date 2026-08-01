import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Navbar } from '../components/Navbar';
import { SettingsModal } from '../components/SettingsModal';
import { chatAPI } from '../services/api';
import { ChatMessage, SourceCitation } from '../types';
import {
  Send,
  Brain,
  MessageSquare,
  FileText,
  BookOpen,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Bot,
  Plus
} from 'lucide-react';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const history = await chatAPI.getHistory();
      setMessages(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = inputQuestion.trim();
    if (!q || isLoading) return;

    setInputQuestion('');
    setIsLoading(true);

    // Optimistically push user message to UI
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      question: q,
      answer: '',
      sources: [],
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const responseMsg = await chatAPI.query(q);
      // Replace optimistic entry with backend response payload
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempUserMsg.id ? responseMsg : msg))
      );
    } catch (err: any) {
      console.error('Error submitting query:', err);
      const errorMsg: ChatMessage = {
        id: Date.now(),
        question: q,
        answer: 'Sorry, I encountered an error retrieving answers from your documents. Please verify your document uploads and try again.',
        sources: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempUserMsg.id ? errorMsg : msg))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      try {
        await chatAPI.clearHistory();
        setMessages([]);
      } catch (err) {
        console.error('Failed to clear history:', err);
      }
    }
  };

  const suggestedPrompts = [
    'What are the key points summarized in my uploaded documents?',
    'Explain the main findings or methodology mentioned in the PDF.',
    'List any important dates, names, or requirements found in the text.'
  ];

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col h-screen overflow-hidden">
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">
        {/* Left Chat History Sidebar */}
        <aside className="hidden md:flex flex-col w-72 border-r border-slate-800/80 bg-slate-950/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Chat History
            </h3>
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No previous conversations</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all group"
                  onClick={() => {
                    const el = document.getElementById(`msg-${msg.id}`);
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300">
                    {msg.question}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Conversation Container */}
        <main className="flex-1 flex flex-col h-full bg-[#090d16] relative overflow-hidden">
          {/* Scrollable Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              /* Starter Prompt Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-3 text-white shadow-xl shadow-indigo-500/20 mb-4 animate-bounce">
                  <Brain className="w-full h-full" />
                </div>
                <h2 className="text-xl font-bold text-white">How can I help you today?</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Ask questions about your uploaded PDFs. DocMind AI will retrieve relevant text chunks and cite page numbers.
                </p>

                <div className="grid grid-cols-1 gap-2.5 mt-6 w-full max-w-lg">
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputQuestion(prompt);
                      }}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 text-left text-xs text-slate-300 hover:text-white transition-all hover:bg-slate-900/90 flex items-center justify-between"
                    >
                      <span>{prompt}</span>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div id={`msg-${msg.id}`} key={msg.id || index} className="space-y-4 max-w-3xl mx-auto">
                  {/* User Question Bubble */}
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-md">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="bg-indigo-600/20 border border-indigo-500/30 text-white px-4 py-3 rounded-2xl rounded-tr-none text-sm max-w-[85%]">
                      {msg.question}
                    </div>
                  </div>

                  {/* AI Response Card */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>

                    <div className="flex-1 glass-card p-5 space-y-4 rounded-tl-none">
                      {!msg.answer ? (
                        /* AI Thinking Indicator */
                        <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium py-2">
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Retrieving chunks & generating grounded answer...</span>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed">
                            <ReactMarkdown>{msg.answer}</ReactMarkdown>
                          </div>

                          {/* Source Citations Accordion */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="pt-3 border-t border-slate-800/80">
                              <button
                                onClick={() =>
                                  setExpandedSourceId(expandedSourceId === msg.id ? null : msg.id)
                                }
                                className="flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>
                                  {msg.sources.length} Referenced Source Document{msg.sources.length > 1 ? 's' : ''}
                                </span>
                                {expandedSourceId === msg.id ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {expandedSourceId === msg.id && (
                                <div className="mt-3 space-y-2">
                                  {msg.sources.map((src, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between font-semibold text-slate-300">
                                        <span className="flex items-center gap-1.5 text-indigo-300">
                                          <FileText className="w-3.5 h-3.5" /> {src.document_name}
                                        </span>
                                        {src.page_number && (
                                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px]">
                                            Page {src.page_number}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-1">
                                        "{src.content_snippet}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="p-4 bg-[#090d16]/90 backdrop-blur-xl border-t border-slate-800/80">
            <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
              <input
                type="text"
                placeholder="Ask a question about your uploaded documents..."
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                disabled={isLoading}
                className="glass-input w-full pr-12 py-3.5 text-sm"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isLoading}
                className="absolute right-2.5 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
