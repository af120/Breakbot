import React, { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { apiClient } from '../../api/client';
import { StatusBadge } from '../../components/Shared';
import { formatDate, formatTime } from '../../utils/formatters';

export default function BookingStatusPage() {
  const { t } = useLang();
  const [ref, setRef] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus(null);
    try {
      const res = await apiClient.checkBookingStatus(ref, phone);
      if (res.success && res.data) {
        setStatus(res.data);
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      setError('Booking not found or network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-content">
      <h2>{t('nav.booking_status')}</h2>
      <form onSubmit={handleCheck} className="single-column-form" style={{ maxWidth: 400 }}>
        {error && <div className="error-message">{error}</div>}
        <input 
          type="text" 
          value={ref} 
          onChange={e => setRef(e.target.value)} 
          placeholder="Booking Reference (e.g. B-1234)" 
          required 
        />
        <input 
          type="text" 
          value={phone} 
          onChange={e => setPhone(e.target.value)} 
          placeholder="Phone Number" 
          required 
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </form>

      {status && (
        <div className="booking-status-result" style={{ marginTop: 20, padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Booking {status.reference}</h3>
          <p><strong>Status:</strong> <StatusBadge status={status.status} /></p>
          <p><strong>Date:</strong> {formatDate(status.date)}</p>
          <p><strong>Time:</strong> {status.time ? formatTime(status.time) : 'Not assigned'}</p>
          <p><strong>Vehicle:</strong> {status.vehicle_type} {status.vehicle_brand}</p>
          {status.bay_name && <p><strong>Bay:</strong> {status.bay_name}</p>}
        </div>
      )}
    </div>
  );
}
