import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto pt-12">
        <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2">Legal</p>
        <h1 className="text-3xl font-black text-white mb-1">Privacy <span className="text-purple-400">Policy</span></h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: January 2026</p>

        <article className="space-y-8 text-zinc-400 text-sm leading-relaxed">
          <p>Training Club ("we", "our", "us") is committed to protecting your privacy in accordance with the General Data Protection Regulation (GDPR) and Irish data protection law.</p>

          <section>
            <h2 className="text-white font-bold mb-3">What We Collect</h2>
            <ul className="space-y-2">
              {['Name, email, phone, date of birth, and address (for membership registration)', 'Emergency contact details (for your safety)', 'Medical information you choose to disclose', 'Payment records processed via Stripe (we do not store card details)', 'Waiver signature records'].map(item => (
                <li key={item} className="flex gap-2">
                  <span className="text-zinc-600 flex-shrink-0 mt-0.5">–</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold mb-3">How We Use It</h2>
            <ul className="space-y-2">
              {['Managing your membership and class access', 'Contacting you about your membership, schedule changes, or safety', 'Processing payments via Stripe', 'Meeting our legal obligations (GDPR, Irish Health & Safety legislation)'].map(item => (
                <li key={item} className="flex gap-2">
                  <span className="text-zinc-600 flex-shrink-0 mt-0.5">–</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold mb-3">Your Rights</h2>
            <p>Under GDPR you have the right to access, correct, or delete your personal data. To exercise these rights, email us at{' '}
              <a href="mailto:hello@trainingclub.example" className="text-purple-400 hover:text-purple-300 transition-colors">hello@trainingclub.example</a>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-3">Data Storage</h2>
            <p>Your data is stored securely on our server. We do not sell or share your data with third parties, except Stripe for payment processing.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-3">Contact</h2>
            <p>Data controller: Training Club, 123 Main Street, Your Town.<br />
              Email: <a href="mailto:hello@trainingclub.example" className="text-purple-400 hover:text-purple-300 transition-colors">hello@trainingclub.example</a>
            </p>
          </section>
        </article>

        <Link to="/" className="inline-block mt-8 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Back to home</Link>
      </div>
    </div>
  );
}
