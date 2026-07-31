import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { formatIQD } from '../../utils/formatters';

export default function PaymentsPage() {
  const [appointmentId, setAppointmentId] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId) return;
    setLoading(true);
    try {
      const res = await apiClient.getPayments(appointmentId);
      setPayments(res.data || []);
    } catch (e) {
      alert("Error fetching payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Payments</h2>
      <form onSubmit={handleSearch} className="single-column-form" style={{ maxWidth: 400, marginBottom: 20 }}>
        <input 
          type="text" 
          placeholder="Enter Appointment ID" 
          value={appointmentId}
          onChange={e => setAppointmentId(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search Payments'}
        </button>
      </form>
      
      {payments.length > 0 && (
        <div className="table-responsive">
          <table className="data-table mobile-cards">
            <thead>
              <tr>
                <th>ID</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td data-label="ID">{p.id}</td>
                  <td data-label="Method">{p.method}</td>
                  <td data-label="Amount">{formatIQD(p.amount)}</td>
                  <td data-label="Date">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {payments.length === 0 && !loading && appointmentId && (
        <p>No payments found for this appointment.</p>
      )}
    </div>
  );
}
