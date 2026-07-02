import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-dashed border-zinc-600 bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500">Logo</div>
          <div className="hidden sm:block">
            <div className="text-white font-black text-sm tracking-wider leading-none">DEMO SYSTEM</div>
            <div className="text-zinc-400 text-xs tracking-widest">WEBSITES + ADMIN</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="/#demo-styles" className="text-zinc-400 hover:text-white text-sm transition-colors">Demo Styles</a>
          <a href="/#packages" className="text-zinc-400 hover:text-white text-sm transition-colors">Packages</a>
          <a href="/#admin-features" className="text-zinc-400 hover:text-white text-sm transition-colors">Admin Tools</a>
          <a href="/#request" className="text-zinc-400 hover:text-white text-sm transition-colors">Request</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  to="/admin/sign-in"
                  className="text-zinc-300 hover:text-white text-sm transition-colors"
                >
                  Class Sign-In
                </Link>
              )}
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                className="text-zinc-300 hover:text-white text-sm transition-colors"
              >
                {user.role === 'admin' ? 'Admin Panel' : 'My Account'}
              </Link>
              <button onClick={handleLogout} className="btn-secondary text-sm px-4 py-2">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/admin-demo" className="text-zinc-300 hover:text-white text-sm transition-colors">Admin Demo</Link>
              <a href="/#request" className="btn-primary text-sm px-4 py-2">Request Demo</a>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-zinc-400 hover:text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black px-4 py-4 flex flex-col gap-4">
          <a href="/#demo-styles" onClick={() => setMenuOpen(false)} className="text-zinc-300 hover:text-white text-sm">Demo Styles</a>
          <a href="/#packages" onClick={() => setMenuOpen(false)} className="text-zinc-300 hover:text-white text-sm">Packages</a>
          <a href="/#admin-features" onClick={() => setMenuOpen(false)} className="text-zinc-300 hover:text-white text-sm">Admin Tools</a>
          <a href="/#request" onClick={() => setMenuOpen(false)} className="text-zinc-300 hover:text-white text-sm">Request</a>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin/sign-in" onClick={() => setMenuOpen(false)} className="text-zinc-300 hover:text-white text-sm">
                  Class Sign-In
                </Link>
              )}
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMenuOpen(false)} className="text-zinc-300 hover:text-white text-sm">
                {user.role === 'admin' ? 'Admin Panel' : 'My Account'}
              </Link>
              <button onClick={handleLogout} className="text-left text-zinc-300 hover:text-white text-sm">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/admin-demo" onClick={() => setMenuOpen(false)} className="text-zinc-300 hover:text-white text-sm">Admin Demo</Link>
              <a href="/#request" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">Request Demo</a>
            </>
          )}
        </div>
      )}
    </header>
  );
}
