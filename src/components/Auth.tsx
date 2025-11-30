import React, { useState } from 'react';
import { auth } from '../instant.config';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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
      setMessage('Check your email for the code!');
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await auth.signInWithMagicCode({ email, code });
      // Success - user will be logged in automatically by the App component listening to auth state
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || 'Invalid code');
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
            <div className="space-y-4">
              <button
                onClick={() => (auth as any).signInWithOAuth({ provider: 'google', clientName: 'betterish' })}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-3 border border-gray-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">Or use email</span>
                <div className="flex-grow border-t border-gray-700"></div>
              </div>

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
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
              </form>
            </div>

            {message && !sentEmail && (
              <p className="mt-4 text-sm text-center text-red-400">
                {message}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
            <p className="text-gray-400 mb-4">
              We sent a code to <span className="text-dad-primary">{email}</span>
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4 mt-6">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-dad-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-dad-primary text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            {message && sentEmail && (
              <p className="mt-4 text-sm text-center text-red-400">
                {message}
              </p>
            )}

            <button
              onClick={() => {
                setSentEmail(false);
                setMessage('');
                setCode('');
              }}
              className="text-dad-primary hover:underline text-sm mt-4"
            >
              Try a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
