import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', phone: '', notes: '', preferred_barber_id: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cData, bData] = await Promise.all([api.getCustomers(), api.getBarbers()]);
      setCustomers(cData); setBarbers(bData);
    } catch (err) { console.error(err); }
  };

  const openModal = (item = null) => {
    if (item) {
      setCurrentId(item.id);
      setFormData({ name: item.name, phone: item.phone, notes: item.notes, preferred_barber_id: item.preferred_barber_id || '' });
    } else {
      setCurrentId(null);
      setFormData({ name: '', phone: '', notes: '', preferred_barber_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentId) await api.updateCustomer(currentId, formData);
      else await api.createCustomer(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try { await api.deleteCustomer(id); loadData(); } catch (err) { alert(err.message); }
    }
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div>
      <div className="header-row">
        <h2>Customers</h2>
        <div className="flex gap-2">
          <input type="text" placeholder="Search..." className="form-control" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} /> New Customer</button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Preferred Barber</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td><td>{item.phone}</td><td>{item.preferred_barber_name || '-'}</td><td>{item.notes}</td>
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
        <Modal title={currentId ? "Edit Customer" : "New Customer"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Name</label><input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Phone</label><input type="text" className="form-control" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div className="form-group"><label>Preferred Barber</label><select className="form-control" value={formData.preferred_barber_id} onChange={e => setFormData({...formData, preferred_barber_id: e.target.value})}><option value="">None</option>{barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div className="form-group"><label>Notes</label><textarea className="form-control" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
            <button type="submit" className="btn btn-primary w-full mt-3">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
