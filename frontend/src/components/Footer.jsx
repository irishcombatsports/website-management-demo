import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-12 h-12 rounded-full border border-dashed border-zinc-600 bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500">Logo</div>
              <div>
                <div className="text-white font-black text-sm tracking-wider leading-none">DEMO SYSTEM</div>
                <div className="text-zinc-500 text-xs tracking-widest">WEBSITES + ADMIN</div>
              </div>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              A productised website and management system demo for small businesses, gyms, clubs, coaches and local organisations.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Editable Placeholders</h3>
            <ul className="space-y-2 text-zinc-500 text-sm">
              <li>Business name, logo and colours</li>
              <li>Hero image, gallery and services</li>
              <li>Pricing, forms and admin workflows</li>
              <li>Email, phone and social links</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Demo Links</h3>
            <ul className="space-y-2">
              <li><a href="/#demo-styles" className="text-zinc-400 hover:text-white text-sm transition-colors">Demo Styles</a></li>
              <li><a href="/#packages" className="text-zinc-400 hover:text-white text-sm transition-colors">Packages</a></li>
              <li><a href="/#admin-features" className="text-zinc-400 hover:text-white text-sm transition-colors">Admin Features</a></li>
              <li><Link to="/analytics-demo" className="text-zinc-400 hover:text-white text-sm transition-colors">Analytics Demo</Link></li>
              <li><a href="/#request" className="text-zinc-400 hover:text-white text-sm transition-colors">Request a Demo</a></li>
              <li><Link to="/admin-demo" className="text-zinc-400 hover:text-white text-sm transition-colors">Admin Demo</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-zinc-600 text-sm">
          Built as a flexible live demo. Replace the placeholders with each customer&apos;s brand, images and business details.
        </div>
      </div>
    </footer>
  );
}
