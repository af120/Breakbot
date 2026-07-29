import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setExpenses(await api.getExpenses()); } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createExpense(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="header-row">
        <h2>Expenses</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Record Expense</button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead>
            <tbody>
              {expenses.map(item => (
                <tr key={item.id}>
                  <td>{item.date}</td><td>{item.category}</td><td>${item.amount}</td><td>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Record Expense" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Rent">Rent</option><option value="Supplies">Supplies</option>
                <option value="Electricity">Electricity</option><option value="Salaries">Salaries</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group"><label>Amount ($)</label><input type="number" step="0.01" className="form-control" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
            <div className="form-group"><label>Date</label><input type="date" className="form-control" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            <div className="form-group"><label>Note</label><input type="text" className="form-control" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
            <button type="submit" className="btn btn-primary w-full mt-3">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
