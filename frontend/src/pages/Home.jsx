import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { demoThemes } from '../demoThemes';

const packages = [
  {
    name: 'Starter Website',
    setup: '€199 setup',
    monthly: '€9.99/month',
    summary: 'A polished website that makes a small business look professional and easy to contact.',
    includes: [
      'Professional website',
      'Mobile responsive design',
      'Contact form',
      'Free trial or enquiry form',
      'Gallery section',
      'Schedule or services section',
      'Hosting and support',
    ],
  },
  {
    name: 'Growth Management System',
    setup: '€299 setup',
    monthly: '€19.99/month',
    summary: 'Adds the database, admin tools and tracking small organisations need day to day.',
    includes: [
      'Everything in Starter',
      'Member/customer database',
      'Booking or sign-up tracking',
      'Admin dashboard',
      'Waiver or form collection',
      'Activity notifications',
      'Exportable lists',
      'Basic reporting',
    ],
    featured: true,
  },
  {
    name: 'Pro Business System',
    setup: '€499 setup',
    monthly: '€49.99/month',
    summary: 'For businesses that want payments, renewals and a proper customer portal.',
    includes: [
      'Everything in Growth',
      'Online payments',
      'Recurring memberships',
      'Payment history',
      'Automated renewals',
      'Failed payment handling',
      'Member/customer portal',
      'Priority support',
    ],
  },
];

const customItems = ['Logo', 'Colours', 'Photos', 'Business name', 'Services/classes', 'Pricing', 'Forms', 'Social links', 'Contact details'];
const adminFeatures = ['Member/customer list', 'Sign-ups', 'Attendance or bookings', 'Waivers/forms', 'Activity notifications', 'Reports'];
const steps = [
  ['1', 'Pick a demo style', 'Choose the version closest to your business so the structure starts in the right place.'],
  ['2', 'Send your branding and details', 'Share your logo, photos, colours, services, pricing, contact details and links.'],
  ['3', 'We customise the website', 'The demo is rewritten and restyled around your business, not left as a generic template.'],
  ['4', 'Go live in 48-72 hours', 'Your site is deployed, connected to forms and ready to send to customers.'],
];

function ThemeLogo({ theme, size = 'lg' }) {
  const classes = size === 'sm' ? 'w-10 h-10 text-xs' : 'w-16 h-16 text-sm';
  return (
    <div
      className={`${classes} rounded-full flex items-center justify-center font-black text-white shadow-lg border border-white/15`}
      style={{ background: theme.accent, boxShadow: `0 18px 60px ${theme.accent}45` }}
    >
      {theme.logo}
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--primary)' }}>{eyebrow}</p>
      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h2>
      {text && <p className="text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed">{text}</p>}
    </div>
  );
}

function RequestForm({ theme }) {
  const [form, setForm] = useState({ name: '', email: '', business: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.business) {
      setError('Please add your name, email and business type.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: `Demo request for ${form.business}\n\nPreferred demo style: ${theme.label}\n\n${form.message || 'No extra notes.'}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send request.');
      setStatus('success');
      setForm({ name: '', email: '', business: '', message: '' });
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5">
        <p className="text-white font-bold">Request saved.</p>
        <p className="text-green-200 text-sm mt-1">Send your logo, photos and business details and we can turn this demo into your live website.</p>
        <button onClick={() => setStatus('idle')} className="btn-secondary mt-5 text-sm">Send another request</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input className="input" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <input className="input" placeholder="Business type, e.g. PT studio, gym, club" value={form.business} onChange={e => setForm({ ...form, business: e.target.value })} />
      <textarea className="input min-h-[110px]" placeholder="Anything you want customised first?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
      {error && <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">{error}</div>}
      <button className="btn-primary w-full" disabled={status === 'loading'}>{status === 'loading' ? 'Sending...' : 'Request a Demo'}</button>
    </form>
  );
}

export default function Home() {
  const [activeId, setActiveId] = useState(demoThemes[0].id);
  const theme = useMemo(() => demoThemes.find(item => item.id === activeId) || demoThemes[0], [activeId]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', theme.accent);
  }, [theme]);

  return (
    <div className="bg-black text-white">
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_0.92fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400 mb-5">
              <span className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
              Live customisable demo system
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              A Complete Website & Management System for Your Business
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg mt-5 max-w-2xl leading-relaxed">
              Custom branding, sign-ups, bookings, memberships, payments and admin tools — all built from a proven system.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <a href="#demo-styles" className="btn-primary">View Demo Options</a>
              <a href="#request" className="btn-secondary">Request This Website</a>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-xl">
              {['48-72h launch', 'Mobile first', 'Admin tools'].map(item => (
                <div key={item} className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-3 text-center text-xs font-semibold text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
            <div className="relative min-h-[440px]">
              <img key={theme.heroImage} src={theme.heroImage} alt={`${theme.label} demo`} className="absolute inset-0 w-full h-full object-cover opacity-70 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <ThemeLogo theme={theme} />
                  <div>
                    <p className="text-white font-black text-xl">{theme.businessName}</p>
                    <p className="text-zinc-300 text-sm">{theme.label} demo</p>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">{theme.headline}</h2>
                <p className="text-zinc-300 text-sm mt-3 max-w-lg">{theme.subheadline}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {theme.services.slice(0, 4).map(service => (
                    <div key={service} className="rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-xs text-zinc-200">
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12" id="theme-switcher">
        <div className="max-w-6xl mx-auto rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5">
          <p className="text-white font-bold mb-3">See how this website looks for different businesses</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {demoThemes.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                className={`rounded-lg border px-3 py-3 text-left transition-all duration-300 ${activeId === item.id ? 'border-white/30 bg-white/10' : 'border-zinc-800 bg-black/40 hover:border-zinc-600'}`}
              >
                <span className="block w-6 h-6 rounded-full mb-2" style={{ background: item.accent }} />
                <span className="text-white text-sm font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="demo-styles" className="px-4 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Choose Your Demo Style"
            title="One proven system, tailored to your business"
            text="Each demo can change layout emphasis, images, colours, forms, wording, pricing and admin workflows for the type of organisation you sell to."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {demoThemes.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                className={`group text-left rounded-lg border bg-zinc-950 overflow-hidden transition-all duration-300 ${activeId === item.id ? 'border-white/25 shadow-xl' : 'border-zinc-800 hover:border-zinc-600'}`}
              >
                <div className="aspect-[16/9] overflow-hidden bg-zinc-900">
                  <img src={item.heroImage} alt={item.label} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <ThemeLogo theme={item} size="sm" />
                    <p className="text-white font-bold">{item.label}</p>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Layout, images, colours and wording can be changed for {item.label.toLowerCase()} websites, forms and management tools.
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
          <SectionHeader
            eyebrow="Live Preview"
            title={`${theme.businessName} content changes instantly`}
            text="This is the same page structure rebranded through a clean configuration object. Swap the content once and the demo becomes a business-ready website."
          />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2">{theme.servicesTitle}</p>
              <div className="space-y-2">
                {theme.services.map(service => (
                  <div key={service} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-black/40 px-3 py-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
                    <span className="text-zinc-200 text-sm">{service}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2">Membership / Pricing Copy</p>
              <p className="text-white font-semibold leading-snug">{theme.pricingWording}</p>
              <div className="mt-5 rounded-lg border border-zinc-800 bg-black/40 p-4">
                <p className="text-zinc-400 text-sm italic">"{theme.testimonial}"</p>
                <p className="text-zinc-600 text-xs mt-3">Sample testimonial wording</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="packages" className="px-4 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Pricing"
            title="Packages for different stages"
            text="Start with a professional website, then add database, admin, booking and payment features when the business is ready."
          />
          <div className="grid lg:grid-cols-3 gap-4 mt-8">
            {packages.map(plan => (
              <div key={plan.name} className={`card flex flex-col ${plan.featured ? 'border-[var(--primary)]/60 shadow-2xl' : ''}`}>
                {plan.featured && <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: theme.accent }}>Most popular</p>}
                <p className="text-white text-xl font-black">{plan.name}</p>
                <div className="mt-4">
                  <p className="text-3xl font-black text-white">{plan.setup}</p>
                  <p className="text-zinc-400 text-sm mt-1">{plan.monthly}</p>
                </div>
                <p className="text-zinc-400 text-sm mt-4 leading-relaxed">{plan.summary}</p>
                <ul className="mt-5 space-y-2 flex-1">
                  {plan.includes.map(item => (
                    <li key={item} className="flex gap-2 text-sm text-zinc-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: theme.accent }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#request" className="btn-secondary text-center mt-6">Request package</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          <div>
            <SectionHeader
              eyebrow="What Gets Customised"
              title="Every visible detail can match the customer"
              text="Clear placeholder areas are built into the system so the same base can become a gym site, PT site, local business site, club portal or coaching system."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
              {customItems.map(item => (
                <div key={item} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-white font-semibold text-sm">{item}</p>
                  <p className="text-zinc-600 text-xs mt-1">Swap-ready</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="grid grid-cols-3 gap-3">
              {theme.gallery.map((src, index) => (
                <img key={src} src={src} alt={`${theme.label} gallery ${index + 1}`} className="aspect-[3/4] w-full object-cover rounded-lg border border-zinc-800" />
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-zinc-700 p-4">
              <p className="text-white font-semibold">Placeholder areas</p>
              <p className="text-zinc-500 text-sm mt-1">Business name, logo, brand colour, hero image, pricing, services/classes, contact email, phone number and social media links are intentionally easy to replace.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow="How It Works" title="From demo to live site in days" />
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            {steps.map(([number, title, text]) => (
              <div key={number} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black mb-4" style={{ background: theme.accent }}>{number}</div>
                <p className="text-white font-bold">{title}</p>
                <p className="text-zinc-500 text-sm mt-2 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="admin-features" className="px-4 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
          <SectionHeader
            eyebrow="Live Admin Features"
            title="More than a pretty website"
            text="The management system behind the demo can track enquiries, members, customers, bookings, forms and activity notifications."
          />
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
              <p className="text-white font-semibold text-sm">Admin dashboard preview</p>
              <Link to="/admin" className="text-xs font-semibold" style={{ color: theme.accent }}>Open admin</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 p-4">
              {adminFeatures.map(feature => (
                <div key={feature} className="rounded-lg border border-zinc-800 bg-black/40 p-4">
                  <p className="text-white font-semibold text-sm">{feature}</p>
                  <p className="text-zinc-600 text-xs mt-1">Included in system demo</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="request" className="px-4 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: theme.accent }}>Request this website</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">Want this customised for your business?</h2>
            <p className="text-zinc-400 mt-4 leading-relaxed">
              Send your logo, photos and business details and we’ll turn this demo into your live website.
            </p>
            <div className="mt-6 rounded-lg border border-zinc-800 bg-black/40 p-4">
              <p className="text-white font-semibold">Current preview: {theme.label}</p>
              <p className="text-zinc-500 text-sm mt-1">Theme colour, photos, services, contact details and wording are already being swapped live above.</p>
            </div>
          </div>
          <RequestForm theme={theme} />
        </div>
      </section>
    </div>
  );
}
