import { useState } from 'react';

const VOUCHER_AMOUNTS = ['€10', '€25', '€50', '€100', 'Other'];

const UPCOMING_ITEMS = [
  {
    name: 'Gift Vouchers',
    status: 'Available now',
    desc: "Register interest in a Training Club voucher and the club can contact you to arrange it.",
  },
  {
    name: 'Fundamentals Gloves',
    status: 'Coming soon',
    desc: 'Ask the club before buying gloves so you get the right size and type for training.',
  },
  {
    name: 'Beginner Gear',
    status: 'Coming soon',
    desc: 'Gum shields, hand wraps and comfortable training gear are the basics to start with.',
  },
];

const EQUIPMENT_NOTES = [
  'Fundamentals gloves',
  'Gum shield',
  'Hand wraps',
  'Comfortable training top',
  'Water bottle and towel',
];

export default function Merch() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    size: '',
    quantity: '1',
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
    if (!form.size) return setError('Please choose a voucher amount.');

    setStatus('loading');
    try {
      const res = await fetch('/api/preorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send pre-order interest.');
        setStatus('error');
        return;
      }
      setStatus('success');
      setForm({ name: '', email: '', phone: '', size: '', quantity: '1', notes: '' });
    } catch {
      setError('Network error. Please try again or message the club directly.');
      setStatus('error');
    }
  };

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto pt-12">
        <div className="text-center mb-10">
          <p className="text-purple-400 text-xs font-semibold tracking-widest uppercase mb-3">Club shop</p>
          <h1 className="text-4xl font-black text-white mb-3">
            Merch & <span className="text-purple-400">Equipment</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto">
            Gift vouchers are available, and this page also keeps equipment enquiries tidy for new members.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="aspect-[4/3] bg-black flex items-center justify-center p-8 border-b border-zinc-800">
              <div className="relative w-44 h-44 rounded-full border border-dashed border-zinc-600 bg-zinc-900 flex items-center justify-center">
                <span className="text-zinc-500 text-sm">Logo area</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-white font-black text-xl">Training Club Voucher</p>
                  <p className="text-purple-300 text-sm font-semibold mt-1">Gift voucher enquiry</p>
                </div>
                <span className="text-xs text-zinc-300 border border-purple-500/30 bg-purple-500/10 rounded-full px-3 py-1">
                  Available
                </span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Add your name, preferred voucher amount and contact details. No payment is taken here; the club can follow up to arrange the voucher.
              </p>
            </div>
          </section>

          <section className="card">
            {status === 'success' ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-4">✅</p>
                <p className="text-white font-bold text-lg mb-2">Pre-order interest sent</p>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                  We have your details. You will be contacted when pricing, design, and order dates are confirmed.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                  Add another pre-order
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4" data-analytics-label="Product enquiry form">
                <div>
                  <p className="text-white font-bold text-lg mb-1">Voucher or equipment enquiry</p>
                  <p className="text-zinc-500 text-sm">No payment is taken here. This sends your interest to the club.</p>
                </div>

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

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="label">Phone</label>
                    <input className="input" value={form.phone} onChange={e => update('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Voucher amount</label>
                    <select className="input" value={form.size} onChange={e => update('size', e.target.value)}>
                      <option value="">Choose amount</option>
                      {VOUCHER_AMOUNTS.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quantity</label>
                    <select className="input" value={form.quantity} onChange={e => update('quantity', e.target.value)}>
                      {[1, 2, 3, 4].map(qty => <option key={qty} value={qty}>{qty}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input min-h-[96px] resize-none"
                    placeholder="Optional: voucher name, collection preference, or equipment question."
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
                  {status === 'loading' ? 'Sending…' : 'Send Pre-Order Interest'}
                </button>
              </form>
            )}
          </section>
        </div>

        <section className="mt-8 grid md:grid-cols-3 gap-4">
          {UPCOMING_ITEMS.map(item => (
            <div key={item.name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-white font-bold text-sm mb-2">{item.name}</p>
              <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">{item.status}</p>
              <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <p className="text-white font-bold text-lg mb-2">Equipment checklist</p>
              <p className="text-zinc-500 text-sm max-w-xl">
                A quick guide for what members usually need for regular training. Ask at the club before buying expensive gear.
              </p>
            </div>
            <a href="mailto:hello@trainingclub.example" className="btn-secondary text-sm px-5 py-2 text-center">
              Ask About Gear
            </a>
          </div>
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EQUIPMENT_NOTES.map(note => (
              <div key={note} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-black/25 px-4 py-3">
                <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                <p className="text-zinc-300 text-sm">{note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
