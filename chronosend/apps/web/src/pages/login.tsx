import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Clock } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const gsiInited = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || gsiInited.current) return;
    gsiInited.current = true;

    if (window.google) {
      setGsiLoaded(true);
      initGsi();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { setGsiLoaded(true); initGsi(); };
    script.onerror = () => setError('Failed to load Google Sign-In. Check your ad blocker or network.');
    document.head.appendChild(script);

    function initGsi() {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (!response.credential) {
            setError('Google Sign-In returned no credential. Make sure the current domain is listed as an Authorized JavaScript origin in Google Cloud Console.');
            return;
          }
          setError('');
          googleSignIn(response.credential).then((result) => {
            if (result.success) {
              navigate('/dashboard');
            } else {
              setError(result.error || 'Google sign-in failed');
            }
          });
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
      });
    }

    return () => {
      const s = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (s) document.head.removeChild(s);
    };
  }, [googleSignIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    const result = isLogin
      ? await login(email, password)
      : await register(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">ChronoSend</CardTitle>
          <CardDescription>Schedule messages. Send anywhere. One place.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-6 rounded-lg border p-1 bg-muted">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isLogin ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                !isLogin ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error && !email ? '' : undefined}
            />
            <Input
              label="Password"
              type="password"
              placeholder={isLogin ? 'Your password' : 'Min 8 chars, uppercase, lowercase, number'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error && !password ? '' : undefined}
            />
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div ref={googleBtnRef} className="flex justify-center" />
            </>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setIsLogin(false)} className="text-primary hover:underline">
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setIsLogin(true)} className="text-primary hover:underline">
                  Sign In
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme?: string; size?: string; width?: number }) => void;
        };
      };
    };
  }
}
