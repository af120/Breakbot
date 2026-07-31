import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { LoadingSpinner, StatusBadge } from '../../components/Shared';
import { formatDate, formatTime } from '../../utils/formatters';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getAppointments()
      .then(r => setAppointments(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Appointments</h2>
      <div className="table-responsive">
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Date</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(app => (
              <tr key={app.id}>
                <td data-label="Ref">{app.reference}</td>
                <td data-label="Date">{formatDate(app.date)}</td>
                <td data-label="Time">{formatTime(app.time)}</td>
                <td data-label="Customer">{app.customer?.name}</td>
                <td data-label="Status"><StatusBadge status={app.status} /></td>
                <td data-label="Actions">
                  <Link to={`/admin/appointments/${app.id}`} className="btn btn-sm btn-outline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
