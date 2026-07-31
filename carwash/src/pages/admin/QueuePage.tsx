import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner, StatusBadge } from '../../components/Shared';
import { formatTime } from '../../utils/formatters';

export default function QueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getQueue()
      .then(r => setQueue(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Live Queue</h2>
      <div className="table-responsive">
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Time</th>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Bay</th>
            </tr>
          </thead>
          <tbody>
            {queue.map(item => (
              <tr key={item.id}>
                <td data-label="Time">{formatTime(item.time)}</td>
                <td data-label="Vehicle">{item.vehicle?.plate}</td>
                <td data-label="Customer">{item.customer?.name}</td>
                <td data-label="Status"><StatusBadge status={item.status} /></td>
                <td data-label="Bay">{item.bay?.name || 'Not assigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
