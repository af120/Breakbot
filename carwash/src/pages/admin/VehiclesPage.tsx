import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getVehicles()
      .then(r => setVehicles(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Vehicles</h2>
      <div className="table-responsive">
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Plate</th>
              <th>Brand & Model</th>
              <th>Type</th>
              <th>Customer</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id}>
                <td data-label="Plate">{v.plate}</td>
                <td data-label="Brand & Model">{v.brand} {v.model}</td>
                <td data-label="Type">{v.type}</td>
                <td data-label="Customer">{v.customer?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
