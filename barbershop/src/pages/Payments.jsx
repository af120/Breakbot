import React, { useEffect, useState } from 'react';
import { Plus, Printer } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ appointment_id: '', amount: '', discount: 0, payment_method: 'Cash' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setPayments(await api.getPayments());
      const allAppts = await api.getAppointments({ status: 'In Service' });
      const waiting = await api.getAppointments({ status: 'Waiting' });
      setAppointments([...allAppts, ...waiting]);
    } catch (err) { console.error(err); }
  };

  const handleApptChange = (e) => {
    const id = e.target.value;
    const appt = appointments.find(a => a.id === parseInt(id));
    if (appt) {
      setFormData({ ...formData, appointment_id: id, amount: appt.service_price });
    } else {
      setFormData({ ...formData, appointment_id: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createPayment(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const printReceipt = (p) => {
    const content = `
      =========================
          BARBERSHOP RECEIPT
      =========================
      Date: ${p.date}
      Customer: ${p.customer_name || 'Walk-in'}
      Service: ${p.service_name}
      Barber: ${p.barber_name}
      -------------------------
      Amount: $${p.amount}
      Discount: $${p.discount}
      Total Paid: $${p.amount - p.discount}
      Method: ${p.payment_method}
      =========================
      Thank you for your visit!
    `;
    const win = window.open('', '_blank');
    win.document.write(`<pre>${content}</pre>`);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <div className="header-row">
        <h2>Payments</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Record Payment</button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead><tr><th>Date</th><th>Customer</th><th>Service</th><th>Barber</th><th>Amount</th><th>Discount</th><th>Total</th><th>Method</th><th>Actions</th></tr></thead>
            <tbody>
              {payments.map(item => (
                <tr key={item.id}>
                  <td>{item.date}</td><td>{item.customer_name || 'Walk-in'}</td><td>{item.service_name}</td><td>{item.barber_name}</td>
                  <td>${item.amount}</td><td>${item.discount}</td><td>${item.amount - item.discount}</td><td>{item.payment_method}</td>
                  <td>
                    <button className="btn-icon text-info" onClick={() => printReceipt(item)} title="Print Receipt"><Printer size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Record Payment" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Appointment (Waiting / In Service)</label>
              <select className="form-control" required value={formData.appointment_id} onChange={handleApptChange}>
                <option value="">Select Appointment</option>
                {appointments.map(a => <option key={a.id} value={a.id}>{a.time} - {a.customer_name || 'Walk-in'} ({a.service_name})</option>)}
              </select>
            </div>
            <div className="form-group"><label>Amount ($)</label><input type="number" step="0.01" className="form-control" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
            <div className="form-group"><label>Discount ($)</label><input type="number" step="0.01" className="form-control" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} /></div>
            <div className="form-group">
              <label>Payment Method</label>
              <select className="form-control" value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                <option value="Cash">Cash</option><option value="Card">Card</option><option value="Other">Other</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-3">Complete Payment & Finish Service</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
