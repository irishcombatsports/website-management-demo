import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Schedule from './pages/Schedule';
import Merch from './pages/Merch';
import WaitingList from './pages/WaitingList';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import AdminDemo from './pages/AdminDemo';
import AdminSignIn from './pages/AdminSignIn';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/merch" element={<Merch />} />
            <Route path="/waiting-list" element={<WaitingList />} />
            <Route path="/admin-demo" element={<AdminDemo />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/sign-in" element={<AdminRoute><AdminSignIn /></AdminRoute>} />
            <Route path="*" element={
              <div className="min-h-screen pt-16 flex items-center justify-center text-center px-4">
                <div>
                  <p className="text-purple-400 text-6xl font-black mb-4">404</p>
                  <p className="text-white font-bold text-xl mb-2">Page not found</p>
                  <a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">← Back to home</a>
                </div>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
