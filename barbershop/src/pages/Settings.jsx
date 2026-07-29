import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api from '../api';

export default function Settings() {
  const [settings, setSettings] = useState({
    shop_name: '',
    currency: '$',
    opening_time: '',
    closing_time: '',
    appointment_interval: '30',
    default_commission: '50',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2>Settings</h2>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Shop Name</label>
            <input type="text" className="form-control" value={settings.shop_name || ''} onChange={e => setSettings({...settings, shop_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Currency Symbol</label>
            <input type="text" className="form-control" value={settings.currency || ''} onChange={e => setSettings({...settings, currency: e.target.value})} />
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Opening Time</label>
              <input type="time" className="form-control" value={settings.opening_time || ''} onChange={e => setSettings({...settings, opening_time: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Closing Time</label>
              <input type="time" className="form-control" value={settings.closing_time || ''} onChange={e => setSettings({...settings, closing_time: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Appointment Interval (minutes)</label>
            <input type="number" className="form-control" value={settings.appointment_interval || ''} onChange={e => setSettings({...settings, appointment_interval: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Default Barber Commission (%)</label>
            <input type="number" className="form-control" value={settings.default_commission || ''} onChange={e => setSettings({...settings, default_commission: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" className="form-control" value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})}></textarea>
          </div>
          <button type="submit" className="btn btn-primary mt-3"><Save size={18} /> Save Settings</button>
        </form>
      </div>
    </div>
  );
}
