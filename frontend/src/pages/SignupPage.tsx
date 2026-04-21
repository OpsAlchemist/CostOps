import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
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

    setLoading(true);
    try {
      await signup(email, password, name, email);
      navigate('/calculator');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      if (msg.toLowerCase().includes('already exists')) {
        setError('Account already exists. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface focus:outline-hidden focus:border-brand-primary transition-colors text-sm";

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
          {error && (
            <div className={`p-3 rounded-lg text-sm font-bold text-center ${
              error.includes('Redirecting')
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-danger/10 border border-danger/20 text-danger'
            }`}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="John Doe" className={inputClass} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" className={inputClass} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className={inputClass} required minLength={6} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" className={inputClass} required minLength={6} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full group mt-2">
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-ink-muted">
          Already have an account? <Link to="/login" className="font-bold text-ink-heading hover:text-brand-primary transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
