import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Apple } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signup, oauthLogin } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const showManualSignup = searchParams.get('override') === 'true';

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            setLoading(true);
            await oauthLogin('google', response.credential);
            navigate('/overview');
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Google sign-up failed');
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signup_with',
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [oauthLogin, navigate]);

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
      navigate('/overview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      if (msg.toLowerCase().includes('already exists')) {
        setError('Account already exists. Redirecting to login...');
        setTimeout(() => navigate('/login?override=true'), 2000);
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

        <div className="panel-card p-8 flex flex-col gap-6">
          {error && (
            <div className={`p-3 rounded-lg text-sm font-bold text-center ${
              error.includes('Redirecting')
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-danger/10 border border-danger/20 text-danger'
            }`}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 items-center">
            {GOOGLE_CLIENT_ID ? (
              <div ref={googleBtnRef} />
            ) : (
              <button disabled className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-sm font-bold text-ink-muted cursor-not-allowed">
                Google Sign-Up (not configured)
              </button>
            )}
            <button disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors">
              <Apple size={18} /> Continue with Apple
            </button>
          </div>

          {showManualSignup && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold text-ink-muted uppercase">Manual Sign Up</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSignup} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className={inputClass} required />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputClass} required />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} required minLength={6} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-muted">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} required minLength={6} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full group">
                  {loading ? 'Creating Account...' : 'Create Account'}
                  {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-8 text-sm text-ink-muted">
          Already have an account? <Link to={showManualSignup ? "/login?override=true" : "/login"} className="font-bold text-ink-heading hover:text-brand-primary transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
