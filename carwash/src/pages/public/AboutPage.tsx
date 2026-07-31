import React, { useEffect, useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { apiClient } from '../../api/client';
import { getLocalizedName } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/Shared';

export default function AboutPage() {
  const { t, lang } = useLang();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getPublicContent()
      .then(r => setContent(r.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container page-content">
      <h2>About Us</h2>
      <div dangerouslySetInnerHTML={{ __html: getLocalizedName(content, 'about_text', lang) || '<p>Details about the car wash...</p>' }} />
    </div>
  );
}
