import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../contexts/LanguageContext';
import { apiClient } from '../../api/client';
import { formatIQD, getLocalizedName } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/Shared';

export default function ServicesPage() {
  const { t, lang } = useLang();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getPublicServices().then(res => {
      setServices(res.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container page-content">
      <h2>{t('services.title')}</h2>
      <div className="services-grid">
        {services.map(s => (
          <div key={s.id} className="service-card">
            <h3>{getLocalizedName(s, 'name', lang)}</h3>
            <p>{getLocalizedName(s, 'description', lang)}</p>
            <div className="service-price">{formatIQD(s.base_price)}</div>
            <Link to={`/book?service=${s.id}`} className="btn btn-primary btn-sm">{t('nav.book')}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
