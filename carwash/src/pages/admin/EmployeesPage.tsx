import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getEmployees()
      .then(r => setEmployees(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Employees</h2>
      <div className="table-responsive">
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id}>
                <td data-label="Name">{e.name}</td>
                <td data-label="Phone">{e.phone}</td>
                <td data-label="Role">{e.role}</td>
                <td data-label="Status">{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
