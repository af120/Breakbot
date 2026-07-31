import React, { useEffect, useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function LocationPage() {
  const { t } = useLang();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getPublicSettings()
      .then(r => setSettings(r.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container page-content">
      <h2>{t('nav.location')}</h2>
      <p>{settings?.address || 'Our address goes here.'}</p>
      {settings?.latitude && settings?.longitude && (
        <div style={{ marginTop: 20 }}>
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${settings.latitude},${settings.longitude}`} 
            target="_blank" rel="noopener noreferrer" 
            className="btn btn-primary"
          >
            Get Directions
          </a>
        </div>
      )}
    </div>
  );
}
