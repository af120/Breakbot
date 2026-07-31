import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { LoadingSpinner, StatusBadge } from '../../components/Shared';
import { formatDate, formatTime } from '../../utils/formatters';

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.getAppointment(id)
      .then(r => setApp(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    try {
      await apiClient.updateAppointmentStatus(id, status);
      const res = await apiClient.getAppointment(id);
      setApp(res.data);
    } catch (e) {
      alert('Error updating status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!app) return <div>Appointment not found</div>;

  return (
    <div>
      <h2>Appointment Details: {app.reference}</h2>
      <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <p><strong>Status:</strong> <StatusBadge status={app.status} /></p>
        <p><strong>Customer:</strong> {app.customer?.name} ({app.customer?.phone})</p>
        <p><strong>Vehicle:</strong> {app.vehicle?.brand} {app.vehicle?.model} - {app.vehicle?.plate}</p>
        <p><strong>Date & Time:</strong> {formatDate(app.date)} at {formatTime(app.time)}</p>
      </div>
      
      <h3>Actions</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={() => updateStatus('confirmed')}>Confirm</button>
        <button className="btn btn-info" onClick={() => updateStatus('arrived')}>Mark Arrived</button>
        <button className="btn btn-primary" onClick={() => updateStatus('washing')}>Start Washing</button>
        <button className="btn btn-success" onClick={() => updateStatus('completed')}>Complete</button>
        <button className="btn btn-danger" onClick={() => updateStatus('cancelled')}>Cancel</button>
      </div>
    </div>
  );
}
