import React from 'react';
import { useLang } from '../contexts/LanguageContext';
import { statusColors, generateWhatsAppUrl } from '../utils/formatters';

export function LoadingSpinner() {
  return <div className="loading-overlay"><div className="spinner"></div></div>;
}

export function EmptyState({ message, icon }: { message: string; icon?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon || '📋'}</div>
      <p className="empty-state-text">{message}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  return <span className={`badge ${statusColors[status] || 'badge'}`}>{t(`status.${status}`) || status}</span>;
}

export function WhatsAppButton({ phone, message, label }: { phone: string; message?: string; label?: string }) {
  if (!phone) return null;
  return (
    <a href={generateWhatsAppUrl(phone, message || '')} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
      📱 {label || 'WhatsApp'}
    </a>
  );
}
