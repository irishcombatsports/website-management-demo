import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WAIVER_TEXT = `Training Club participation waiver

Fitness, coaching, and class training involve physical risk. By signing this waiver you confirm that you understand those risks, will train within your ability, will follow coach instructions, and will tell the club about any medical issue, injury, or medication that may affect safe training.

You release Training Club, its coaches, staff, volunteers, and venue partners from claims arising from ordinary risks of participation, except where liability cannot be excluded by law. Nothing in this waiver excludes liability for death or personal injury caused by gross negligence.

You agree that the club may seek emergency medical assistance if needed and may contact your emergency contact. You agree to keep your profile and medical information up to date.

This waiver should be reviewed annually. The dashboard warns after 11 months and treats the waiver as expired after 12 months.`;

export default function Register() {
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [waiverAgreed, setWaiverAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim()) return setError('Please enter your full name.');
    if (!form.email.trim()) return setError('Please enter your email address.');
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError('Please enter a valid email address.');
    if (!form.phone.trim()) return setError('Please enter your phone number.');
    if (!form.password) return setError('Please enter a password.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, experience_level: 'beginner' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }
      setToken(data.token);
      login(data.token, data.user, null);
      setStep(2);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleWaiver(e) {
    e.preventDefault();
    if (!waiverAgreed) {
      setError('Please agree to the waiver to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const t = token || localStorage.getItem('token');
      const res = await fetch('/api/auth/waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ agreed: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to save waiver.');
        return;
      }
      await refreshUser();
      navigate('/dashboard', {
        state: {
          message: 'Thanks, your waiver is signed and saved. The club will contact you to confirm your first class if needed.',
        },
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="text-center mb-8">
          <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2">
            Step {step} of 2
          </p>
          <h1 className="text-3xl font-black text-white">
            {step === 1 ? 'Create Your Account' : 'Sign The Waiver'}
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            {step === 1
              ? 'Create an account first. Extra profile details are collected inside your dashboard.'
              : 'Thanks, your account is created. Next, sign the waiver so the club can confirm your first class.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-1.5 rounded-full bg-purple-700" />
          <div className={`w-8 h-1.5 rounded-full ${step === 2 ? 'bg-purple-700' : 'bg-zinc-700'}`} />
        </div>

        {step === 1 ? (
          <form onSubmit={handleRegister} noValidate className="card space-y-4" data-analytics-label="Membership signup">
            <div>
              <label className="label">Full name</label>
              <input name="full_name" className="input" value={form.full_name} onChange={handleChange} autoComplete="name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" value={form.email} onChange={handleChange} autoComplete="email" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" type="tel" className="input" value={form.phone} onChange={handleChange} autoComplete="tel" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} className="input pr-11" value={form.password} onChange={handleChange} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Continue to waiver'}
            </button>

            <p className="text-center text-zinc-500 text-sm">
              Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleWaiver} className="card space-y-5" data-analytics-label="Waiver submission">
            <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-4 h-64 overflow-y-auto">
              <p className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed">{WAIVER_TEXT}</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={waiverAgreed} onChange={e => setWaiverAgreed(e.target.checked)} className="mt-1 w-4 h-4 accent-purple-600" />
              <span className="text-zinc-300 text-sm">I have read and agree to the participation waiver.</span>
            </label>

            {error && <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">{error}</div>}

            <button type="submit" disabled={loading || !waiverAgreed} className="btn-primary w-full">
              {loading ? 'Saving...' : 'Complete registration'}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-zinc-500 hover:text-zinc-300 text-sm">
              Back to account details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
