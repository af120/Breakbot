import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getAuditLogs()
      .then(r => setLogs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Audit Logs</h2>
      <div className="table-responsive" style={{ marginTop: 20 }}>
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td data-label="Date">{new Date(log.created_at).toLocaleString()}</td>
                <td data-label="User">{log.user?.username}</td>
                <td data-label="Action">{log.action}</td>
                <td data-label="Entity">{log.entity_type} ({log.entity_id})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
