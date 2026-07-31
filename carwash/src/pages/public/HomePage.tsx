import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../contexts/LanguageContext';
import { apiClient } from '../../api/client';
import { formatIQD, getLocalizedName } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/Shared';

export default function HomePage() {
  const { t, lang } = useLang();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.getPublicSettings(),
      apiClient.getPublicServices(),
    ]).then(([settingsRes, servicesRes]) => {
      setData({
        settings: settingsRes.data || {},
        services: servicesRes.data || []
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  
  const { settings, services } = data;

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="container">
          <h1>{getLocalizedName(settings, 'business_name', lang)}</h1>
          <p className="hero-description">{t('home.hero_description') || 'Premium Car Care'}</p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-primary">{t('nav.book')}</Link>
            <Link to="/services" className="btn btn-outline">{t('nav.services')}</Link>
          </div>
        </div>
      </section>
      
      <section className="services-section">
        <div className="container">
          <h2>{t('services.title')}</h2>
          <div className="services-grid">
            {services.slice(0, 4).map((s: any) => (
              <div key={s.id} className="service-card">
                <h3>{getLocalizedName(s, 'name', lang)}</h3>
                <p>{getLocalizedName(s, 'description', lang)}</p>
                <div className="service-price">{formatIQD(s.base_price)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
