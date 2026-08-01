import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Brain, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDemoFill = () => {
    setEmail('mirfurkaan106@gmail.com');
    setPassword('Password123!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const tokenData = await authAPI.login({ email, password });
      localStorage.setItem('docmind_token', tokenData.access_token);
      const userData = await authAPI.getMe();
      login(tokenData.access_token, userData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] bg-gradient-to-br from-slate-950 via-indigo-950/60 to-purple-950/80 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Gradient Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>Powered by Gemini 2.5 Flash & ChromaDB</span>
          </div>

          <div className="flex items-center justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
                <Brain className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
            Welcome to DocMind AI
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            Sign in to chat with your documents & PDFs intelligently
          </p>
        </div>

        {/* Login Card */}
        <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-indigo-950/40 relative">
          
          {/* Quick Demo Fill Pill */}
          <div className="mb-6 p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Need a test account?</span>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-200 underline cursor-pointer transition-colors"
            >
              Fill Demo Login
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 transition-all outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-3 pl-11 pr-11 text-slate-100 placeholder-slate-500 transition-all outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Workspace <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                Create Free Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

