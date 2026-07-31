import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../contexts/LanguageContext';
import { apiClient } from '../../api/client';

export default function BookingPage() {
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState({ type: '', brand: '', plate: '', color: '', model: '' });
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', whatsapp: false, note: '' });
  
  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);
  
  const submitBooking = async () => {
    setLoading(true);
    try {
      await apiClient.submitBooking({ vehicle, customer });
      setStep(6);
    } catch (e) {
      alert("Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-content">
      <h2>{t('nav.book')}</h2>
      <div className="booking-wizard">
        {step === 1 && (
          <div className="form-step">
            <h3>1. Vehicle Information</h3>
            <input placeholder="Vehicle Type (required)" value={vehicle.type} onChange={e => setVehicle({...vehicle, type: e.target.value})} required />
            <input placeholder="Brand" value={vehicle.brand} onChange={e => setVehicle({...vehicle, brand: e.target.value})} />
            <input placeholder="Model" value={vehicle.model} onChange={e => setVehicle({...vehicle, model: e.target.value})} />
            <input placeholder="Color" value={vehicle.color} onChange={e => setVehicle({...vehicle, color: e.target.value})} />
            <input placeholder="Plate Number" value={vehicle.plate} onChange={e => setVehicle({...vehicle, plate: e.target.value})} />
            <div className="step-actions">
              <button onClick={handleNext} className="btn btn-primary" disabled={!vehicle.type}>Next</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="form-step">
            <h3>2. Service Selection</h3>
            <p>Select the services you need.</p>
            <div className="step-actions">
              <button onClick={handleBack} className="btn btn-outline">Back</button>
              <button onClick={handleNext} className="btn btn-primary">Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="form-step">
            <h3>3. Date & Time</h3>
            <p>Select your preferred slot.</p>
            <div className="step-actions">
              <button onClick={handleBack} className="btn btn-outline">Back</button>
              <button onClick={handleNext} className="btn btn-primary">Next</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="form-step">
            <h3>4. Customer Information</h3>
            <input placeholder="Name (required)" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} required />
            <input placeholder="Phone (required)" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} required />
            <input placeholder="Email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
            <textarea placeholder="Notes" value={customer.note} onChange={e => setCustomer({...customer, note: e.target.value})} />
            <label>
              <input type="checkbox" checked={customer.whatsapp} onChange={e => setCustomer({...customer, whatsapp: e.target.checked})} />
              I use WhatsApp on this number
            </label>
            <div className="step-actions">
              <button onClick={handleBack} className="btn btn-outline">Back</button>
              <button onClick={handleNext} className="btn btn-primary" disabled={!customer.name || !customer.phone}>Next</button>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="form-step">
            <h3>5. Review Booking</h3>
            <p>Vehicle: {vehicle.type} - {vehicle.brand}</p>
            <p>Customer: {customer.name} - {customer.phone}</p>
            <div className="step-actions">
              <button onClick={handleBack} className="btn btn-outline">Back</button>
              <button onClick={submitBooking} className="btn btn-primary" disabled={loading}>Confirm Booking</button>
            </div>
          </div>
        )}
        {step === 6 && (
          <div className="form-step">
            <h3>Booking Confirmed</h3>
            <p>Your booking has been received. You will get a confirmation message soon.</p>
            <div className="step-actions">
              <Link to="/" className="btn btn-primary">Back to Home</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
