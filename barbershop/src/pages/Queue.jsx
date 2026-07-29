import React, { useEffect, useState } from 'react';
import { Plus, Play, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    barber_id: '',
    service_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [qData, cData, bData, sData] = await Promise.all([
        api.getQueue(),
        api.getCustomers(),
        api.getBarbers(),
        api.getServices()
      ]);
      setQueue(qData);
      setCustomers(cData);
      setBarbers(bData);
      setServices(sData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    try {
      const now = new Date();
      await api.createAppointment({
        ...formData,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().substring(0, 5),
        status: 'Waiting',
        type: 'Walk-in'
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2>Walk-in Queue</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Walk-in
        </button>
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
              {queue.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted">No customers in queue.</td></tr>
              ) : (
                queue.map(item => (
                  <tr key={item.id}>
                    <td>{item.time}</td>
                    <td>{item.customer_name}</td>
                    <td>{item.service_name}</td>
                    <td>{item.barber_name}</td>
                    <td>
                      <span className={`badge ${item.status === 'Waiting' ? 'badge-warning' : 'badge-info'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {item.status === 'Waiting' && (
                          <button className="btn-icon text-info" onClick={() => updateStatus(item.id, 'In Service')} title="Start Service">
                            <Play size={20} />
                          </button>
                        )}
                        <button className="btn-icon text-success" onClick={() => updateStatus(item.id, 'Completed')} title="Complete">
                          <CheckCircle size={20} />
                        </button>
                        <button className="btn-icon text-danger" onClick={() => updateStatus(item.id, 'Cancelled')} title="Cancel">
                          <XCircle size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add Walk-in Customer" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleAddWalkIn}>
            <div className="form-group">
              <label>Customer</label>
              <select className="form-control" required value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Service</label>
              <select className="form-control" required value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})}>
                <option value="">Select Service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Barber</label>
              <select className="form-control" required value={formData.barber_id} onChange={e => setFormData({...formData, barber_id: e.target.value})}>
                <option value="">Select Barber</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-3">Add to Queue</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
