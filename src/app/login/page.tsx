'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LurelitMascot from '@/components/LurelitMascot';

function LurelitWordmark() {
  return (
    <span className="mono" style={{ fontSize: 22, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <span style={{ color: 'var(--teal-bright)' }} className="glow-text-teal">LURE</span>
      <span style={{ color: 'var(--text-dim)' }}>LIT</span>
    </span>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'basic' | 'api_key'>('basic');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authMode, username, password, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsSetup) {
          setError('No configuration found. Redirecting to setup…');
          setTimeout(() => router.push('/setup'), 1500);
          return;
        }
        throw new Error(data.error || 'Login failed');
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <LurelitMascot size={120} state="watching" />
          <div style={{ marginTop: 18 }}>
            <LurelitWordmark />
          </div>
          <p className="mono" style={{ fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--pink)', marginTop: 8, opacity: 0.8 }}>
            Don&apos;t take the bait.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <p className="label" style={{ color: 'var(--teal-bright)', marginBottom: 20 }}>// Authenticate</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', color: 'var(--text-faint)', marginBottom: 8 }}>Authentication method</label>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {[
                  { key: 'basic', label: 'Username / Password' },
                  { key: 'api_key', label: 'API Key' },
                ].map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setAuthMode(option.key as 'basic' | 'api_key')}
                    className="mono"
                    style={{
                      padding: '7px 10px',
                      borderRadius: 3,
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      border: `1px solid ${authMode === option.key ? 'var(--teal)' : 'var(--border-strong)'}`,
                      background: authMode === option.key ? 'rgba(0,191,179,0.10)' : 'transparent',
                      color: authMode === option.key ? 'var(--teal-bright)' : 'var(--text-dim)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {authMode === 'basic' ? (
              <>
                <div>
                  <label className="label-sm" style={{ display: 'block', color: 'var(--text-faint)', marginBottom: 6 }}>Username</label>
                  <input
                    className="input"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="analyst"
                    autoFocus
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', color: 'var(--text-faint)', marginBottom: 6 }}>Password</label>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label-sm" style={{ display: 'block', color: 'var(--text-faint)', marginBottom: 6 }}>Display name</label>
                  <input
                    className="input"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="analyst"
                    autoFocus
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', color: 'var(--text-faint)', marginBottom: 6 }}>Elastic API Key</label>
                  <textarea
                    className="input"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Paste an encoded Elastic API key"
                    rows={3}
                    style={{ resize: 'vertical', minHeight: 96 }}
                  />
                </div>
              </>
            )}

            {error && (
              <div style={{ padding: 12, borderRadius: 3, border: '1px solid rgba(240,78,152,0.3)', background: 'rgba(240,78,152,0.06)' }}>
                <p className="mono" style={{ fontSize: 12, color: 'var(--pink)' }}>{error}</p>
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading || (authMode === 'api_key' ? !apiKey : !username || !password)} style={{ marginTop: 12, justifyContent: 'center', width: '100%' }}>
              {loading ? (
                <>
                  <div className="animate-spin-slow" style={{ width: 14, height: 14, border: '2px solid rgba(5,2,16,0.3)', borderTopColor: 'var(--bg-deep)', borderRadius: '50%' }} />
                  Authenticating…
                </>
              ) : 'Sign in →'}
            </button>
          </form>
        </div>

        <p className="mono" style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.16em', marginTop: 18 }}>
          Powered by Elastic Workflows and Agent Builder
        </p>
      </div>
    </main>
  );
}
