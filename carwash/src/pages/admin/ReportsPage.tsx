import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { formatIQD } from '../../utils/formatters';

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.getReportSummary(from, to);
      setReport(res.data);
    } catch (err) {
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Reports</h2>
      <form onSubmit={generateReport} className="single-column-form" style={{ maxWidth: 400, marginBottom: 20 }}>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} required />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} required />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </form>
      
      {report && (
        <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
          <h3>Summary</h3>
          <p><strong>Total Income:</strong> {formatIQD(report.total_income || 0)}</p>
          <p><strong>Total Expenses:</strong> {formatIQD(report.total_expenses || 0)}</p>
          <p><strong>Net Profit:</strong> {formatIQD((report.total_income || 0) - (report.total_expenses || 0))}</p>
          <p><strong>Appointments Completed:</strong> {report.appointments_completed || 0}</p>
        </div>
      )}
    </div>
  );
}
