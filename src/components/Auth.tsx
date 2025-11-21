import React, { useState } from 'react';
import { auth } from '../instant.config';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('magic');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sentEmail, setSentEmail] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await auth.sendMagicCode({ email });
      setSentEmail(true);
      setMessage('Check your email for the login link!');
    } catch (error: any) {
      setMessage(error.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        await auth.signUp({ email, password });
        setMessage('Account created! You can now log in.');
        setMode('login');
      } else {
        await auth.signIn({ email, password });
      }
    } catch (error: any) {
      setMessage(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dad-bg flex items-center justify-center p-6">
      <div className="bg-dad-card p-8 rounded-3xl border border-gray-700 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Betterish</h1>
          <p className="text-dad-muted text-sm">Progress over perfection</p>
        </div>

        {!sentEmail ? (
          <>
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('magic')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  mode === 'magic'
                    ? 'bg-dad-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Magic Link
              </button>
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  mode === 'login'
                    ? 'bg-dad-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  mode === 'signup'
                    ? 'bg-dad-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Forms */}
            {mode === 'magic' ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dad@example.com"
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-dad-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-dad-primary text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dad@example.com"
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-dad-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-dad-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-dad-primary text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Log In'}
                </button>
              </form>
            )}

            {message && (
              <p
                className={`mt-4 text-sm text-center ${
                  message.includes('Check') || message.includes('created')
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {message}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
            <p className="text-gray-400 mb-6">
              We sent a magic link to <span className="text-dad-primary">{email}</span>
            </p>
            <button
              onClick={() => {
                setSentEmail(false);
                setMessage('');
              }}
              className="text-dad-primary hover:underline text-sm"
            >
              Try a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
