import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-layout">
      <button className="hamburger-btn admin-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'} Menu
      </button>
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h3>Car Wash Admin</h3>
        </div>
        <nav onClick={() => setMenuOpen(false)}>
          <div className="nav-group">
            <h4>Operations</h4>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/appointments">Appointments</Link>
            <Link to="/admin/queue">Queue</Link>
            <Link to="/admin/bays">Bays</Link>
          </div>
          <div className="nav-group">
            <h4>Management</h4>
            <Link to="/admin/customers">Customers</Link>
            <Link to="/admin/vehicles">Vehicles</Link>
            <Link to="/admin/employees">Employees</Link>
            <Link to="/admin/services">Services</Link>
          </div>
          <div className="nav-group">
            <h4>Financial</h4>
            <Link to="/admin/payments">Payments</Link>
            <Link to="/admin/expenses">Expenses</Link>
            <Link to="/admin/reports">Reports</Link>
          </div>
          <div className="nav-group">
            <h4>Content</h4>
            <Link to="/admin/gallery">Gallery</Link>
            <Link to="/admin/testimonials">Testimonials</Link>
            <Link to="/admin/content">Content</Link>
            <Link to="/admin/settings">Settings</Link>
          </div>
          {user?.role === 'admin' && (
            <div className="nav-group">
              <h4>System</h4>
              <Link to="/admin/users">Users</Link>
              <Link to="/admin/audit">Audit Log</Link>
              <Link to="/admin/backup">Backup</Link>
            </div>
          )}
        </nav>
        <button onClick={logout} className="btn btn-danger" style={{margin: '20px'}}>Logout</button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
