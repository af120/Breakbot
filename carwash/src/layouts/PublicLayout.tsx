import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { generateWhatsAppUrl, generateCallUrl } from '../utils/formatters';
import { apiClient } from '../api/client';

export default function PublicLayout() {
  const { t, lang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    apiClient.getPublicSettings().then(r => r.success && setSettings(r.data || {})).catch(() => {});
  }, []);

  const phone = settings.phone || '';
  const whatsapp = settings.whatsapp || '';

  return (
    <div className="public-layout">
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="header-logo">
            <img src="/favicon.svg" alt="Logo" width={32} height={32} />
            <span>{settings[`business_name_${lang}`] || settings.business_name_en || 'Car Wash'}</span>
          </Link>
          <nav className={`site-nav ${menuOpen ? 'open' : ''}`}>
            <Link to="/" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>
            <Link to="/services" onClick={() => setMenuOpen(false)}>{t('nav.services')}</Link>
            <Link to="/book" onClick={() => setMenuOpen(false)}>{t('nav.book')}</Link>
            <Link to="/gallery" onClick={() => setMenuOpen(false)}>{t('nav.gallery')}</Link>
            <Link to="/location" onClick={() => setMenuOpen(false)}>{t('nav.location')}</Link>
            <Link to="/booking-status" onClick={() => setMenuOpen(false)}>{t('nav.booking_status')}</Link>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <div className="mobile-action-bar">
        <Link to="/book" className="action-item action-book">
          <span>📅</span>
          <span>{t('nav.book')}</span>
        </Link>
        {whatsapp && (
          <a href={generateWhatsAppUrl(whatsapp, '')} className="action-item action-whatsapp" target="_blank" rel="noopener noreferrer">
            <span>💬</span>
            <span>{t('home.whatsapp')}</span>
          </a>
        )}
        {phone && (
          <a href={generateCallUrl(phone)} className="action-item action-call">
            <span>📞</span>
            <span>{t('home.call_us')}</span>
          </a>
        )}
      </div>

      <footer className="site-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} {settings[`business_name_${lang}`] || 'Car Wash'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
