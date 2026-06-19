import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';

const DISCOUNTS = [];

function DiscountsCard() {
  const [copied, setCopied] = useState(null);

  const copy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div>
          <p className="text-white font-semibold text-sm">Member Discounts</p>
          <p className="text-zinc-500 text-xs">Club offers and partner codes</p>
        </div>
      </div>
      <div className="space-y-3">
        {DISCOUNTS.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-5 text-center">
            <p className="text-zinc-400 text-sm font-medium">No member discounts added yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Club offers and partner codes will appear here when available.</p>
          </div>
        ) : DISCOUNTS.map((d) => (
          <div key={d.code} className="bg-zinc-900 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-base">{d.emoji}</span>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-semibold text-sm hover:text-purple-300 transition-colors truncate"
                >
                  {d.brand}
                </a>
              </div>
              <p className="text-zinc-500 text-xs">{d.desc}</p>
            </div>
            <button
              onClick={() => copy(d.code)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                copied === d.code
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-purple-700/20 text-purple-300 border border-purple-700/40 hover:bg-purple-700/30'
              }`}
            >
              {copied === d.code ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  COPIED
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {d.code}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MembershipBadge({ membership }) {
  if (!membership) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-zinc-800 text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" /> No Active Membership
      </span>
    );
  }
  const startsAt = membership.starts_at ? new Date(membership.starts_at) : null;
  const isUpcoming = membership.status === 'active' && startsAt && startsAt > new Date();
  const isActive = membership.status === 'active'
    && (!startsAt || startsAt <= new Date())
    && (!membership.expires_at || new Date(membership.expires_at) > new Date());
  const label = membership.type === 'monthly' ? 'Unlimited Monthly' : membership.type === 'limited_monthly' ? '2 Classes Weekly' : membership.type === 'drop_in' ? 'Drop-In' : 'Free Trial';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
      isActive ? 'bg-green-500/15 text-green-400' : isUpcoming ? 'bg-blue-500/15 text-blue-400' : 'bg-zinc-800 text-zinc-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : isUpcoming ? 'bg-blue-400' : 'bg-zinc-500'}`} />
      {isActive ? label : isUpcoming ? `${label} Upcoming` : 'Expired'}
    </span>
  );
}

function WaiverCard({ user, onSigned }) {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [error, setError] = useState('');
  const [signedMsg, setSignedMsg] = useState('');

  const WAIVER_SHORT = `By signing, I acknowledge the risks of fitness, coaching, and class training and release Training Club from liability for injuries arising from my participation, except where caused by gross negligence. I confirm I am medically fit to train and will follow the club's code of conduct.`;

  const handleSign = async () => {
    if (!agreed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ agreed: true }),
      });
      if (!res.ok) throw new Error();
      await onSigned();
      setSignedMsg('Thanks, your waiver is signed and saved. The club will contact you to confirm your first class if needed.');
    } catch {
      setError('Failed to save waiver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user.waiver_signed) {
    const signedAt = user.waiver_signed_at ? new Date(user.waiver_signed_at) : null;
    const ageDays = signedAt ? Math.floor((Date.now() - signedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isExpired = ageDays >= 365;
    const isExpiring = ageDays >= 335 && !isExpired;
    return (
      <div className={`card flex items-center gap-4 ${isExpired ? 'border-orange-500/30 bg-orange-500/5' : ''}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isExpired || isExpiring ? 'bg-orange-500/15' : 'bg-green-500/15'}`}>
          <svg className={`w-5 h-5 ${isExpired || isExpiring ? 'text-orange-400' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{isExpired ? 'Waiver Expired' : isExpiring ? 'Waiver Renewal Due Soon' : 'Waiver Signed'}</p>
          {signedMsg && <p className="text-green-300 text-xs mt-1">{signedMsg}</p>}
          <p className="text-zinc-500 text-xs mt-0.5">
            Signed on {signedAt?.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {isExpired && <p className="text-orange-300 text-xs mt-1">Please contact the club to renew your waiver before training.</p>}
          {isExpiring && <p className="text-orange-300 text-xs mt-1">Your waiver is close to 12 months old. Renew it soon.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="card border-orange-500/30 bg-orange-500/5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Waiver Required</p>
          <p className="text-zinc-400 text-xs mt-0.5">Please sign the participation waiver before attending your first class.</p>
        </div>
      </div>

      {!showWaiver ? (
        <button onClick={() => setShowWaiver(true)} className="text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors">
          Read & Sign Waiver →
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-zinc-900 rounded-lg p-3 text-zinc-400 text-xs leading-relaxed">{WAIVER_SHORT}</div>
          {error && <p className="text-purple-300 text-xs">{error}</p>}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-purple-600" />
            <span className="text-zinc-300 text-xs">I agree to the participation waiver</span>
          </label>
          <button
            onClick={handleSign}
            disabled={!agreed || loading}
            className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Saving...' : 'Sign Waiver'}
          </button>
        </div>
      )}
    </div>
  );
}

function ageFromDob(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

const blankChildForm = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  experience_level: 'beginner',
  preferred_classes: '',
  medical_notes: '',
};

function ChildProfilesCard() {
  const [children, setChildren] = useState([]);
  const [form, setForm] = useState(blankChildForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [waiverChild, setWaiverChild] = useState(null);
  const [guardianName, setGuardianName] = useState('');
  const [agreed, setAgreed] = useState(false);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/children', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (res.ok) setChildren(data.children || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const resetForm = () => {
    setForm(blankChildForm);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (child) => {
    setForm({
      first_name: child.first_name || '',
      last_name: child.last_name || '',
      date_of_birth: child.date_of_birth || '',
      experience_level: child.experience_level || 'beginner',
      preferred_classes: child.preferred_classes || '',
      medical_notes: child.medical_notes || '',
    });
    setEditingId(child.id);
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const saveChild = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(editingId ? `/api/auth/children/${editingId}` : '/api/auth/children', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save child profile.');
        return;
      }
      setMessage(editingId ? 'Child profile updated.' : 'Child profile added.');
      resetForm();
      await loadChildren();
      window.dispatchEvent(new Event('childrenUpdated'));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const signChildWaiver = async () => {
    if (!waiverChild || !agreed) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/auth/children/${waiverChild.id}/waiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ agreed: true, guardian_name: guardianName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save child waiver.');
        return;
      }
      setMessage(`Waiver signed for ${waiverChild.first_name}.`);
      setWaiverChild(null);
      setGuardianName('');
      setAgreed(false);
      await loadChildren();
      window.dispatchEvent(new Event('childrenUpdated'));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const CHILD_WAIVER_SHORT = `I confirm I am the parent or legal guardian of this child and consent to their participation in training and fitness classes at Training Club. I understand physical training carries risk of injury, confirm the medical details provided are accurate, and agree that the child will follow coach instructions and club rules.`;

  return (
    <div className="card overflow-hidden p-0">
      <div className="relative border-b border-zinc-800 bg-zinc-950 px-4 py-4 sm:px-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-purple-700" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10">
                <svg className="h-5 w-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m6-8a4 4 0 11-8 0 4 4 0 018 0zm6 2a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Kids</p>
                <p className="text-zinc-500 text-xs mt-0.5">Profiles and guardian waivers for kids classes.</p>
              </div>
            </div>
            {children.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300">
                  {children.length} child profile{children.length !== 1 ? 's' : ''}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  children.every(child => Boolean(child.waiver_signed)) ? 'bg-green-500/10 text-green-300' : 'bg-orange-500/10 text-orange-300'
                }`}>
                  {children.filter(child => !Boolean(child.waiver_signed)).length === 0
                    ? 'All waivers signed'
                    : `${children.filter(child => !Boolean(child.waiver_signed)).length} waiver${children.filter(child => !Boolean(child.waiver_signed)).length !== 1 ? 's' : ''} needed`}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm && !editingId) return resetForm();
              setForm(blankChildForm);
              setEditingId(null);
              setShowForm(true);
              setMessage('');
              setError('');
            }}
            className="flex-shrink-0 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3 py-2 transition-colors"
          >
            {showForm && !editingId ? 'Cancel' : 'Add Child'}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
      {message && (
        <div className="mb-3 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-green-300 text-xs font-medium">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-purple-300 text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-5">
          <p className="text-zinc-500 text-sm">Loading child profiles...</p>
        </div>
      ) : children.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-purple-300">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-zinc-200 text-sm font-semibold">Add a child before their first kids class</p>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">Keep their details, medical notes, and guardian waiver in one place.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-lg border border-purple-700/50 px-4 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-700/10 transition-colors"
          >
            Create Child Profile
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map(child => {
            const age = ageFromDob(child.date_of_birth);
            return (
              <div key={child.id} className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-700/15 text-sm font-black text-purple-200 ring-1 ring-purple-500/20">
                      {child.first_name?.[0]}{child.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold">{child.first_name} {child.last_name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                          {age !== null ? `${age} years old` : 'Age not added'}
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                          {child.experience_level || 'beginner'}
                        </span>
                      </div>
                      {child.preferred_classes && <p className="text-zinc-500 text-xs mt-2">{child.preferred_classes}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Boolean(child.waiver_signed) ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {Boolean(child.waiver_signed) ? 'Waiver signed' : 'Waiver needed'}
                  </span>
                </div>
                {child.medical_notes && <p className="text-zinc-400 text-xs mt-2 leading-relaxed">{child.medical_notes}</p>}
                {Boolean(child.waiver_signed) && (
                  <p className="text-zinc-600 text-xs mt-2">
                    Signed by {child.waiver_signed_by || 'guardian'} on {new Date(child.waiver_signed_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => startEdit(child)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
                    Edit
                  </button>
                  {!Boolean(child.waiver_signed) && (
                    <button type="button" onClick={() => { setWaiverChild(child); setGuardianName(''); setAgreed(false); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/40 text-orange-300 hover:bg-orange-500/15 transition-colors">
                      Sign Waiver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <form onSubmit={saveChild} className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <div>
            <p className="text-white text-sm font-semibold">{editingId ? 'Edit child profile' : 'New child profile'}</p>
            <p className="text-zinc-500 text-xs mt-0.5">These details are visible to the club admin.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">First Name</label>
              <input className="input py-2 text-sm" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div>
              <label className="label text-xs">Last Name</label>
              <input className="input py-2 text-sm" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Date of Birth</label>
              <input type="date" className="input py-2 text-sm" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <label className="label text-xs">Experience</label>
              <select className="input py-2 text-sm" value={form.experience_level} onChange={e => setForm({ ...form, experience_level: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="some">Some experience</option>
                <option value="experienced">Experienced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label text-xs">Preferpurple Classes</label>
            <input className="input py-2 text-sm" placeholder="Kids training, Mixed Training..." value={form.preferred_classes} onChange={e => setForm({ ...form, preferred_classes: e.target.value })} />
          </div>
          <div>
            <label className="label text-xs">Medical Notes</label>
            <textarea className="input text-sm resize-none min-h-[68px]" value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
              {saving ? 'Saving...' : editingId ? 'Save Child' : 'Add Child'}
            </button>
          </div>
        </form>
      )}

      {waiverChild && (
        <div className="mt-4 rounded-xl border border-orange-500/25 bg-orange-500/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.5-3.5L12 3 3.5 6.5v5.25c0 4.75 3.5 8.75 8.5 9.75 5-1 8.5-5 8.5-9.75V6.5z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Guardian Waiver for {waiverChild.first_name}</p>
              <p className="text-zinc-500 text-xs mt-0.5">This is separate from your own adult waiver.</p>
            </div>
          </div>
          <div className="bg-zinc-950 rounded-lg p-3 text-zinc-400 text-xs leading-relaxed">{CHILD_WAIVER_SHORT}</div>
          <div>
            <label className="label text-xs">Guardian Name</label>
            <input className="input py-2 text-sm" placeholder="Your full legal name" value={guardianName} onChange={e => setGuardianName(e.target.value)} />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-purple-600" />
            <span className="text-zinc-300 text-xs">I am the parent/legal guardian and agree to this waiver for {waiverChild.first_name}.</span>
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setWaiverChild(null)} className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="button" onClick={signChildWaiver} disabled={!agreed || saving} className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
              {saving ? 'Saving...' : 'Sign Child Waiver'}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Generate upcoming class sessions for the next 14 days
function getUpcomingClasses() {
  const schedule = {
    1: [{ name: 'Kids Fundamentals', time: '6-7pm' }],
    2: [{ name: 'Circuits', time: '5-6pm' }, { name: 'Mixed Training', time: '6-7pm' }, { name: 'Fundamentals', time: '7-8pm' }],
    3: [{ name: 'Kids Fundamentals', time: '6-7pm' }, { name: 'Fundamentals', time: '8-9pm' }],
    4: [{ name: 'Circuits', time: '5-6pm' }, { name: 'Mixed Training', time: '6-7pm' }],
    5: [{ name: 'Mixed Training', time: '6-7pm' }, { name: 'Fundamentals', time: '7-8pm' }],
  };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const classes = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    if (schedule[dow]) {
      schedule[dow].forEach(cls => {
        classes.push({
          id: `${d.toISOString().slice(0, 10)}-${cls.name}`,
          label: `${dayNames[dow]} ${d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })} · ${cls.name} ${cls.time}`,
        });
      });
    }
  }
  return classes;
}

function DropInModal({ onConfirm, onCancel, loading }) {
  const classes = getUpcomingClasses();
  const [selected, setSelected] = useState(classes[0]?.id || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-white font-bold text-lg mb-1">Pick Your Class</h3>
        <p className="text-zinc-400 text-sm mb-4">Choose which session you'd like to drop in to. We'll confirm your spot.</p>
        <div className="space-y-2 max-h-56 overflow-y-auto mb-5 pr-1">
          {classes.map(cls => (
            <label key={cls.id} className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 border transition-colors ${
              selected === cls.id ? 'border-purple-600 bg-purple-600/10' : 'border-zinc-700 hover:border-zinc-500'
            }`}>
              <input
                type="radio"
                name="class"
                value={cls.id}
                checked={selected === cls.id}
                onChange={() => setSelected(cls.id)}
                className="accent-purple-600"
              />
              <span className="text-zinc-200 text-sm">{cls.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(classes.find(c => c.id === selected)?.label || '')}
            disabled={loading || !selected}
            className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Loading…' : 'Continue to Pay →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function isLastWeekOfMonth(date = new Date()) {
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  const daysLeft = Math.ceil((monthEnd - date) / (1000 * 60 * 60 * 24));
  return daysLeft >= 0 && daysLeft <= 7;
}

function monthLabel(offset = 0) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return date.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });
}

function MonthChoiceModal({ type, onConfirm, onCancel, loading }) {
  const title = type === 'limited_monthly' ? '2 Classes Weekly' : 'Unlimited Monthly';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-white font-bold text-lg mb-1">Choose Membership Month</h3>
        <p className="text-zinc-400 text-sm mb-4">
          You're near the end of the month. Choose when this {title} membership should start.
        </p>
        <div className="space-y-2 mb-5">
          <button
            onClick={() => onConfirm('current')}
            disabled={loading}
            className="w-full text-left rounded-lg border border-zinc-700 hover:border-zinc-500 px-4 py-3 transition-colors disabled:opacity-50"
          >
            <p className="text-white text-sm font-semibold">Start this month</p>
            <p className="text-zinc-500 text-xs mt-0.5">Valid until the end of {monthLabel(0)}</p>
          </button>
          <button
            onClick={() => onConfirm('next')}
            disabled={loading}
            className="w-full text-left rounded-lg border border-purple-700/50 hover:border-purple-500 bg-purple-700/10 px-4 py-3 transition-colors disabled:opacity-50"
          >
            <p className="text-purple-200 text-sm font-semibold">Start next month</p>
            <p className="text-zinc-500 text-xs mt-0.5">Valid from 1 {monthLabel(1)}</p>
          </button>
        </div>
        <button onClick={onCancel} className="w-full border border-zinc-700 text-zinc-400 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function MembershipCard({ membership, onRefresh, successMsg }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [showDropInModal, setShowDropInModal] = useState(false);
  const [monthChoiceType, setMonthChoiceType] = useState(null);

  const activate = async (type, classPreference = '', membershipPeriod = 'current') => {
    setLoading(type);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ type, class_preference: classPreference, membership_period: membershipPeriod }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDropIn = () => setShowDropInModal(true);
  const handleMonthly = (type) => {
    if (isLastWeekOfMonth()) {
      setMonthChoiceType(type);
      return;
    }
    activate(type, '', 'current');
  };

  const startsAt = membership?.starts_at ? new Date(membership.starts_at) : null;
  const isUpcoming = membership?.status === 'active' && startsAt && startsAt > new Date();
  const isActive = membership?.status === 'active'
    && (!startsAt || startsAt <= new Date())
    && (!membership?.expires_at || new Date(membership.expires_at) > new Date());
  const expiresAt = membership?.expires_at ? new Date(membership.expires_at) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <>
      {showDropInModal && (
        <DropInModal
          loading={loading === 'drop_in'}
          onConfirm={(classLabel) => { setShowDropInModal(false); activate('drop_in', classLabel); }}
          onCancel={() => setShowDropInModal(false)}
        />
      )}
      {monthChoiceType && (
        <MonthChoiceModal
          type={monthChoiceType}
          loading={loading === monthChoiceType}
          onConfirm={(period) => { const type = monthChoiceType; setMonthChoiceType(null); activate(type, '', period); }}
          onCancel={() => setMonthChoiceType(null)}
        />
      )}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-1">Membership</p>
            <MembershipBadge membership={membership} />
          </div>
          {(isActive || isUpcoming) && expiresAt && (
            <div className="text-right">
              <p className="text-zinc-500 text-xs">{isUpcoming ? 'Starts' : 'Expires'}</p>
              {isUpcoming ? (
                <p className="text-white text-sm font-semibold">{startsAt.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              ) : (
                <>
              <p className="text-white text-sm font-semibold">{expiresAt.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              {daysLeft <= 7 && <p className="text-orange-400 text-xs">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</p>}
                </>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-purple-400 text-xs mb-3">{error}</p>}

        {/* No membership yet — show all options */}
        {!membership && (
          <div className="space-y-2 mt-2">
            <p className="text-zinc-500 text-xs mb-3">Choose how you want to train:</p>
            <button onClick={() => activate('free_class')} disabled={!!loading} className="w-full border border-zinc-700 hover:border-zinc-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'free_class' ? 'Activating…' : '🎁 Book Free Trial Class'}
            </button>
            <button onClick={() => handleMonthly('monthly')} disabled={!!loading} className="w-full bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'monthly' ? 'Loading…' : '⚡ Unlimited Monthly — €80/month'}
            </button>
            <button onClick={() => handleMonthly('limited_monthly')} disabled={!!loading} className="w-full border border-purple-700/50 hover:border-purple-500 text-purple-200 text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'limited_monthly' ? 'Loading…' : '🥊 2 Classes Weekly — €60/month'}
            </button>
            <button onClick={handleDropIn} disabled={!!loading} className="w-full border border-zinc-700 hover:border-zinc-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'drop_in' ? 'Loading…' : ' Drop-In Class — €10'}
            </button>
          </div>
        )}

        {/* Free class booked — show notice + upgrade options */}
        {isActive && membership?.type === 'free_class' && (
          <div className="mt-3 space-y-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
              <p className="text-green-400 text-sm font-semibold"> Free class booked!</p>
              <p className="text-zinc-400 text-xs mt-1">We'll be in touch to confirm your session time. See you on the mats!</p>
            </div>
            <p className="text-zinc-500 text-xs pt-1">Ready to commit? Upgrade your membership:</p>
            <button onClick={() => handleMonthly('monthly')} disabled={!!loading} className="w-full bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'monthly' ? 'Loading…' : '⚡ Unlimited Monthly — €80/month'}
            </button>
            <button onClick={() => handleMonthly('limited_monthly')} disabled={!!loading} className="w-full border border-purple-700/50 hover:border-purple-500 text-purple-200 text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'limited_monthly' ? 'Loading…' : '🥊 2 Classes Weekly — €60/month'}
            </button>
            <button onClick={handleDropIn} disabled={!!loading} className="w-full border border-zinc-700 hover:border-zinc-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'drop_in' ? 'Loading…' : ' Drop-In Class — €10'}
            </button>
          </div>
        )}

        {/* Monthly membership expiring soon */}
        {isActive && membership?.type === 'monthly' && daysLeft <= 7 && (
          <button onClick={() => handleMonthly('monthly')} className="w-full mt-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
            Renew Monthly Membership
          </button>
        )}

        {isActive && membership?.type === 'limited_monthly' && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-3 mt-3">
            <p className="text-purple-300 text-sm font-semibold">2 classes per week</p>
            <p className="text-zinc-400 text-xs mt-1">This plan is for two regular classes per week.</p>
          </div>
        )}

        {isActive && membership?.type === 'limited_monthly' && daysLeft <= 7 && (
          <button onClick={() => handleMonthly('limited_monthly')} className="w-full mt-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
            Renew 2 Classes Weekly
          </button>
        )}

        {/* Expipurple membership — show all options again */}
        {isUpcoming && membership && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 mt-3">
            <p className="text-blue-300 text-sm font-semibold">Membership booked</p>
            <p className="text-zinc-400 text-xs mt-1">
              Starts on {startsAt.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
          </div>
        )}

        {!isActive && !isUpcoming && membership && (
          <div className="space-y-2 mt-3">
            <p className="text-zinc-500 text-xs mb-3">Your membership has expired. Rejoin below:</p>
            <button onClick={() => handleMonthly('monthly')} disabled={!!loading} className="w-full bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'monthly' ? 'Loading…' : '⚡ Unlimited Monthly — €80/month'}
            </button>
            <button onClick={() => handleMonthly('limited_monthly')} disabled={!!loading} className="w-full border border-purple-700/50 hover:border-purple-500 text-purple-200 text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'limited_monthly' ? 'Loading…' : '🥊 2 Classes Weekly — €60/month'}
            </button>
            <button onClick={handleDropIn} disabled={!!loading} className="w-full border border-zinc-700 hover:border-zinc-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading === 'drop_in' ? 'Loading…' : ' Drop-In Class — €10'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function ChecklistItem({ done, title, detail }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-3">
      <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
        done ? 'bg-green-500/15 text-green-400' : 'bg-zinc-800 text-zinc-500'
      }`}>
        {done ? (
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{detail}</p>
      </div>
    </div>
  );
}

function NextStepsCard({ user, membership }) {
  const [children, setChildren] = useState([]);

  const loadChildren = async () => {
    try {
      const res = await fetch('/api/auth/children', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (res.ok) setChildren(data.children || []);
    } catch {}
  };

  useEffect(() => {
    loadChildren();
    const handler = () => loadChildren();
    window.addEventListener('childrenUpdated', handler);
    return () => window.removeEventListener('childrenUpdated', handler);
  }, []);

  const activeMembership = membership?.status === 'active'
    && (!membership.starts_at || new Date(membership.starts_at) <= new Date())
    && (!membership.expires_at || new Date(membership.expires_at) > new Date());
  const childWaiversNeeded = children.filter(child => !Boolean(child.waiver_signed)).length;
  const isCoach = Boolean(user?.is_coach);

  return (
    <div className="card">
      <div className="mb-4">
        <p className="text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-1">Next Steps</p>
        <p className="text-white font-semibold">{isCoach ? 'Coach account' : 'You are nearly ready to train'}</p>
        <p className="text-zinc-500 text-xs mt-1">
          {isCoach ? 'Membership payment prompts are hidden for coach accounts.' : 'Save the details the club needs, then Training Club will confirm classes and payment directly.'}
        </p>
      </div>
      <div className="space-y-2">
        <ChecklistItem
          done={Boolean(user?.phone)}
          title="Contact details"
          detail={user?.phone ? 'Your phone number is saved.' : 'Add your phone number so the club can confirm your class.'}
        />
        <ChecklistItem
          done={Boolean(user?.waiver_signed)}
          title="Adult waiver"
          detail={user?.waiver_signed ? 'Your own participation waiver is signed.' : 'Sign your waiver before attending any adult class.'}
        />
        <ChecklistItem
          done={children.length === 0 || childWaiversNeeded === 0}
          title="Kids details"
          detail={
            children.length === 0
              ? 'Only needed if you are signing up a child.'
              : childWaiversNeeded === 0
                ? 'All child waivers are signed.'
                : `${childWaiversNeeded} child waiver${childWaiversNeeded !== 1 ? 's' : ''} still need${childWaiversNeeded === 1 ? 's' : ''} signing.`
          }
        />
        {!isCoach && (
          <ChecklistItem
            done={activeMembership}
            title="Membership arranged"
            detail={activeMembership ? 'Your membership is marked active by the club.' : 'Membership and payment are arranged directly with the club for now.'}
          />
        )}
      </div>
    </div>
  );
}

function OfflineMembershipCard({ membership }) {
  const startsAt = membership?.starts_at ? new Date(membership.starts_at) : null;
  const expiresAt = membership?.expires_at ? new Date(membership.expires_at) : null;
  const isUpcoming = membership?.status === 'active' && startsAt && startsAt > new Date();
  const isActive = membership?.status === 'active'
    && (!startsAt || startsAt <= new Date())
    && (!expiresAt || expiresAt > new Date());
  const membershipLabels = {
    monthly: 'Unlimited monthly',
    limited_monthly: '2 classes weekly',
    drop_in: 'Drop-in',
    free_class: 'Free trial',
  };

  return (
    <div className="card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-1">Membership</p>
          <MembershipBadge membership={membership} />
        </div>
        {(isActive || isUpcoming) && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 sm:text-right">
            <p className="text-green-300 text-sm font-semibold">
              {membershipLabels[membership.type] || 'Membership'} {isUpcoming ? 'booked' : 'active'}
            </p>
            {expiresAt && (
              <p className="text-zinc-500 text-xs mt-0.5">
                {isUpcoming ? 'Starts' : 'Valid until'} {isUpcoming ? startsAt.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : expiresAt.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-white text-sm font-semibold">Arrange membership with the club</p>
        <p className="text-zinc-500 text-xs leading-relaxed mt-1">
          Online payments are not switched on yet. The club will confirm your first class, membership option, and payment method directly.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a href="mailto:hello@trainingclub.example?subject=Membership enquiry" className="btn-primary text-center text-sm py-2.5">
            Email The Club
          </a>
          <a href="/schedule" className="btn-secondary text-center text-sm py-2.5">
            View Schedule
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 px-3 py-2">
          <p className="text-zinc-300 font-semibold">Free trial</p>
          <p className="text-zinc-500 mt-0.5">Ask the club to confirm a first session.</p>
        </div>
        <div className="rounded-lg border border-zinc-800 px-3 py-2">
          <p className="text-zinc-300 font-semibold">Drop-in / monthly</p>
          <p className="text-zinc-500 mt-0.5">Paid directly to the club for now.</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, membership, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [successMsg, setSuccessMsg] = useState('');
  const [cancelMsg, setCancelMsg] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const cancelled = searchParams.get('cancelled');

    if (cancelled) {
      setCancelMsg('No changes were made. The club can arrange membership with you directly.');
      setSearchParams({});
      return;
    }

    if (success) {
      const label = success === 'monthly' ? 'Unlimited Monthly Membership' : success === 'limited_monthly' ? '2 Classes Weekly Membership' : success === 'drop_in' ? 'Drop-In Class' : 'Free Trial';
      setSuccessMsg(`${label} saved. The club will confirm the next step with you.`);
      setSearchParams({});

      // Confirm payment with backend if we have a session_id
      if (sessionId && success !== 'free_class') {
        fetch('/api/stripe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ session_id: sessionId, type: success }),
        }).then(() => refreshUser());
      } else {
        refreshUser();
      }
    }
  }, []);

  const handleEditToggle = () => {
    setEditMode(!editMode);
    setForm({
      full_name: user.full_name,
      phone: user.phone || '',
      address: user.address || '',
      emergency_contact_name: user.emergency_contact_name || '',
      emergency_contact_relationship: user.emergency_contact_relationship || '',
      emergency_contact_phone: user.emergency_contact_phone || '',
      medical_notes: user.medical_notes || '',
    });
    setSaveMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await refreshUser();
        setEditMode(false);
        setSaveMsg('Thanks, your profile details are saved.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-zinc-500 text-sm">Welcome back,</p>
          <h1 className="text-3xl font-black text-white">{user?.full_name?.split(' ')[0]}</h1>
          <p className="text-zinc-500 text-sm mt-1">{user?.email}</p>
        </div>

        <div className="space-y-4">
          {/* Success / Cancel banners */}
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm font-medium">
              {successMsg}
            </div>
          )}
          {cancelMsg && (
            <div className="bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl px-4 py-3 text-sm">
              {cancelMsg}
            </div>
          )}

          <NextStepsCard user={user} membership={membership} />

          {/* Waiver */}
          <WaiverCard user={user} onSigned={refreshUser} />

          {/* Kids */}
          <ChildProfilesCard />

          {/* Membership */}
          {user?.is_coach ? (
            <div className="card">
              <p className="text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-1">Coach Account</p>
              <p className="text-white font-semibold">Membership is not required</p>
              <p className="text-zinc-500 text-sm mt-1">Your account is marked as a coach account by the club admin.</p>
            </div>
          ) : (
            <OfflineMembershipCard membership={membership} />
          )}

          {/* Profile */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Your Profile</p>
              {!editMode ? (
                <button onClick={handleEditToggle} className="text-zinc-400 hover:text-white text-xs font-medium transition-colors">
                  Edit
                </button>
              ) : (
                <button onClick={() => setEditMode(false)} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                  Cancel
                </button>
              )}
            </div>

            {saveMsg && <p className="text-green-400 text-xs mb-3">{saveMsg}</p>}

            {!editMode ? (
              <dl className="space-y-2.5">
                {[
                  ['Full Name', user?.full_name],
                  ['Email', user?.email],
                  ['Phone', user?.phone || '—'],
                  ['Experience', user?.experience_level ? user.experience_level.charAt(0).toUpperCase() + user.experience_level.slice(1) : '—'],
                  ['Address', user?.address || '—'],
                  ['Emergency Contact', user?.emergency_contact_name ? `${user.emergency_contact_name} (${user.emergency_contact_relationship || 'Contact'}) · ${user.emergency_contact_phone || '—'}` : '—'],
                  ['Medical Notes', user?.medical_notes || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-zinc-500 text-sm flex-shrink-0">{label}</dt>
                    <dd className="text-zinc-300 text-sm text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <form onSubmit={handleSave} className="space-y-3">
                {[
                  ['Full Name', 'full_name', 'text'],
                  ['Phone', 'phone', 'tel'],
                  ['Address', 'address', 'text'],
                  ['Emergency Contact Name', 'emergency_contact_name', 'text'],
                  ['Emergency Relationship', 'emergency_contact_relationship', 'text'],
                  ['Emergency Phone', 'emergency_contact_phone', 'tel'],
                ].map(([label, name, type]) => (
                  <div key={name}>
                    <label className="label text-xs">{label}</label>
                    <input
                      type={type}
                      className="input py-2 text-sm"
                      value={form[name] || ''}
                      onChange={e => setForm({ ...form, [name]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <label className="label text-xs">Medical Notes</label>
                  <textarea
                    className="input text-sm resize-none min-h-[60px]"
                    value={form.medical_notes || ''}
                    onChange={e => setForm({ ...form, medical_notes: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>

          {/* Discounts */}
          <DiscountsCard />

          {/* Schedule teaser */}
          <div className="card border-zinc-700/50 bg-zinc-900/50 text-center py-8">
            <p className="text-2xl mb-2">🗓</p>
            <p className="text-white font-semibold text-sm mb-1">Class Schedule</p>
            <p className="text-zinc-500 text-xs">Mon–Fri evenings · 123 Main Street, Your Town</p>
            <a href="mailto:hello@trainingclub.example" className="inline-block mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
              Email us for exact times →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
