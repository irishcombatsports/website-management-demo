import { Link } from 'react-router-dom';

const sections = [
  { title: '1. Membership', items: ['Membership is personal and non-transferable.', 'Unlimited Monthly Membership grants unlimited access to scheduled regular classes until the end of the current calendar month, regardless of the date of payment.', '2 Classes Weekly Membership grants access to two regular classes per week until the end of the current calendar month.', 'Drop-in passes grant access to a single scheduled class where space is available.', 'Free first-class trial is limited to one per person.'] },
  { title: '2. Payments & Cancellations', items: ['All fees are payable in advance via Stripe.', 'Memberships do not auto-renew unless explicitly enabled — you choose when to renew.', 'Refunds are not provided for unused class days. In genuine cases (injury, relocation), contact us and we will consider them on a case-by-case basis.', 'Drop-in fees are non-refundable once the class has started.'] },
  { title: '3. Code of Conduct', items: ['Respect coaches, training partners and visitors at all times.', 'No training under the influence of alcohol or drugs.', 'Train within your ability and at the intensity directed by the coach.', 'Maintain personal hygiene and clean training gear.', 'The club reserves the right to suspend or terminate membership for breach of conduct, with no refund.'] },
  { title: '4. Health & Safety', items: ['You must inform us of any medical condition or injury that may affect your ability to train safely.', 'Training involves real physical risk. The signed waiver and our liability terms apply to all participation.', 'The club is not a substitute for professional medical advice.'] },
];

export default function Terms() {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto pt-12">
        <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2">Legal</p>
        <h1 className="text-3xl font-black text-white mb-1">Terms of <span className="text-purple-400">Service</span></h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: January 2026 · DRAFT — pending review by an Irish solicitor before publication.</p>

        <article className="space-y-8">
          <p className="text-zinc-400 text-sm leading-relaxed">
            These Terms govern your use of the Training Club website and your membership at 123 Main Street, Your Town.
          </p>

          {sections.map(s => (
            <section key={s.title}>
              <h2 className="text-white font-bold mb-3">{s.title}</h2>
              <ul className="space-y-2">
                {s.items.map(item => (
                  <li key={item} className="flex gap-2 text-zinc-400 text-sm leading-relaxed">
                    <span className="text-zinc-600 flex-shrink-0 mt-0.5">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section>
            <h2 className="text-white font-bold mb-3">5. Liability</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Our liability is limited to the maximum extent permitted by Irish law. Nothing in these Terms excludes liability for death or personal injury caused by negligence.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-3">6. Governing Law</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">These Terms are governed by the laws of Ireland. Any dispute will be subject to the exclusive jurisdiction of the Irish courts.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-3">7. Contact</h2>
            <p className="text-zinc-400 text-sm">Questions? Email us at{' '}
              <a href="mailto:hello@trainingclub.example" className="text-purple-400 hover:text-purple-300 transition-colors">hello@trainingclub.example</a>
            </p>
          </section>

          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-500">
            <strong className="text-zinc-400">Note:</strong> This document is a working draft. Before publishing publicly, we strongly recommend an Irish solicitor reviews it.
          </div>
        </article>

        <Link to="/" className="inline-block mt-8 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Back to home</Link>
      </div>
    </div>
  );
}
