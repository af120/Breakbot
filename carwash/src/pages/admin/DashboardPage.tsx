import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getDashboardStats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="dashboard-stats" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: 20 }}>
        <div className="stat-card" style={{ padding: 20, background: '#f5f5f5', borderRadius: 8, minWidth: 200 }}>
          <h3>Today's Appointments</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>{stats?.today_count || 0}</p>
        </div>
        <div className="stat-card" style={{ padding: 20, background: '#f5f5f5', borderRadius: 8, minWidth: 200 }}>
          <h3>Pending</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>{stats?.pending_count || 0}</p>
        </div>
        <div className="stat-card" style={{ padding: 20, background: '#f5f5f5', borderRadius: 8, minWidth: 200 }}>
          <h3>Completed</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>{stats?.completed_count || 0}</p>
        </div>
      </div>
    </div>
  );
}
