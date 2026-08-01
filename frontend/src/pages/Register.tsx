import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Brain, Lock, Mail, UserPlus, AlertCircle, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await authAPI.signup({ email, password });
      const tokenData = await authAPI.login({ email, password });
      localStorage.setItem('docmind_token', tokenData.access_token);
      const userData = await authAPI.getMe();
      login(tokenData.access_token, userData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] bg-gradient-to-br from-slate-950 via-indigo-950/60 to-purple-950/80 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>Join 100% Free Workspace</span>
          </div>

          <div className="flex items-center justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-indigo-600 p-0.5 shadow-xl shadow-purple-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-purple-400">
                <Brain className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            Start chatting with your documents & PDFs in seconds
          </p>
        </div>

        {/* Register Card */}
        <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-purple-950/40 relative">
          
          <div className="mb-6 grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Free Vector RAG</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Gemini 2.5 AI</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
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
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 transition-all outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl py-3 pl-11 pr-11 text-slate-100 placeholder-slate-500 transition-all outline-none text-sm"
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 transition-all outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1" /> Get Started Now
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

