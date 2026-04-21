import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/calculator');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to connect to server');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-brand-primary rounded-[10px] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-primary/20">
              C
            </div>
          </div>
          <h1 className="text-3xl font-black mb-2">Welcome Back</h1>
          <p className="text-ink-muted">Sign in to manage your cloud efficiency</p>
        </div>

        <form onSubmit={handleLogin} className="panel-card p-8 flex flex-col gap-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface focus:outline-hidden focus:border-brand-primary transition-colors text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface focus:outline-hidden focus:border-brand-primary transition-colors text-sm"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full group mt-2">
            Continue to Dashboard
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-ink-muted">
          Don't have an account? <Link to="/signup" className="font-bold text-ink-heading hover:text-brand-primary transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
