import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub, color = 'purple', onClick, active }) {
  const colors = { purple: 'text-purple-400', green: 'text-green-400', blue: 'text-blue-400', yellow: 'text-yellow-400' };
  return (
    <button
      onClick={onClick}
      className={`card text-center w-full transition-all ${onClick ? 'cursor-pointer hover:border-zinc-500' : ''} ${active ? 'border-purple-600 bg-purple-600/5' : ''}`}
    >
      <p className={`text-3xl font-black ${colors[color]}`}>{value}</p>
      <p className="text-white font-semibold text-sm mt-1">{label}</p>
      {sub && <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>}
      {active && <p className="text-purple-400 text-xs mt-1">● filtepurple</p>}
    </button>
  );
}

function waiverStatus(waiver_signed, waiver_signed_at) {
  if (!waiver_signed) return 'unsigned';
  const signed = new Date(waiver_signed_at);
  const monthsAgo = (Date.now() - signed) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo >= 12) return 'expired';
  if (monthsAgo >= 11) return 'expiring';
  return 'ok';
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

function MemberRow({ member, onClick }) {
  const isActive = member.membership_status === 'active'
    && (!member.starts_at || new Date(member.starts_at) <= new Date())
    && (!member.expires_at || new Date(member.expires_at) > new Date());
  const membershipLabel = member.membership_type
    ? { monthly: 'Unlimited', limited_monthly: '2 Classes', drop_in: 'Drop-In', free_class: 'Free Trial' }[member.membership_type] || member.membership_type
    : '—';
  const waiver = waiverStatus(member.waiver_signed, member.waiver_signed_at);

  return (
    <tr onClick={onClick} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors cursor-pointer">
      <td className="px-4 py-3">
        <div>
          <p className="text-white text-sm font-medium">{member.full_name}</p>
          <p className="text-zinc-500 text-xs">{member.email}</p>
          {member.child_count > 0 && (
            <p className="text-purple-300 text-xs mt-0.5">
              {member.child_count} child profile{member.child_count !== 1 ? 's' : ''}
              {member.unsigned_child_waivers > 0 ? ` · ${member.unsigned_child_waivers} waiver${member.unsigned_child_waivers !== 1 ? 's' : ''} needed` : ''}
              {member.child_medical_notes_count > 0 ? ` · ${member.child_medical_notes_count} medical note${member.child_medical_notes_count !== 1 ? 's' : ''}` : ''}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell text-zinc-400 text-xs">
        {member.phone || '—'}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          isActive ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-zinc-600'}`} />
          {isActive ? membershipLabel : (member.membership_type ? 'Expipurple' : 'None')}
        </span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          waiver === 'ok'       ? 'bg-green-500/10 text-green-400' :
          waiver === 'expiring' ? 'bg-orange-500/10 text-orange-400' :
          waiver === 'expired'  ? 'bg-purple-500/10 text-purple-400' :
                                  'bg-zinc-800 text-zinc-400'
        }`}>
          {waiver === 'ok'       ? '✓ Signed' :
           waiver === 'expiring' ? '⚠ Expiring' :
           waiver === 'expired'  ? '✕ Expipurple' :
                                   'Pending'}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-zinc-500 text-xs">
        {member.experience_level ? member.experience_level.charAt(0).toUpperCase() + member.experience_level.slice(1) : '—'}
      </td>
      <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
        {new Date(member.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
    </tr>
  );
}

function MemberModal({ memberId, token, onClose, onDeleted, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [manualType, setManualType] = useState('monthly');
  const [manualAmount, setManualAmount] = useState('80');
  const [manualNote, setManualNote] = useState('');
  const [manualStatus, setManualStatus] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [trialStatus, setTrialStatus] = useState('');
  const [trialLoading, setTrialLoading] = useState(false);
  const [coachStatus, setCoachStatus] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  const loadMember = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/members/${memberId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId, token]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const handleManualType = (type) => {
    setManualType(type);
    setManualAmount(type === 'monthly' ? '80' : type === 'limited_monthly' ? '60' : '15');
    setManualStatus('');
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    setManualStatus('');
    try {
      const res = await fetch(`/api/admin/members/${memberId}/manual-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: manualType, amount_paid: manualAmount, note: manualNote }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setManualStatus(body.error || 'Could not record payment');
        return;
      }
      setManualStatus('Payment recorded');
      setManualNote('');
      await loadMember();
      onChanged();
    } catch {
      setManualStatus('Network error');
    } finally {
      setManualLoading(false);
    }
  };

  const handleTrialUsed = async () => {
    setTrialLoading(true);
    setTrialStatus('');
    try {
      const res = await fetch(`/api/admin/members/${memberId}/free-trial-used`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTrialStatus(body.error || 'Could not mark trial as used');
        return;
      }
      setTrialStatus('Free trial marked as used');
      await loadMember();
      onChanged();
    } catch {
      setTrialStatus('Network error');
    } finally {
      setTrialLoading(false);
    }
  };

  const handleCoachToggle = async () => {
    setCoachLoading(true);
    setCoachStatus('');
    try {
      const nextValue = !Boolean(data?.user?.is_coach);
      const res = await fetch(`/api/admin/members/${memberId}/coach`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_coach: nextValue }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCoachStatus(body.error || 'Could not update coach status');
        return;
      }
      setCoachStatus(nextValue ? 'Coach status enabled' : 'Coach status removed');
      await loadMember();
      onChanged();
    } catch {
      setCoachStatus('Network error');
    } finally {
      setCoachLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onDeleted(memberId);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  };

  const membershipLabels = { monthly: 'Unlimited Monthly Membership', limited_monthly: '2 Classes Weekly Membership', drop_in: 'Drop-In Class', free_class: 'Free Trial' };
  const activeFreeTrial = data?.memberships?.find(m => {
    if (m.type !== 'free_class' || m.status !== 'active') return false;
    return !m.expires_at || new Date(m.expires_at) > new Date();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">Member Profile</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-zinc-500 text-sm">Loading…</div>
        ) : !data ? (
          <div className="px-6 py-12 text-center text-zinc-500 text-sm">Failed to load member.</div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Name + status */}
            <div>
              <p className="text-white font-black text-xl">{data.user.full_name}</p>
              <p className="text-zinc-400 text-sm mt-0.5">{data.user.email}</p>
            </div>

            {/* Personal */}
            <Section title="Personal Details">
              <Row label="Phone" value={data.user.phone} />
              <Row label="Date of Birth" value={data.user.date_of_birth ? new Date(data.user.date_of_birth).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <Row label="Experience" value={data.user.experience_level ? data.user.experience_level.charAt(0).toUpperCase() + data.user.experience_level.slice(1) : null} />
              <Row label="Address" value={data.user.address} />
              <Row label="Joined" value={new Date(data.user.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <Row
                label="Waiver"
                value={(() => {
                  const ws = waiverStatus(data.user.waiver_signed, data.user.waiver_signed_at);
                  if (ws === 'ok') return `Signed ${new Date(data.user.waiver_signed_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                  if (ws === 'expiring') return `Expiring soon - signed ${new Date(data.user.waiver_signed_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                  if (ws === 'expired') return `Expired - signed ${new Date(data.user.waiver_signed_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                  return 'Not signed';
                })()}
                highlight={waiverStatus(data.user.waiver_signed, data.user.waiver_signed_at) !== 'ok'}
              />
            </Section>

            {/* Emergency */}
            {(data.user.emergency_contact_name || data.user.emergency_contact_phone) && (
              <Section title="Emergency Contact">
                <Row label="Name" value={data.user.emergency_contact_name} />
                <Row label="Relationship" value={data.user.emergency_contact_relationship} />
                <Row label="Phone" value={data.user.emergency_contact_phone} />
              </Section>
            )}

            {/* Medical */}
            {data.user.medical_notes && (
              <Section title="Medical Notes">
                <p className="text-zinc-300 text-sm leading-relaxed">{data.user.medical_notes}</p>
              </Section>
            )}

            <Section title="Child Profiles">
              {!data.children || data.children.length === 0 ? (
                <p className="text-zinc-500 text-sm">No child profiles added.</p>
              ) : data.children.map(child => {
                const age = ageFromDob(child.date_of_birth);
                const waiver = waiverStatus(child.waiver_signed, child.waiver_signed_at);
                return (
                  <div key={child.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 mb-2 last:mb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-zinc-200 text-sm font-semibold">{child.first_name} {child.last_name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {age !== null ? `${age} years old` : 'Age not added'} · {child.experience_level || 'beginner'}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        waiver === 'ok' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {waiver === 'ok' ? 'Waiver signed' : 'Waiver needed'}
                      </span>
                    </div>
                    {child.preferred_classes && <Row label="Classes" value={child.preferred_classes} />}
                    {child.medical_notes && <Row label="Medical" value={child.medical_notes} highlight />}
                    {Boolean(child.waiver_signed) && (
                      <Row
                        label="Waiver"
                        value={`Signed by ${child.waiver_signed_by || 'guardian'} on ${new Date(child.waiver_signed_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      />
                    )}
                  </div>
                );
              })}
            </Section>

            <Section title="Coach Status">
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-zinc-200 text-sm font-semibold">
                      {data.user.is_coach ? 'Coach account' : 'Member account'}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Coach accounts do not need membership payment prompts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCoachToggle}
                    disabled={coachLoading}
                    className="text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-50"
                  >
                    {coachLoading ? 'Saving...' : data.user.is_coach ? 'Unmark Coach' : 'Mark Coach'}
                  </button>
                </div>
                {coachStatus && <p className={`text-xs ${coachStatus.includes('enabled') || coachStatus.includes('removed') ? 'text-green-400' : 'text-purple-400'}`}>{coachStatus}</p>}
              </div>
            </Section>

            {/* Memberships */}
            <Section title="Membership History">
              {data.memberships.length === 0 ? (
                <p className="text-zinc-500 text-sm">No memberships yet.</p>
              ) : data.memberships.map((m, i) => {
                const isActive = m.status === 'active' && (!m.starts_at || new Date(m.starts_at) <= new Date()) && (!m.expires_at || new Date(m.expires_at) > new Date());
                const isUpcoming = m.status === 'active' && m.starts_at && new Date(m.starts_at) > new Date();
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="text-zinc-300 text-sm font-medium">{membershipLabels[m.type] || m.type}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">
                        {new Date(m.starts_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {m.expires_at && ` → ${new Date(m.expires_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-green-500/10 text-green-400' : isUpcoming ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {isActive ? 'Active' : isUpcoming ? 'Upcoming' : m.status}
                    </span>
                  </div>
                );
              })}
            </Section>

            {activeFreeTrial && (
              <Section title="Free Trial">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-3">
                  <div>
                    <p className="text-blue-300 text-sm font-semibold">Free trial is active</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Mark it as used once they have attended their trial class.</p>
                  </div>
                  {trialStatus && (
                    <p className={`text-xs ${trialStatus === 'Free trial marked as used' ? 'text-green-400' : 'text-purple-400'}`}>{trialStatus}</p>
                  )}
                  <button
                    onClick={handleTrialUsed}
                    disabled={trialLoading}
                    className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {trialLoading ? 'Saving...' : 'Mark Free Trial As Used'}
                  </button>
                </div>
              </Section>
            )}

            <Section title="Manual Payment">
              <form onSubmit={handleManualPayment} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualType('monthly')}
                    className={`text-xs font-semibold py-2 rounded-lg border transition-colors ${manualType === 'monthly' ? 'bg-purple-700 border-purple-600 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
                  >
                    Unlimited
                  </button>
                  <button
                    type="button"
                    onClick={() => handleManualType('limited_monthly')}
                    className={`text-xs font-semibold py-2 rounded-lg border transition-colors ${manualType === 'limited_monthly' ? 'bg-purple-700 border-purple-600 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
                  >
                    2 Classes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleManualType('drop_in')}
                    className={`text-xs font-semibold py-2 rounded-lg border transition-colors ${manualType === 'drop_in' ? 'bg-purple-700 border-purple-600 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
                  >
                    Drop-In
                  </button>
                </div>
                <div className="grid grid-cols-[110px_1fr] gap-2">
                  <div>
                    <label className="text-zinc-500 text-xs font-medium">Amount</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={manualAmount}
                        onChange={e => setManualAmount(e.target.value)}
                        className="input py-2 pl-7 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-xs font-medium">Note</label>
                    <input
                      type="text"
                      value={manualNote}
                      onChange={e => setManualNote(e.target.value)}
                      placeholder="Cash, Revolut, bank transfer..."
                      className="input py-2 text-sm mt-1"
                    />
                  </div>
                </div>
                {manualStatus && (
                  <p className={`text-xs ${manualStatus === 'Payment recorded' ? 'text-green-400' : 'text-purple-400'}`}>{manualStatus}</p>
                )}
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {manualLoading ? 'Recording...' : 'Mark As Paid'}
                </button>
                <p className="text-zinc-600 text-xs">
                  Monthly payments are valid until the end of this calendar month.
                </p>
              </form>
            </Section>

            <a
              href={`mailto:${data.user.email}`}
              className="block w-full text-center btn-secondary py-2.5 text-sm"
            >
              Email {data.user.full_name.split(' ')[0]}
            </a>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-center text-purple-500 hover:text-purple-400 text-sm py-2 transition-colors"
              >
                Delete member account
              </button>
            ) : (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-3 space-y-3">
                <p className="text-purple-300 text-sm font-medium text-center">
                  Delete {data.user.full_name}? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 border border-zinc-600 text-zinc-300 hover:text-white text-sm py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-zinc-600 w-28 flex-shrink-0">{label}</span>
      <span className={highlight ? 'text-orange-400' : 'text-zinc-300'}>{value}</span>
    </div>
  );
}

function ContactMessages({ token }) {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/contact-messages', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => {});
  }, [token]);

  const markRead = (id) => {
    fetch(`/api/admin/contact-messages/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: 1 } : m));
  };

  const unread = messages.filter(m => !m.read).length;
  if (messages.length === 0) return null;

  return (
    <div className="card p-0 overflow-hidden mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Contact Messages</span>
          {unread > 0 && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} new</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-zinc-800 border-t border-zinc-800">
          {messages.map(m => (
            <div key={m.id} className={`px-4 py-3 ${m.read ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white text-sm font-medium">{m.name}</p>
                    {!m.read && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />}
                  </div>
                  <a href={`mailto:${m.email}`} className="text-purple-400 hover:text-purple-300 text-xs transition-colors">{m.email}</a>
                  <p className="text-zinc-300 text-sm mt-2 leading-relaxed">{m.message}</p>
                  <p className="text-zinc-600 text-xs mt-1.5">{new Date(m.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <a href={`mailto:${m.email}?subject=Re: Your message to Training Club`} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-700/20 transition-colors whitespace-nowrap">
                    Reply
                  </a>
                  {!m.read && (
                    <button onClick={() => markRead(m.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors whitespace-nowrap">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCenter({ token, onOpenMember }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(true);
  const [view, setView] = useState('active');

  const loadNotifications = useCallback(() => {
    fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setNotifications(d.notifications || []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unread = notifications.filter(n => !n.read).length;
  const archived = notifications.filter(n => n.read).length;
  const visible = notifications
    .filter(n => view === 'archive' ? n.read : !n.read)
    .slice(0, view === 'archive' ? 20 : 8);

  const markRead = (id) => {
    fetch(`/api/admin/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
  };

  const markAllRead = () => {
    fetch('/api/admin/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
  };

  const typeStyles = {
    new_signup: 'bg-purple-500/10 text-purple-300',
    waiver_signed: 'bg-green-500/10 text-green-300',
    free_class: 'bg-blue-500/10 text-blue-300',
    drop_in: 'bg-orange-500/10 text-orange-300',
    monthly: 'bg-green-500/10 text-green-300',
    renewal: 'bg-yellow-500/10 text-yellow-300',
    contact: 'bg-zinc-700 text-zinc-300',
    waiting_list: 'bg-purple-500/10 text-purple-300',
    child_profile: 'bg-blue-500/10 text-blue-300',
    settings: 'bg-zinc-700 text-zinc-300',
  };

  return (
    <div className="card p-0 overflow-hidden mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Website Activity</span>
          {unread > 0 && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} new</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-zinc-800">
          <div className="flex gap-2 px-4 py-3 border-b border-zinc-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setView('active')}
              className={`text-xs font-semibold rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors ${view === 'active' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Active {unread > 0 ? `(${unread})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setView('archive')}
              className={`text-xs font-semibold rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors ${view === 'archive' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              Archive {archived > 0 ? `(${archived})` : ''}
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-5 text-zinc-500 text-sm">No website activity yet.</div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-5 text-zinc-500 text-sm">
              {view === 'archive' ? 'No archived notifications yet.' : 'No active notifications.'}
            </div>
          ) : (
            <>
              <div className="divide-y divide-zinc-800">
                {visible.map(n => (
                  <div key={n.id} className={`px-4 py-3 ${n.read ? 'opacity-55' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${typeStyles[n.type] || 'bg-zinc-800 text-zinc-300'}`}>
                            {n.type.replace('_', ' ')}
                          </span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />}
                        </div>
                        <p className="text-white text-sm font-semibold">{n.title}</p>
                        <p className="text-zinc-400 text-sm mt-0.5">{n.body}</p>
                        <p className="text-zinc-600 text-xs mt-1.5">{new Date(n.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {n.member_id && (
                          <button
                            onClick={() => {
                              markRead(n.id);
                              onOpenMember(n.member_id);
                            }}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-700/20 transition-colors whitespace-nowrap"
                          >
                            View member
                          </button>
                        )}
                        {!n.read && (
                          <button onClick={() => markRead(n.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors whitespace-nowrap">
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {view === 'active' && unread > 0 && (
                <div className="px-4 py-3 border-t border-zinc-800">
                  <button onClick={markAllRead} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                    Mark all active as read
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ClubCapacityControl({ token }) {
  const [acceptingMembers, setAcceptingMembers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`Settings: ${r.status}`)))
      .then(data => setAcceptingMembers(data.acceptingMembers !== false))
      .catch(() => setError('Could not load club capacity setting.'))
      .finally(() => setLoading(false));
  }, [token]);

  const toggle = async () => {
    setSaving(true);
    setError('');
    const next = !acceptingMembers;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ acceptingMembers: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update setting.');
      setAcceptingMembers(data.acceptingMembers);
    } catch (err) {
      setError(err.message || 'Could not update setting.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="card mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-white font-semibold text-sm">Membership Applications</p>
          <p className="text-zinc-500 text-sm mt-1">
            {acceptingMembers
              ? 'The public site is accepting new member sign-ups.'
              : 'The public site is full and sends new people to the waiting list.'}
          </p>
          {error && <p className="text-purple-300 text-xs mt-2">{error}</p>}
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={saving}
          className={`flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
            acceptingMembers
              ? 'bg-green-600/15 text-green-300 border border-green-500/30 hover:bg-green-600/25'
              : 'bg-purple-700 text-white hover:bg-purple-800'
          }`}
        >
          {saving ? 'Saving...' : acceptingMembers ? 'Set Club Full' : 'Reopen Sign-Ups'}
        </button>
      </div>
    </div>
  );
}

function WaitingListPanel({ token }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadEntries = useCallback(() => {
    fetch('/api/admin/waiting-list', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`Waiting list: ${r.status}`)))
      .then(data => setEntries(data.entries || []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/waiting-list/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Could not update waiting list.');
      if (status === 'removed') {
        setEntries(prev => prev.filter(entry => entry.id !== id));
      } else {
        setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, status } : entry));
      }
    } catch {
      loadEntries();
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = entries.filter(entry => ['waiting', 'contacted', 'invited'].includes(entry.status)).length;
  const statusStyles = {
    waiting: 'bg-purple-500/10 text-purple-300',
    contacted: 'bg-blue-500/10 text-blue-300',
    invited: 'bg-yellow-500/10 text-yellow-300',
    joined: 'bg-green-500/10 text-green-300',
  };

  return (
    <div className="card p-0 overflow-hidden mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Waiting List</span>
          {activeCount > 0 && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeCount} active</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-zinc-800">
          {entries.length === 0 ? (
            <div className="px-4 py-5 text-zinc-500 text-sm">No waiting list entries yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {entries.map(entry => (
                <div key={entry.id} className="px-4 py-3">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-white text-sm font-semibold">{entry.name}</p>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusStyles[entry.status] || 'bg-zinc-800 text-zinc-300'}`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <a href={`mailto:${entry.email}`} className="text-purple-400 hover:text-purple-300 transition-colors">{entry.email}</a>
                        <a href={`tel:${entry.phone}`} className="text-zinc-400 hover:text-white transition-colors">{entry.phone}</a>
                      </div>
                      <p className="text-zinc-500 text-xs mt-1">
                        {entry.experience_level || 'beginner'}{entry.preferred_classes ? ` · ${entry.preferred_classes}` : ''}
                      </p>
                      {entry.notes && <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{entry.notes}</p>}
                      <p className="text-zinc-600 text-xs mt-1.5">
                        Joined {new Date(entry.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {['contacted', 'invited', 'joined'].map(status => (
                        <button
                          key={status}
                          type="button"
                          disabled={updatingId === entry.id || entry.status === status}
                          onClick={() => updateStatus(entry.id, status)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-40 transition-colors capitalize"
                        >
                          {status}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={updatingId === entry.id}
                        onClick={() => updateStatus(entry.id, 'removed')}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-700/50 text-purple-300 hover:bg-purple-500/10 disabled:opacity-40 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const refreshData = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    Promise.all([
      fetch('/api/admin/stats', { headers }).then(r => {
        if (!r.ok) throw new Error(`Stats: ${r.status}`);
        return r.json();
      }),
      fetch('/api/admin/members', { headers }).then(r => {
        if (!r.ok) throw new Error(`Members: ${r.status}`);
        return r.json();
      }),
    ])
      .then(([statsData, membersData]) => {
        setStats(statsData);
        setMembers(membersData.members || []);
      })
      .catch(err => setError(`Failed to load data (${err.message}) — try logging out and back in`))
      .finally(() => {
        if (showLoading) setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const isActiveMember = (m) => m.membership_status === 'active'
    && (!m.starts_at || new Date(m.starts_at) <= new Date())
    && (!m.expires_at || new Date(m.expires_at) > new Date());

  const filtepurple = members.filter(m => {
    const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    if (filter === 'active') return matchSearch && isActiveMember(m);
    if (filter === 'active_monthly') return matchSearch && isActiveMember(m) && ['monthly', 'limited_monthly'].includes(m.membership_type);
    if (filter === 'inactive_membership') return matchSearch && !isActiveMember(m);
    if (filter === 'waiver_signed') return matchSearch && m.waiver_signed;
    if (filter === 'recent') return matchSearch && (Date.now() - new Date(m.created_at)) < 30 * 24 * 60 * 60 * 1000;
    if (filter === 'no_waiver') return matchSearch && !m.waiver_signed;
    if (filter === 'waiver_expiring') return matchSearch && ['expiring', 'expired'].includes(waiverStatus(m.waiver_signed, m.waiver_signed_at));
    if (filter === 'no_membership') return matchSearch && !m.membership_type;
    if (filter === 'kids_attention') return matchSearch && (m.unsigned_child_waivers > 0 || m.child_medical_notes_count > 0);
    return matchSearch;
  });

  const closeModal = useCallback(() => setSelectedMemberId(null), []);
  const handleDeleted = useCallback((id) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setStats(prev => prev ? { ...prev, totalMembers: prev.totalMembers - 1 } : prev);
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-zinc-400 text-sm">Loading…</div>
    </div>
  );

  return (
    <div className="pt-20 pb-16 px-4">
      {selectedMemberId && (
        <MemberModal memberId={selectedMemberId} token={token} onClose={closeModal} onDeleted={handleDeleted} onChanged={() => refreshData(false)} />
      )}
      <div className="max-w-5xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-zinc-500 text-sm">Admin Panel</p>
            <h1 className="text-3xl font-black text-white">Training Club <span className="text-purple-400">Admin</span></h1>
          </div>
          <p className="hidden sm:block text-xs text-zinc-500 text-right max-w-[190px]">
            New website actions show here automatically.
          </p>
        </div>

        <div className="mb-6">
          <Link to="/admin/sign-in" className="inline-flex items-center justify-center rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
            Open Class Sign-In
          </Link>
        </div>

        {error && (
          <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatCard label="Total Members" value={stats.totalMembers} color="purple"
              onClick={() => setFilter('all')}
              active={filter === 'all'} />
            <StatCard label="Monthly Active" value={stats.activeMonthly} sub="all plans" color="green"
              onClick={() => setFilter(filter === 'active_monthly' ? 'all' : 'active_monthly')}
              active={filter === 'active_monthly'} />
            <StatCard label="Inactive Memberships" value={stats.inactiveMemberships} color="blue"
              onClick={() => setFilter(filter === 'inactive_membership' ? 'all' : 'inactive_membership')}
              active={filter === 'inactive_membership'} />
            <StatCard label="Waivers Signed" value={stats.waiverSigned} color="yellow"
              onClick={() => setFilter(filter === 'waiver_signed' ? 'all' : 'waiver_signed')}
              active={filter === 'waiver_signed'} />
            <StatCard label="New (30 days)" value={stats.recentSignups} sub="signups" color="purple"
              onClick={() => setFilter(filter === 'recent' ? 'all' : 'recent')}
              active={filter === 'recent'} />
            <StatCard label="Kids" value={stats.childProfiles || 0} sub="profiles" color="blue" />
          </div>
        )}

        <ClubCapacityControl token={token} />

        <WaitingListPanel token={token} />

        {/* Website activity */}
        <NotificationCenter token={token} onOpenMember={setSelectedMemberId} />

        {/* Contact messages */}
        <ContactMessages token={token} />

        {/* Members table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-zinc-800 space-y-3">
            <input
              type="text"
              placeholder="Search members…"
              className="input py-2 text-sm w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
              {[['all', 'All'], ['active', 'Active'], ['no_waiver', 'No Waiver'], ['kids_attention', 'Kids Attention'], ['waiver_expiring', 'Expiring Waivers'], ['no_membership', 'No Membership']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    filter === val ? 'bg-purple-700 border-purple-600 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Membership</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Waiver</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtepurple.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 text-sm">
                      {search ? 'No members match your search.' : 'No members yet.'}
                    </td>
                  </tr>
                ) : (
                  filtepurple.map(member => (
                    <MemberRow key={member.id} member={member} onClick={() => setSelectedMemberId(member.id)} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-zinc-800">
            <p className="text-zinc-600 text-xs">{filtepurple.length} member{filtepurple.length !== 1 ? 's' : ''} shown</p>
          </div>
        </div>

        {/* Admin tip */}
        <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500">
          <span className="text-zinc-400 font-semibold">Admin tip:</span> Set these environment variables before first deploy to create the admin account automatically:{' '}
          <code className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
            ADMIN_EMAIL
          </code>
          {' '}and{' '}
          <code className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">ADMIN_PASSWORD</code>.
        </div>
      </div>
    </div>
  );
}
