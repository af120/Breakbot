import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [filters, setFilters] = useState({ date: new Date().toISOString().split('T')[0], barber_id: '', status: '' });
  
  const [formData, setFormData] = useState({
    customer_id: '',
    barber_id: '',
    service_id: '',
    date: '',
    time: '',
    status: 'Scheduled'
  });

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filters]);

  const loadDependencies = async () => {
    try {
      const [cData, bData, sData] = await Promise.all([
        api.getCustomers(),
        api.getBarbers(),
        api.getServices()
      ]);
      setCustomers(cData);
      setBarbers(bData);
      setServices(sData);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await api.getAppointments(filters);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (app = null) => {
    if (app) {
      setCurrentId(app.id);
      setFormData({
        customer_id: app.customer_id,
        barber_id: app.barber_id,
        service_id: app.service_id,
        date: app.date,
        time: app.time,
        status: app.status
      });
    } else {
      setCurrentId(null);
      setFormData({
        customer_id: '',
        barber_id: '',
        service_id: '',
        date: filters.date,
        time: '09:00',
        status: 'Scheduled'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentId) {
        await api.updateAppointment(currentId, formData);
      } else {
        await api.createAppointment(formData);
      }
      setIsModalOpen(false);
      loadAppointments();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return 'badge-success';
      case 'Cancelled': case 'Rejected': return 'badge-danger';
      case 'Waiting': case 'Pending': return 'badge-warning';
      case 'In Service': return 'badge-info';
      default: return 'badge-default';
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2>Appointments</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> New Appointment
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex gap-2 flex-wrap">
          <input type="date" className="form-control" style={{width: 'auto'}} value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
          <select className="form-control" style={{width: 'auto'}} value={filters.barber_id} onChange={e => setFilters({...filters, barber_id: e.target.value})}>
            <option value="">All Barbers</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="form-control" style={{width: 'auto'}} value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Waiting">Waiting</option>
            <option value="In Service">In Service</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rejected">Rejected</option>
            <option value="No-show">No-show</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Barber</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted">No appointments found.</td></tr>
              ) : (
                appointments.map(item => (
                  <tr key={item.id}>
                    <td>{item.time}</td>
                    <td>{item.customer_name}</td>
                    <td>{item.service_name}</td>
                    <td>{item.barber_name}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => openModal(item)}><Edit size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title={currentId ? "Edit Appointment" : "New Appointment"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Customer</label>
              <select className="form-control" required value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Barber</label>
              <select className="form-control" required value={formData.barber_id} onChange={e => setFormData({...formData, barber_id: e.target.value})}>
                <option value="">Select Barber</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Service</label>
              <select className="form-control" required value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})}>
                <option value="">Select Service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
              </select>
            </div>
            <div className="grid grid-2" style={{gap: '1rem'}}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="time" className="form-control" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Waiting">Waiting</option>
                <option value="In Service">In Service</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Rejected">Rejected</option>
                <option value="No-show">No-show</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-3">Save Appointment</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
