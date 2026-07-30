import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, Calendar, User, Scissors } from 'lucide-react';
import api from '../api';

export default function BookingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const data = await api.getBookingRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.acceptBookingRequest(id);
      loadRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject this booking request?')) return;
    try {
      await api.rejectBookingRequest(id);
      loadRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="header-row">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Online Booking Requests
            {requests.length > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>{requests.length}</span>
            )}
          </h2>
          <p className="text-muted" style={{ marginTop: '0.25rem' }}>Accept or reject customer booking requests</p>
        </div>
        <button className="btn btn-secondary" onClick={loadRequests}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <p className="text-muted">Loading booking requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No Pending Requests</h3>
          <p className="text-muted">All booking requests have been processed. New requests will appear here automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(req => (
            <div key={req.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: 'var(--warning)',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingLeft: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className="badge badge-warning">Pending</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Submitted {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{req.customer_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>{req.customer_phone}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Scissors size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{req.service_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>${req.service_price} · {req.service_duration} min</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{formatDate(req.date)} at {req.time}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>with {req.barber_name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-success"
                    onClick={() => handleAccept(req.id)}
                    style={{ minWidth: '100px' }}
                  >
                    <CheckCircle size={18} /> Accept
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(req.id)}
                    style={{ minWidth: '100px' }}
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
