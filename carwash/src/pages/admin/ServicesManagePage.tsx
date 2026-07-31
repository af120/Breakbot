import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';
import { formatIQD } from '../../utils/formatters';

export default function ServicesManagePage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getServices()
      .then(r => setServices(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Manage Services</h2>
      <div className="table-responsive">
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td data-label="Name">{s.name_en}</td>
                <td data-label="Category">{s.category}</td>
                <td data-label="Base Price">{formatIQD(s.base_price)}</td>
                <td data-label="Duration">{s.duration_minutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
