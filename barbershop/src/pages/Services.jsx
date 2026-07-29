import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Services() {
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', price: '', duration: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setServices(await api.getServices()); } catch (err) { console.error(err); }
  };

  const openModal = (item = null) => {
    if (item) {
      setCurrentId(item.id);
      setFormData({ name: item.name, price: item.price, duration: item.duration });
    } else {
      setCurrentId(null);
      setFormData({ name: '', price: '', duration: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentId) await api.updateService(currentId, formData);
      else await api.createService(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try { await api.deleteService(id); loadData(); } catch (err) { alert(err.message); }
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2>Services</h2>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} /> New Service</button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead><tr><th>Name</th><th>Price</th><th>Duration (mins)</th><th>Actions</th></tr></thead>
            <tbody>
              {services.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td><td>${item.price}</td><td>{item.duration}</td>
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
        <Modal title={currentId ? "Edit Service" : "New Service"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Name</label><input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Price ($)</label><input type="number" step="0.01" className="form-control" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
            <div className="form-group"><label>Duration (mins)</label><input type="number" className="form-control" required value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} /></div>
            <button type="submit" className="btn btn-primary w-full mt-3">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
