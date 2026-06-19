import { useEffect, useMemo, useState } from 'react';

const membershipLabels = {
  monthly: 'Unlimited',
  limited_monthly: '2 Classes',
  drop_in: 'Drop-In',
  free_class: 'Free Trial',
};

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminSignIn() {
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [classDay, setClassDay] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState(null);
  const [confirmMember, setConfirmMember] = useState(null);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ date: '', member: '', class: '' });

  const loadToday = async () => {
    const res = await fetch('/api/admin/attendance/today', { headers });
    const data = await res.json();
    setClassDay(data.classDay);
    setMembers(data.members || []);
  };

  const loadAttendance = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const url = `/api/admin/attendance${params.toString() ? `?${params}` : ''}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    setAttendance(data.attendance || []);
  };

  useEffect(() => {
    Promise.all([loadToday(), loadAttendance()])
      .catch(() => setMessage('Failed to load attendance data. Try logging out and back in.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAttendance().catch(() => {});
  }, [filters]);

  const confirmSignIn = async () => {
    if (!confirmMember) return;
    setSigningId(confirmMember.id);
    setMessage('');
    try {
      const res = await fetch('/api/admin/attendance/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ member_id: confirmMember.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || 'Could not record attendance.');
      } else {
        setMessage(`${confirmMember.full_name} signed in for ${data.attendance.class_name}.`);
      }
      setConfirmMember(null);
      await Promise.all([loadToday(), loadAttendance()]);
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setSigningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading class sign-in...</p>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto pt-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-zinc-500 text-sm">Admin</p>
            <h1 className="text-3xl font-black text-white">Class <span className="text-purple-400">Sign-In</span></h1>
          </div>
          {classDay && (
            <div className="sm:text-right">
              <p className="text-zinc-500 text-xs">Today</p>
              <p className="text-white text-sm font-semibold">{classDay.className}</p>
              <p className="text-zinc-500 text-xs">{classDay.classDate}</p>
            </div>
          )}
        </div>

        {message && (
          <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm rounded-lg px-4 py-3 mb-6">
            {message}
          </div>
        )}

        {!classDay?.hasClass && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-lg px-4 py-3 mb-6">
            There is no scheduled class today, so sign-ins are disabled.
          </div>
        )}

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-white font-semibold text-sm">Active Members</p>
              <p className="text-zinc-500 text-xs mt-0.5">{members.length} currently active</p>
            </div>

            <div className="divide-y divide-zinc-800">
              {members.length === 0 ? (
                <div className="px-4 py-10 text-zinc-500 text-sm text-center">No active members found.</div>
              ) : members.map(member => {
                const signedIn = Boolean(member.attendance_id);
                return (
                  <div key={member.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{member.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${signedIn ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          {signedIn ? 'Attended' : 'Not signed in'}
                        </span>
                        <span className="text-zinc-600 text-xs">{membershipLabels[member.membership_type] || member.membership_type}</span>
                      </div>
                      {signedIn && (
                        <p className="text-zinc-600 text-xs mt-1">Signed in {formatDateTime(member.signed_in_at)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmMember(member)}
                      disabled={signedIn || !classDay?.hasClass || signingId === member.id}
                      className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                        signedIn
                          ? 'bg-zinc-800 text-zinc-500'
                          : 'bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white'
                      }`}
                    >
                      {signedIn ? 'Already In' : signingId === member.id ? 'Saving...' : 'Sign In'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-white font-semibold text-sm">Attendance History</p>
              <p className="text-zinc-500 text-xs mt-0.5">Filter by date, member, or class</p>
            </div>

            <div className="px-4 py-3 border-b border-zinc-800 space-y-2">
              <input
                type="date"
                className="input py-2 text-sm"
                value={filters.date}
                onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Member name"
                className="input py-2 text-sm"
                value={filters.member}
                onChange={e => setFilters(prev => ({ ...prev, member: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Class name or date"
                className="input py-2 text-sm"
                value={filters.class}
                onChange={e => setFilters(prev => ({ ...prev, class: e.target.value }))}
              />
              {(filters.date || filters.member || filters.class) && (
                <button
                  onClick={() => setFilters({ date: '', member: '', class: '' })}
                  className="text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="divide-y divide-zinc-800 max-h-[520px] overflow-y-auto">
              {attendance.length === 0 ? (
                <div className="px-4 py-10 text-zinc-500 text-sm text-center">No attendance records found.</div>
              ) : attendance.map(row => (
                <div key={row.id} className="px-4 py-3">
                  <p className="text-white text-sm font-semibold">{row.member_name}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{row.class_name} · {row.class_date}</p>
                  <p className="text-zinc-600 text-xs mt-1">{formatDateTime(row.signed_in_at)}</p>
                  {row.admin_email && (
                    <p className="text-zinc-700 text-xs mt-0.5">Recorded by {row.admin_email}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {confirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setConfirmMember(null)}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-2">Confirm Sign-In</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Mark <span className="text-white font-semibold">{confirmMember.full_name}</span> as attended for <span className="text-white font-semibold">{classDay?.className}</span> today?
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmMember(null)}
                className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSignIn}
                disabled={signingId === confirmMember.id}
                className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {signingId === confirmMember.id ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
