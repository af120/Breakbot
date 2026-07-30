const BASE_URL = import.meta.env.VITE_API_URL || 'https://barbershop-api.af120-barbershop.workers.dev/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: getHeaders()
  });
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
    }
    let err = 'API error';
    try {
      const data = await response.json();
      err = data.error || err;
    } catch(e) {}
    throw new Error(err);
  }
  return response.json();
}

export default {
  login: (credentials) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  
  getDashboard: () => fetchAPI('/dashboard'),
  
  getBarbers: () => fetchAPI('/barbers'),
  createBarber: (data) => fetchAPI('/barbers', { method: 'POST', body: JSON.stringify(data) }),
  updateBarber: (id, data) => fetchAPI(`/barbers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBarber: (id) => fetchAPI(`/barbers/${id}`, { method: 'DELETE' }),

  getServices: () => fetchAPI('/services'),
  createService: (data) => fetchAPI('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => fetchAPI(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => fetchAPI(`/services/${id}`, { method: 'DELETE' }),

  getCustomers: () => fetchAPI('/customers'),
  createCustomer: (data) => fetchAPI('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => fetchAPI(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => fetchAPI(`/customers/${id}`, { method: 'DELETE' }),

  getAppointments: (params) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/appointments${q ? `?${q}` : ''}`);
  },
  createAppointment: (data) => fetchAPI('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id, data) => fetchAPI(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id, status) => fetchAPI(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  
  getQueue: () => fetchAPI('/queue'),
  
  getPayments: () => fetchAPI('/payments'),
  createPayment: (data) => fetchAPI('/payments', { method: 'POST', body: JSON.stringify(data) }),
  
  getExpenses: () => fetchAPI('/expenses'),
  createExpense: (data) => fetchAPI('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  
  getSettings: () => fetchAPI('/settings'),
  updateSettings: (data) => fetchAPI('/settings', { method: 'POST', body: JSON.stringify(data) }),

  getBookingRequests: () => fetchAPI('/booking-requests'),
  acceptBookingRequest: (id) => fetchAPI(`/booking-requests/${id}/accept`, { method: 'PUT' }),
  rejectBookingRequest: (id) => fetchAPI(`/booking-requests/${id}/reject`, { method: 'PUT' }),
};
