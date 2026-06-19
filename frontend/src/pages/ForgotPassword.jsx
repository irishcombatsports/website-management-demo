import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 pt-16 pb-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">Reset Password</h1>
          <p className="text-zinc-500 mt-2 text-sm">We'll send a reset link to your email.</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <p className="text-white font-semibold mb-2">Check your email</p>
              <p className="text-zinc-400 text-sm">If that email is registered, you'll receive a reset link shortly.</p>
              <Link to="/login" className="block mt-6 text-purple-400 hover:text-purple-300 text-sm transition-colors">
                ← Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <p className="text-center">
                <Link to="/login" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  ← Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
