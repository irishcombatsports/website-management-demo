import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. The link may have expired.');
        return;
      }
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
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
          <h1 className="text-3xl font-black text-white">New Password</h1>
          <p className="text-zinc-500 mt-2 text-sm">Choose a strong password for your account.</p>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-white font-semibold mb-2">Password updated!</p>
              <p className="text-zinc-400 text-sm">Redirecting you to login…</p>
              <Link to="/login" className="block mt-6 text-purple-400 hover:text-purple-300 text-sm transition-colors">
                Go to login →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm rounded-lg px-4 py-3">
                  {error}
                  {!token && (
                    <Link to="/forgot-password" className="block mt-2 text-purple-400 hover:text-purple-300 underline">
                      Request a new reset link
                    </Link>
                  )}
                </div>
              )}

              <div>
                <label className="label">New password</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  disabled={!token}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="label">Confirm new password</label>
                <input
                  type="password"
                  className="input"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  disabled={!token}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Updating…' : 'Set New Password'}
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
