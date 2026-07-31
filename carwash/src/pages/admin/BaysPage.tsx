import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function BaysPage() {
  const [bays, setBays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getBays()
      .then(r => setBays(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Bays Management</h2>
      <div className="services-grid" style={{ marginTop: 20 }}>
        {bays.map(bay => (
          <div key={bay.id} className="service-card">
            <h3>{bay.name}</h3>
            <p>Status: <strong>{bay.status}</strong></p>
            <p>Type: {bay.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
