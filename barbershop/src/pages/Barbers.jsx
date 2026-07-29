import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Barbers() {
  const [barbers, setBarbers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', working_hours: '09:00-19:00', days_off: 'Sunday', commission_percentage: 50
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setBarbers(await api.getBarbers()); } catch (err) { console.error(err); }
  };

  const openModal = (item = null) => {
    if (item) {
      setCurrentId(item.id);
      setFormData({ name: item.name, phone: item.phone, working_hours: item.working_hours, days_off: item.days_off, commission_percentage: item.commission_percentage });
    } else {
      setCurrentId(null);
      setFormData({ name: '', phone: '', working_hours: '09:00-19:00', days_off: 'Sunday', commission_percentage: 50 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentId) await api.updateBarber(currentId, formData);
      else await api.createBarber(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this barber?')) {
      try { await api.deleteBarber(id); loadData(); } catch (err) { alert(err.message); }
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2>Barbers</h2>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} /> New Barber</button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Hours</th><th>Days Off</th><th>Commission (%)</th><th>Actions</th></tr></thead>
            <tbody>
              {barbers.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td><td>{item.phone}</td><td>{item.working_hours}</td><td>{item.days_off}</td><td>{item.commission_percentage}%</td>
                  <td>
                    <button className="btn-icon text-info" onClick={() => openModal(item)}><Edit size={18} /></button>
                    <button className="btn-icon text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title={currentId ? "Edit Barber" : "New Barber"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Name</label><input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Phone</label><input type="text" className="form-control" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div className="form-group"><label>Working Hours</label><input type="text" className="form-control" required placeholder="09:00-19:00" value={formData.working_hours} onChange={e => setFormData({...formData, working_hours: e.target.value})} /></div>
            <div className="form-group"><label>Days Off</label><input type="text" className="form-control" required placeholder="Sunday" value={formData.days_off} onChange={e => setFormData({...formData, days_off: e.target.value})} /></div>
            <div className="form-group"><label>Commission %</label><input type="number" className="form-control" required min="0" max="100" value={formData.commission_percentage} onChange={e => setFormData({...formData, commission_percentage: e.target.value})} /></div>
            <button type="submit" className="btn btn-primary w-full mt-3">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
