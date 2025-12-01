import React, { useState, useEffect } from 'react';
import { auth } from '../instant.config';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sentEmail, setSentEmail] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: '518718685590-tdetuvpvf8l47b0scg1k64glodvid80f.apps.googleusercontent.com',
        callback: async (response: any) => {
          try {
            await auth.signInWithIdToken({
              idToken: response.credential,
              clientName: 'web',
            });
          } catch (e) {
            console.error('Google Sign-In Error:', e);
            setMessage('Failed to sign in with Google');
          }
        },
      });

      (window as any).google.accounts.id.renderButton(
        document.getElementById('google-sign-in-button'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, []);

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
              <div id="google-sign-in-button" className="w-full flex justify-center"></div>

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
