import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/overview');
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
          <h1 className="text-3xl font-black mb-2">Create Your Account</h1>
          <p className="text-ink-muted">Start optimizing your cloud costs today</p>
        </div>

        <form onSubmit={handleSignup} className="panel-card p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface focus:outline-hidden focus:border-brand-primary transition-colors text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            Create Account
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-ink-muted">
          Already have an account? <Link to="/login" className="font-bold text-ink-heading hover:text-brand-primary transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
