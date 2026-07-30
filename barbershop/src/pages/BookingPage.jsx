import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Clock, User, Calendar, Phone, ArrowLeft, ArrowRight, Check, CheckCircle, Search, Star, DollarSign } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function publicAPI(endpoint) {
  const res = await fetch(`${BASE_URL}/public${endpoint}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Something went wrong');
  }
  return res.json();
}

async function publicPost(endpoint, body) {
  const res = await fetch(`${BASE_URL}/public${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

const steps = [
  { icon: Scissors, label: 'Service' },
  { icon: User, label: 'Barber' },
  { icon: Calendar, label: 'Date & Time' },
  { icon: Phone, label: 'Your Info' },
  { icon: Check, label: 'Confirm' }
];

export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [settings, setSettings] = useState({});
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Check bookings state
  const [showCheckBookings, setShowCheckBookings] = useState(false);
  const [checkPhone, setCheckPhone] = useState('');
  const [myBookings, setMyBookings] = useState(null);
  const [checkingBookings, setCheckingBookings] = useState(false);

  const [selected, setSelected] = useState({
    service: null,
    barber: null,
    date: '',
    time: '',
    customer_name: '',
    customer_phone: '',
    notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [sData, bData, settData] = await Promise.all([
        publicAPI('/services'),
        publicAPI('/barbers'),
        publicAPI('/settings')
      ]);
      setServices(sData);
      setBarbers(bData);
      setSettings(settData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (barber_id, date, service_id) => {
    try {
      setAvailability(null);
      const data = await publicAPI(`/availability?barber_id=${barber_id}&date=${date}&service_id=${service_id}`);
      setAvailability(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDateChange = (date) => {
    setSelected(prev => ({ ...prev, date, time: '' }));
    if (selected.barber && date) {
      loadAvailability(selected.barber.id, date, selected.service.id);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await publicPost('/book', {
        customer_name: selected.customer_name,
        customer_phone: selected.customer_phone,
        barber_id: selected.barber.id,
        service_id: selected.service.id,
        date: selected.date,
        time: selected.time,
        notes: selected.notes
      });
      setBookingResult(result);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckBookings = async () => {
    if (!checkPhone) return;
    setCheckingBookings(true);
    try {
      const data = await publicAPI(`/booking-status/${encodeURIComponent(checkPhone)}`);
      setMyBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingBookings(false);
    }
  };

  const resetBooking = () => {
    setStep(0);
    setSuccess(false);
    setBookingResult(null);
    setError('');
    setSelected({ service: null, barber: null, date: '', time: '', customer_name: '', customer_phone: '', notes: '' });
    setAvailability(null);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!selected.service;
      case 1: return !!selected.barber;
      case 2: return !!selected.date && !!selected.time;
      case 3: return !!selected.customer_name && !!selected.customer_phone;
      default: return true;
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    return max.toISOString().split('T')[0];
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadgeStyle = (status) => {
    const base = { padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'inline-block' };
    switch (status) {
      case 'Pending': return { ...base, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
      case 'Scheduled': return { ...base, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      case 'Completed': return { ...base, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      case 'Rejected': case 'Cancelled': return { ...base, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
      case 'Waiting': return { ...base, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
      case 'In Service': return { ...base, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      default: return { ...base, backgroundColor: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af' };
    }
  };

  // Styles
  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#0f1115',
    color: '#f3f4f6',
    fontFamily: "'Outfit', sans-serif",
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #1a1d24 0%, #0f1115 50%, #1a1510 100%)',
    borderBottom: '1px solid #2d3748',
    padding: '1.5rem 2rem',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  };

  const headerGlowStyle = {
    position: 'absolute',
    top: '-50%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '300px',
    background: 'radial-gradient(ellipse, rgba(203,163,99,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem',
  };

  const stepperStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '0',
    marginBottom: '2.5rem',
    padding: '0 1rem',
    overflowX: 'auto',
  };

  const stepItemStyle = (index) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0',
  });

  const stepCircleStyle = (index) => ({
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    border: '2px solid',
    borderColor: index <= step ? '#cba363' : '#2d3748',
    backgroundColor: index < step ? '#cba363' : index === step ? 'rgba(203,163,99,0.15)' : 'transparent',
    color: index < step ? '#000' : index === step ? '#cba363' : '#9ca3af',
    flexShrink: 0,
  });

  const stepLabelStyle = (index) => ({
    fontSize: '0.7rem',
    marginTop: '0.5rem',
    color: index <= step ? '#cba363' : '#9ca3af',
    textAlign: 'center',
    fontWeight: index === step ? 600 : 400,
  });

  const stepLineStyle = (index) => ({
    width: '40px',
    height: '2px',
    backgroundColor: index < step ? '#cba363' : '#2d3748',
    margin: '0 0.25rem',
    marginBottom: '1.25rem',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  });

  const cardStyle = (isSelected) => ({
    backgroundColor: isSelected ? 'rgba(203,163,99,0.1)' : '#1a1d24',
    border: `1px solid ${isSelected ? '#cba363' : '#2d3748'}`,
    borderRadius: '12px',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
    position: 'relative',
    overflow: 'hidden',
  });

  const selectedBadgeStyle = {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#cba363',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const gridStyle = {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  };

  const timeSlotStyle = (isAvailable, isSelected) => ({
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${isSelected ? '#cba363' : isAvailable ? '#2d3748' : '#1a1d24'}`,
    backgroundColor: isSelected ? 'rgba(203,163,99,0.15)' : isAvailable ? '#1a1d24' : '#0f1115',
    color: isSelected ? '#cba363' : isAvailable ? '#f3f4f6' : '#4a5568',
    cursor: isAvailable ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    fontWeight: 500,
    fontSize: '0.95rem',
    opacity: isAvailable ? 1 : 0.4,
  });

  const btnPrimaryStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.85rem 2rem',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: 'none',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1rem',
    backgroundColor: '#cba363',
    color: '#000',
  };

  const btnSecondaryStyle = {
    ...btnPrimaryStyle,
    backgroundColor: 'transparent',
    border: '1px solid #2d3748',
    color: '#f3f4f6',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    backgroundColor: '#0f1115',
    border: '1px solid #2d3748',
    borderRadius: '8px',
    color: '#f3f4f6',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.85rem 0',
    borderBottom: '1px solid #2d3748',
    fontSize: '0.95rem',
  };

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Scissors size={48} style={{ color: '#cba363', animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Loading...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerGlowStyle} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Scissors size={32} style={{ color: '#cba363' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#cba363', margin: 0 }}>
              {settings.shop_name || 'BarberShop'}
            </h1>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>Book your appointment online</p>
          <button
            onClick={() => setShowCheckBookings(!showCheckBookings)}
            style={{ ...btnSecondaryStyle, marginTop: '1rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            <Search size={16} /> {showCheckBookings ? 'Back to Booking' : 'Check My Bookings'}
          </button>
        </div>
      </div>

      <div style={containerStyle}>
        {/* Check Bookings Section */}
        {showCheckBookings ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>Check My Bookings</h2>
            <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={checkPhone}
                onChange={(e) => setCheckPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckBookings()}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={handleCheckBookings}
                disabled={checkingBookings || !checkPhone}
                style={{ ...btnPrimaryStyle, opacity: checkingBookings || !checkPhone ? 0.5 : 1, whiteSpace: 'nowrap' }}
              >
                {checkingBookings ? 'Searching...' : 'Search'}
              </button>
            </div>

            {myBookings !== null && (
              <div>
                {myBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No bookings found for this phone number.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {myBookings.map((booking) => (
                      <div key={booking.id} style={{ backgroundColor: '#1a1d24', border: '1px solid #2d3748', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <h4 style={{ margin: 0, fontWeight: 600 }}>{booking.service_name}</h4>
                            <p style={{ margin: '0.25rem 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>with {booking.barber_name}</p>
                          </div>
                          <span style={getStatusBadgeStyle(booking.status)}>{booking.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', color: '#9ca3af', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={14} /> {formatDate(booking.date)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={14} /> {booking.time}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <DollarSign size={14} /> {settings.currency || '$'}{booking.service_price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : success ? (
          /* Success Screen */
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              animation: 'popIn 0.5s ease',
            }}>
              <CheckCircle size={52} style={{ color: '#10b981' }} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: '#10b981' }}>
              Booking Request Sent!
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '450px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              {bookingResult?.message || 'Your appointment request has been submitted. The barber will review and confirm your booking.'}
            </p>

            <div style={{
              backgroundColor: '#1a1d24',
              border: '1px solid #2d3748',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '400px',
              margin: '0 auto 2rem',
              textAlign: 'left',
            }}>
              <h4 style={{ color: '#cba363', marginBottom: '1rem', fontWeight: 600 }}>Booking Summary</h4>
              <div style={summaryRowStyle}>
                <span style={{ color: '#9ca3af' }}>Service</span>
                <span style={{ fontWeight: 500 }}>{selected.service?.name}</span>
              </div>
              <div style={summaryRowStyle}>
                <span style={{ color: '#9ca3af' }}>Barber</span>
                <span style={{ fontWeight: 500 }}>{selected.barber?.name}</span>
              </div>
              <div style={summaryRowStyle}>
                <span style={{ color: '#9ca3af' }}>Date</span>
                <span style={{ fontWeight: 500 }}>{formatDate(selected.date)}</span>
              </div>
              <div style={summaryRowStyle}>
                <span style={{ color: '#9ca3af' }}>Time</span>
                <span style={{ fontWeight: 500 }}>{selected.time}</span>
              </div>
              <div style={{ ...summaryRowStyle, borderBottom: 'none' }}>
                <span style={{ color: '#9ca3af' }}>Price</span>
                <span style={{ fontWeight: 600, color: '#cba363' }}>{settings.currency || '$'}{selected.service?.price}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={resetBooking} style={btnPrimaryStyle}>
                Book Another Appointment
              </button>
              <button onClick={() => { setShowCheckBookings(true); setCheckPhone(selected.customer_phone); setSuccess(false); handleCheckBookings(); }} style={btnSecondaryStyle}>
                View My Bookings
              </button>
            </div>
            <style>{`@keyframes popIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }`}</style>
          </div>
        ) : (
          /* Booking Steps */
          <div>
            {/* Stepper */}
            <div style={stepperStyle}>
              {steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={stepCircleStyle(i)}>
                      {i < step ? <Check size={18} /> : <s.icon size={18} />}
                    </div>
                    <span style={stepLabelStyle(i)}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <div style={stepLineStyle(i)} />}
                </React.Fragment>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
                color: '#ef4444',
                fontSize: '0.9rem',
              }}>
                {error}
              </div>
            )}

            {/* Step 0: Services */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Choose a Service</h2>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Select the service you'd like to book</p>
                <div style={gridStyle}>
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => setSelected(prev => ({ ...prev, service }))}
                      style={cardStyle(selected.service?.id === service.id)}
                      onMouseEnter={e => { if (selected.service?.id !== service.id) e.currentTarget.style.borderColor = '#4a5568'; }}
                      onMouseLeave={e => { if (selected.service?.id !== service.id) e.currentTarget.style.borderColor = '#2d3748'; }}
                    >
                      {selected.service?.id === service.id && (
                        <div style={selectedBadgeStyle}><Check size={14} /></div>
                      )}
                      <h3 style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '1.1rem' }}>{service.name}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cba363', fontWeight: 700, fontSize: '1.25rem' }}>
                          {settings.currency || '$'}{service.price}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} /> {service.duration} min
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Barbers */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Choose a Barber</h2>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Select your preferred barber</p>
                <div style={gridStyle}>
                  {barbers.map(barber => (
                    <div
                      key={barber.id}
                      onClick={() => setSelected(prev => ({ ...prev, barber, date: '', time: '' }))}
                      style={cardStyle(selected.barber?.id === barber.id)}
                      onMouseEnter={e => { if (selected.barber?.id !== barber.id) e.currentTarget.style.borderColor = '#4a5568'; }}
                      onMouseLeave={e => { if (selected.barber?.id !== barber.id) e.currentTarget.style.borderColor = '#2d3748'; }}
                    >
                      {selected.barber?.id === barber.id && (
                        <div style={selectedBadgeStyle}><Check size={14} /></div>
                      )}
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(203,163,99,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.75rem',
                        color: '#cba363',
                      }}>
                        <User size={28} />
                      </div>
                      <h3 style={{ margin: '0 0 0.35rem', fontWeight: 600, fontSize: '1.1rem' }}>{barber.name}</h3>
                      {barber.working_hours && (
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} /> {barber.working_hours}
                        </p>
                      )}
                      {barber.days_off && (
                        <p style={{ margin: '0.25rem 0 0', color: '#9ca3af', fontSize: '0.8rem' }}>
                          Off: {barber.days_off}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Date & Time</h2>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Choose when you'd like your appointment</p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Date</label>
                  <input
                    type="date"
                    value={selected.date}
                    min={getMinDate()}
                    max={getMaxDate()}
                    onChange={e => handleDateChange(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {selected.date && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                      Available Times for {formatDate(selected.date)}
                    </label>
                    {!availability ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                        <Clock size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '0.5rem' }} />
                        <p>Loading available times...</p>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                      </div>
                    ) : !availability.available ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p style={{ fontWeight: 500 }}>{availability.reason || 'No slots available'}</p>
                        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.5rem' }}>Please try another date</p>
                      </div>
                    ) : availability.slots.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.05)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <p style={{ fontWeight: 500 }}>All time slots are booked for this date</p>
                        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.5rem' }}>Please try another date</p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: '0.5rem',
                      }}>
                        {/* Show all slots - available ones from availability.slots, booked from booked_slots */}
                        {(() => {
                          const allSlots = [...new Set([...availability.slots, ...(availability.booked_slots || [])])].sort();
                          return allSlots.map(slot => {
                            const isAvailable = availability.slots.includes(slot);
                            const isSelected = selected.time === slot;
                            return (
                              <button
                                key={slot}
                                onClick={() => isAvailable && setSelected(prev => ({ ...prev, time: slot }))}
                                disabled={!isAvailable}
                                style={timeSlotStyle(isAvailable, isSelected)}
                                onMouseEnter={e => { if (isAvailable && !isSelected) { e.currentTarget.style.borderColor = '#cba363'; e.currentTarget.style.backgroundColor = 'rgba(203,163,99,0.05)'; } }}
                                onMouseLeave={e => { if (isAvailable && !isSelected) { e.currentTarget.style.borderColor = '#2d3748'; e.currentTarget.style.backgroundColor = '#1a1d24'; } }}
                              >
                                {slot}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Customer Info */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Your Information</h2>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Please provide your contact details</p>

                <div style={{ maxWidth: '500px' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={selected.customer_name}
                      onChange={e => setSelected(prev => ({ ...prev, customer_name: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#cba363'; e.target.style.boxShadow = '0 0 0 2px rgba(203,163,99,0.2)'; }}
                      onBlur={e => { e.target.style.borderColor = '#2d3748'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={selected.customer_phone}
                      onChange={e => setSelected(prev => ({ ...prev, customer_phone: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#cba363'; e.target.style.boxShadow = '0 0 0 2px rgba(203,163,99,0.2)'; }}
                      onBlur={e => { e.target.style.borderColor = '#2d3748'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Notes (optional)</label>
                    <textarea
                      placeholder="Any special requests or notes..."
                      value={selected.notes}
                      onChange={e => setSelected(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      onFocus={e => { e.target.style.borderColor = '#cba363'; e.target.style.boxShadow = '0 0 0 2px rgba(203,163,99,0.2)'; }}
                      onBlur={e => { e.target.style.borderColor = '#2d3748'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Confirm Your Booking</h2>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Please review your appointment details</p>

                <div style={{
                  backgroundColor: '#1a1d24',
                  border: '1px solid #2d3748',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  maxWidth: '500px',
                }}>
                  <div style={summaryRowStyle}>
                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Scissors size={16} /> Service</span>
                    <span style={{ fontWeight: 500 }}>{selected.service?.name}</span>
                  </div>
                  <div style={summaryRowStyle}>
                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> Barber</span>
                    <span style={{ fontWeight: 500 }}>{selected.barber?.name}</span>
                  </div>
                  <div style={summaryRowStyle}>
                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Date</span>
                    <span style={{ fontWeight: 500 }}>{formatDate(selected.date)}</span>
                  </div>
                  <div style={summaryRowStyle}>
                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Time</span>
                    <span style={{ fontWeight: 500 }}>{selected.time}</span>
                  </div>
                  <div style={summaryRowStyle}>
                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={16} /> Price</span>
                    <span style={{ fontWeight: 600, color: '#cba363', fontSize: '1.1rem' }}>{settings.currency || '$'}{selected.service?.price}</span>
                  </div>
                  <div style={summaryRowStyle}>
                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Duration</span>
                    <span style={{ fontWeight: 500 }}>{selected.service?.duration} min</span>
                  </div>
                  <div style={{ ...summaryRowStyle, borderBottom: 'none' }}>
                    <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> Name</span>
                    <span style={{ fontWeight: 500 }}>{selected.customer_name}</span>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginTop: '1.5rem',
                  maxWidth: '500px',
                  color: '#f59e0b',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}>
                  <strong>Note:</strong> Your booking request will be sent to the barber for confirmation. You'll be able to check the status of your booking using your phone number.
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: step === 0 ? 'flex-end' : 'space-between',
              marginTop: '2rem',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              {step > 0 && (
                <button onClick={() => { setStep(step - 1); setError(''); }} style={btnSecondaryStyle}>
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => { setStep(step + 1); setError(''); }}
                  disabled={!canProceed()}
                  style={{ ...btnPrimaryStyle, opacity: canProceed() ? 1 : 0.4, cursor: canProceed() ? 'pointer' : 'not-allowed' }}
                >
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ ...btnPrimaryStyle, opacity: submitting ? 0.6 : 1, backgroundColor: '#10b981' }}
                >
                  {submitting ? 'Submitting...' : 'Confirm Booking'} <CheckCircle size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '2rem' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: '#4b5563', textDecoration: 'none', fontSize: '0.85rem' }}>Admin Login</a>
      </div>
    </div>
  );
}
