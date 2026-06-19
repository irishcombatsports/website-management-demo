import { useState } from 'react';
import { Link } from 'react-router-dom';

const EXPERIENCE_OPTIONS = [
  ['beginner', 'Beginner'],
  ['some', 'Some experience'],
  ['experienced', 'Experienced'],
  ['competitor', 'Competitor'],
];

export default function WaitingList() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    experience_level: 'beginner',
    preferred_classes: '',
    notes: '',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Please enter your name.');
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return setError('Please enter a valid email address.');
    if (!form.phone.trim()) return setError('Please enter your phone number.');

    setStatus('loading');
    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not join the waiting list.');
        setStatus('error');
        return;
      }
      setStatus('success');
      setForm({ name: '', email: '', phone: '', experience_level: 'beginner', preferred_classes: '', notes: '' });
    } catch {
      setError('Network error. Please try again or message the club directly.');
      setStatus('error');
    }
  };

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="text-center mb-10">
          <p className="text-purple-400 text-xs font-semibold tracking-widest uppercase mb-3">Club capacity</p>
          <h1 className="text-4xl font-black text-white mb-3">
            Join The <span className="text-purple-400">Waiting List</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            If membership is full, leave your details here and we will contact you when a place opens.
          </p>
        </div>

        {status === 'success' ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-white font-bold text-lg mb-2">You are on the waiting list</p>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Your details have been saved. We will contact you when a space becomes available.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setStatus('idle')} className="btn-secondary px-6 py-3">
                Add another person
              </button>
              <Link to="/" className="btn-primary px-6 py-3">
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="card space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Experience</label>
                <select className="input" value={form.experience_level} onChange={e => update('experience_level', e.target.value)}>
                  {EXPERIENCE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Preferpurple classes</label>
              <input
                className="input"
                placeholder="E.g. Kids training, Mixed Training, Fundamentals, Circuits"
                value={form.preferred_classes}
                onChange={e => update('preferred_classes', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                className="input min-h-[110px] resize-none"
                placeholder="Anything useful for the coach to know."
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
              />
            </div>

            {(error || status === 'error') && (
              <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {status === 'loading' ? 'Saving…' : 'Join Waiting List'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
