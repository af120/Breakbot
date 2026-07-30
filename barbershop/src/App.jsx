import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Scissors, LayoutDashboard, Calendar, Users, Briefcase, Settings, LogOut, FileText, CreditCard, Clock, Activity, Globe } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Queue from './pages/Queue';
import Customers from './pages/Customers';
import Barbers from './pages/Barbers';
import Services from './pages/Services';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import BookingPage from './pages/BookingPage';
import BookingRequests from './pages/BookingRequests';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/queue", icon: Clock, label: "Walk-in Queue" },
    { to: "/appointments", icon: Calendar, label: "Appointments" },
    { to: "/customers", icon: Users, label: "Customers" },
    { to: "/payments", icon: CreditCard, label: "Payments" },
    { to: "/booking-requests", icon: Globe, label: "Bookings" },
  ];

  if (user?.role === 'Admin') {
    links.push({ to: "/barbers", icon: Scissors, label: "Barbers" });
    links.push({ to: "/services", icon: Briefcase, label: "Services" });
    links.push({ to: "/expenses", icon: Activity, label: "Expenses" });
    links.push({ to: "/reports", icon: FileText, label: "Reports" });
    links.push({ to: "/settings", icon: Settings, label: "Settings" });
  }

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <Scissors size={28} />
          <span>BarberManager</span>
        </div>
        <nav className="nav-menu flex-1">
          {links.map(link => (
            <Link key={link.to} to={link.to} className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}>
              <link.icon size={20} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-4">
          <button className="nav-link w-full text-left" onClick={logout}>
            <LogOut size={20} />
            <span>Logout ({user?.username})</span>
          </button>
        </div>
      </div>
      <div className="mobile-nav">
        {links.slice(0, 5).map(link => (
          <Link key={link.to} to={link.to} className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}>
            <link.icon size={20} />
            <span>{link.label.split(' ')[0]}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <div className="app-container">
      {user && <Sidebar />}
      <div className={user ? "main-content" : "w-full"}>
        <Routes>
          <Route path="/book" element={<BookingPage />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
          <Route path="/queue" element={<PrivateRoute><Queue /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/barbers" element={<PrivateRoute><Barbers /></PrivateRoute>} />
          <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/booking-requests" element={<PrivateRoute><BookingRequests /></PrivateRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
