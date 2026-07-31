import React, { useState } from 'react';
import { apiClient } from '../../api/client';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.exportBackup();
      const blob = new Blob([JSON.stringify(res.data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString()}.json`;
      a.click();
    } catch (e) {
      alert("Error exporting backup");
    } finally {
      setLoading(false);
    }
  };

  const handleClearDemo = async () => {
    if (!window.confirm("WARNING: This will permanently clear all demo data! Continue?")) return;
    setLoading(true);
    try {
      await apiClient.clearDemoData();
      alert("Demo data cleared");
    } catch (e) {
      alert("Error clearing demo data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>System Backup & Reset</h2>
      <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, flex: 1, minWidth: 250 }}>
          <h3>Export Data</h3>
          <p>Download a JSON backup of all data.</p>
          <button className="btn btn-primary" onClick={handleExport} disabled={loading}>Export Backup</button>
        </div>
        <div style={{ background: '#ffeeee', padding: 20, borderRadius: 8, flex: 1, minWidth: 250 }}>
          <h3 style={{ color: '#c00' }}>Clear Demo Data</h3>
          <p>Remove all mock/demo appointments, customers, and payments.</p>
          <button className="btn btn-danger" onClick={handleClearDemo} disabled={loading}>Clear Demo Data</button>
        </div>
      </div>
    </div>
  );
}
