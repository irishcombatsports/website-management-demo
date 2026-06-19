import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setUser(data.user);
            setMembership(data.membership);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData, membershipData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setMembership(membershipData || null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setMembership(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setMembership(data.membership);
    }
  };

  return (
    <AuthContext.Provider value={{ user, membership, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
