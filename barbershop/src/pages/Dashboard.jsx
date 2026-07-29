import React, { useEffect, useState } from 'react';
import { Calendar, Users, CheckCircle, DollarSign, Plus } from 'lucide-react';
import api from '../api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    waitingCustomers: 0,
    completedToday: 0,
    incomeToday: 0,
    incomeMonth: 0
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2>Dashboard</h2>
        <div className="flex gap-2">
          <Link to="/appointments" className="btn btn-primary"><Plus size={18} /> Appointment</Link>
          <Link to="/queue" className="btn btn-secondary"><Plus size={18} /> Walk-in</Link>
          <Link to="/customers" className="btn btn-secondary"><Plus size={18} /> Customer</Link>
          <Link to="/expenses" className="btn btn-secondary"><Plus size={18} /> Expense</Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={28} /></div>
          <div className="stat-info">
            <p>Today's Appointments</p>
            <h3>{stats.todayAppointments}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={28} /></div>
          <div className="stat-info">
            <p>Waiting Customers</p>
            <h3>{stats.waitingCustomers}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon text-success"><CheckCircle size={28} /></div>
          <div className="stat-info">
            <p>Completed Today</p>
            <h3>{stats.completedToday}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon text-warning"><DollarSign size={28} /></div>
          <div className="stat-info">
            <p>Today's Income</p>
            <h3>${Number(stats.incomeToday).toFixed(2)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon text-warning"><DollarSign size={28} /></div>
          <div className="stat-info">
            <p>Monthly Income</p>
            <h3>${Number(stats.incomeMonth).toFixed(2)}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
