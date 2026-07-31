import React, { useEffect, useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { apiClient } from '../../api/client';
import { LoadingSpinner, EmptyState } from '../../components/Shared';

export default function GalleryPage() {
  const { t } = useLang();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getPublicGallery()
      .then(r => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container page-content">
      <h2>{t('nav.gallery')}</h2>
      {items.length === 0 ? (
        <EmptyState message="No images in gallery." icon="📸" />
      ) : (
        <div className="gallery-grid">
          {items.map(item => (
            <div key={item.id} className="gallery-item">
              <img src={item.url} alt={item.title || 'Gallery item'} />
              {item.title && <h4>{item.title}</h4>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
