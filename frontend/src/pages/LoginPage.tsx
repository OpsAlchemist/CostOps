import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, Lock, ArrowRight, Apple } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, oauthLogin } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Manual login is hidden unless ?override=true is in the URL
  const showManualLogin = searchParams.get('override') === 'true';

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    // Load Google Identity Services
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
            setError(err instanceof Error ? err.message : 'Google sign-in failed');
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [oauthLogin, navigate]);

  const handleAppleSignIn = async () => {
    // Apple sign-in would use AppleID.auth.init and AppleID.auth.signIn
    // For now this is a placeholder — requires APPLE_CLIENT_ID and Services ID setup
    setError('Apple Sign-In coming soon');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/overview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
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

        <div className="panel-card p-8 flex flex-col gap-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-bold text-center">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 items-center">
            {GOOGLE_CLIENT_ID ? (
              <div ref={googleBtnRef} />
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-surface text-sm font-bold text-ink-muted cursor-not-allowed"
              >
                Google Sign-In (not configured)
              </button>
            )}

            <button
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              <Apple size={18} /> Continue with Apple
            </button>
          </div>

          {showManualLogin && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold text-ink-muted uppercase">Manual Login</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-6">
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

                <button type="submit" disabled={loading} className="btn-primary w-full group">
                  {loading ? 'Signing in...' : 'Continue to Dashboard'}
                  {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </>
          )}
        </div>

        {showManualLogin && (
          <p className="text-center mt-8 text-sm text-ink-muted">
            Don't have an account? <Link to="/signup?override=true" className="font-bold text-ink-heading hover:text-brand-primary transition-colors">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
};
