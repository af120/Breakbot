import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getUsers()
      .then(r => setUsers(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete user?")) return;
    try {
      await apiClient.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      alert("Error deleting user");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>System Users</h2>
      <div className="table-responsive" style={{ marginTop: 20 }}>
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td data-label="Username">{u.username}</td>
                <td data-label="Role">{u.role}</td>
                <td data-label="Actions">
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
