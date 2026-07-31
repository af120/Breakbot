import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function GalleryManagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getGallery()
      .then(r => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await apiClient.deleteGalleryItem(id);
      setItems(items.filter(i => i.id !== id));
    } catch (e) {
      alert("Error deleting item");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Manage Gallery</h2>
      <div className="gallery-grid" style={{ marginTop: 20 }}>
        {items.map(item => (
          <div key={item.id} className="gallery-item" style={{ position: 'relative' }}>
            <img src={item.url} alt={item.title || 'Image'} style={{ width: '100%' }} />
            <div style={{ padding: 10 }}>
              <h4>{item.title}</h4>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
