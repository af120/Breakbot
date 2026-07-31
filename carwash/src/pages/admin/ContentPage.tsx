import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function ContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getContent()
      .then(r => setContent(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Manage Content</h2>
      <div className="table-responsive" style={{ marginTop: 20 }}>
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value (EN)</th>
              <th>Value (AR)</th>
              <th>Value (KU)</th>
            </tr>
          </thead>
          <tbody>
            {content.map(c => (
              <tr key={c.id}>
                <td data-label="Key">{c.key}</td>
                <td data-label="Value (EN)">{c.value_en?.substring(0,50)}...</td>
                <td data-label="Value (AR)">{c.value_ar?.substring(0,50)}...</td>
                <td data-label="Value (KU)">{c.value_ku?.substring(0,50)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 20, color: '#666' }}>Inline editing to be enabled in full version.</p>
    </div>
  );
}
