import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.getSettings()
      .then(r => setSettings(r.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.updateSettings(settings);
      alert("Settings saved successfully");
    } catch (err) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Settings</h2>
      <form onSubmit={handleSave} className="single-column-form" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 15 }}>
          <label>Business Name (EN)</label>
          <input type="text" value={settings.business_name_en || ''} onChange={e => setSettings({...settings, business_name_en: e.target.value})} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Phone</label>
          <input type="text" value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>WhatsApp</label>
          <input type="text" value={settings.whatsapp || ''} onChange={e => setSettings({...settings, whatsapp: e.target.value})} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Address</label>
          <textarea value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
