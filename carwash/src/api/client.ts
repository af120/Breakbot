const API_BASE = import.meta.env.VITE_API_URL || '';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/admin/login';
      throw new Error('Session expired');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  async uploadFile(endpoint: string, file: File, fields: Record<string, string> = {}): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  // Auth
  login(username: string, password: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  }

  getMe() {
    return this.request<{ success: boolean; data: any }>('/api/auth/me');
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.request('/api/auth/change-password', {
      method: 'PUT',
      body: { old_password: oldPassword, new_password: newPassword },
    });
  }

  // Public endpoints
  getPublicSettings() {
    return this.request<{ success: boolean; data: any }>('/api/public/settings');
  }

  getPublicServices() {
    return this.request<{ success: boolean; data: any[] }>('/api/public/services');
  }

  getPublicContent() {
    return this.request<{ success: boolean; data: any }>('/api/public/content');
  }

  getPublicGallery() {
    return this.request<{ success: boolean; data: any[] }>('/api/public/gallery');
  }

  getPublicTestimonials() {
    return this.request<{ success: boolean; data: any[] }>('/api/public/testimonials');
  }

  getAvailability(date: string, serviceId?: string, vehicleType?: string) {
    const params = new URLSearchParams({ date });
    if (serviceId) params.set('service_id', serviceId);
    if (vehicleType) params.set('vehicle_type', vehicleType);
    return this.request<{ success: boolean; data: any[] }>(`/api/public/availability?${params}`);
  }

  submitBooking(data: any) {
    return this.request<{ success: boolean; data: any }>('/api/public/book', {
      method: 'POST',
      body: data,
    });
  }

  checkBookingStatus(ref: string, phone: string) {
    return this.request<{ success: boolean; data: any }>(`/api/public/booking-status?ref=${encodeURIComponent(ref)}&phone=${encodeURIComponent(phone)}`);
  }

  // Admin endpoints
  getDashboardStats() {
    return this.request<{ success: boolean; data: any }>('/api/appointments/dashboard-stats');
  }

  getAppointments(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/appointments?${query}`);
  }

  getAppointment(id: string) {
    return this.request<{ success: boolean; data: any }>(`/api/appointments/${id}`);
  }

  getTodayAppointments() {
    return this.request<{ success: boolean; data: any[] }>('/api/appointments/today');
  }

  getQueue() {
    return this.request<{ success: boolean; data: any[] }>('/api/appointments/queue');
  }

  createAppointment(data: any) {
    return this.request<{ success: boolean; data: any }>('/api/appointments', { method: 'POST', body: data });
  }

  updateAppointment(id: string, data: any) {
    return this.request('/api/appointments/' + id, { method: 'PUT', body: data });
  }

  updateAppointmentStatus(id: string, status: string, note?: string) {
    return this.request(`/api/appointments/${id}/status`, { method: 'PUT', body: { status, note } });
  }

  confirmAppointment(id: string, confirmedTime?: string) {
    return this.request(`/api/appointments/${id}/confirm`, { method: 'PUT', body: { confirmed_time: confirmedTime } });
  }

  assignBay(id: string, bayId: string) {
    return this.request(`/api/appointments/${id}/assign-bay`, { method: 'PUT', body: { bay_id: bayId } });
  }

  assignEmployee(id: string, employeeId: string) {
    return this.request(`/api/appointments/${id}/assign-employee`, { method: 'PUT', body: { employee_id: employeeId } });
  }

  cancelAppointment(id: string, reason: string) {
    return this.request(`/api/appointments/${id}`, { method: 'DELETE', body: { reason } });
  }

  // Services
  getServices() {
    return this.request<{ success: boolean; data: any[] }>('/api/services');
  }

  getService(id: string) {
    return this.request<{ success: boolean; data: any }>(`/api/services/${id}`);
  }

  createService(data: any) {
    return this.request('/api/services', { method: 'POST', body: data });
  }

  updateService(id: string, data: any) {
    return this.request(`/api/services/${id}`, { method: 'PUT', body: data });
  }

  updateServicePrices(id: string, prices: any[]) {
    return this.request(`/api/services/${id}/prices`, { method: 'PUT', body: { prices } });
  }

  deleteService(id: string) {
    return this.request(`/api/services/${id}`, { method: 'DELETE' });
  }

  // Customers
  getCustomers(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/customers?${query}`);
  }

  getCustomer(id: string) {
    return this.request<{ success: boolean; data: any }>(`/api/customers/${id}`);
  }

  createCustomer(data: any) {
    return this.request('/api/customers', { method: 'POST', body: data });
  }

  updateCustomer(id: string, data: any) {
    return this.request(`/api/customers/${id}`, { method: 'PUT', body: data });
  }

  searchCustomers(query: string) {
    return this.request<{ success: boolean; data: any[] }>(`/api/customers/search?q=${encodeURIComponent(query)}`);
  }

  // Vehicles
  getVehicles(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/vehicles?${query}`);
  }

  getVehicle(id: string) {
    return this.request<{ success: boolean; data: any }>(`/api/vehicles/${id}`);
  }

  createVehicle(data: any) {
    return this.request('/api/vehicles', { method: 'POST', body: data });
  }

  updateVehicle(id: string, data: any) {
    return this.request(`/api/vehicles/${id}`, { method: 'PUT', body: data });
  }

  // Employees
  getEmployees() {
    return this.request<{ success: boolean; data: any[] }>('/api/employees');
  }

  getEmployee(id: string) {
    return this.request<{ success: boolean; data: any }>(`/api/employees/${id}`);
  }

  createEmployee(data: any) {
    return this.request('/api/employees', { method: 'POST', body: data });
  }

  updateEmployee(id: string, data: any) {
    return this.request(`/api/employees/${id}`, { method: 'PUT', body: data });
  }

  updateEmployeeStatus(id: string, status: string) {
    return this.request(`/api/employees/${id}/status`, { method: 'PUT', body: { status } });
  }

  // Bays
  getBays() {
    return this.request<{ success: boolean; data: any[] }>('/api/bays');
  }

  getBay(id: string) {
    return this.request<{ success: boolean; data: any }>(`/api/bays/${id}`);
  }

  createBay(data: any) {
    return this.request('/api/bays', { method: 'POST', body: data });
  }

  updateBay(id: string, data: any) {
    return this.request(`/api/bays/${id}`, { method: 'PUT', body: data });
  }

  updateBayStatus(id: string, status: string, note?: string) {
    return this.request(`/api/bays/${id}/status`, { method: 'PUT', body: { status, note } });
  }

  // Payments
  recordPayment(data: any) {
    return this.request('/api/payments', { method: 'POST', body: data });
  }

  getPayments(appointmentId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/api/payments/${appointmentId}`);
  }

  getReceiptData(appointmentId: string) {
    return this.request<{ success: boolean; data: any }>(`/api/payments/receipt/${appointmentId}`);
  }

  // Expenses
  getExpenses(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/expenses?${query}`);
  }

  createExpense(data: any) {
    return this.request('/api/expenses', { method: 'POST', body: data });
  }

  updateExpense(id: string, data: any) {
    return this.request(`/api/expenses/${id}`, { method: 'PUT', body: data });
  }

  deleteExpense(id: string) {
    return this.request(`/api/expenses/${id}`, { method: 'DELETE' });
  }

  // Gallery
  getGallery() {
    return this.request<{ success: boolean; data: any[] }>('/api/gallery');
  }

  createGalleryItem(data: any) {
    return this.request('/api/gallery', { method: 'POST', body: data });
  }

  updateGalleryItem(id: string, data: any) {
    return this.request(`/api/gallery/${id}`, { method: 'PUT', body: data });
  }

  deleteGalleryItem(id: string) {
    return this.request(`/api/gallery/${id}`, { method: 'DELETE' });
  }

  uploadGalleryImage(file: File, fields: Record<string, string> = {}) {
    return this.uploadFile('/api/gallery/upload', file, fields);
  }

  // Testimonials
  getTestimonials() {
    return this.request<{ success: boolean; data: any[] }>('/api/testimonials');
  }

  createTestimonial(data: any) {
    return this.request('/api/testimonials', { method: 'POST', body: data });
  }

  updateTestimonial(id: string, data: any) {
    return this.request(`/api/testimonials/${id}`, { method: 'PUT', body: data });
  }

  deleteTestimonial(id: string) {
    return this.request(`/api/testimonials/${id}`, { method: 'DELETE' });
  }

  // Settings
  getSettings() {
    return this.request<{ success: boolean; data: any }>('/api/settings');
  }

  updateSettings(data: Record<string, string>) {
    return this.request('/api/settings', { method: 'PUT', body: data });
  }

  // Content
  getContent() {
    return this.request<{ success: boolean; data: any[] }>('/api/content');
  }

  updateContent(data: any[]) {
    return this.request('/api/content', { method: 'PUT', body: data });
  }

  // Users
  getUsers() {
    return this.request<{ success: boolean; data: any[] }>('/api/auth/users');
  }

  createUser(data: any) {
    return this.request('/api/auth/users', { method: 'POST', body: data });
  }

  updateUser(id: string, data: any) {
    return this.request(`/api/auth/users/${id}`, { method: 'PUT', body: data });
  }

  deleteUser(id: string) {
    return this.request(`/api/auth/users/${id}`, { method: 'DELETE' });
  }

  // Reports
  getReportSummary(from: string, to: string) {
    return this.request<{ success: boolean; data: any }>(`/api/reports/summary?from=${from}&to=${to}`);
  }

  getReportIncome(from: string, to: string) {
    return this.request<{ success: boolean; data: any }>(`/api/reports/income?from=${from}&to=${to}`);
  }

  getReportExpenses(from: string, to: string) {
    return this.request<{ success: boolean; data: any }>(`/api/reports/expenses?from=${from}&to=${to}`);
  }

  getReportByService(from: string, to: string) {
    return this.request<{ success: boolean; data: any[] }>(`/api/reports/services?from=${from}&to=${to}`);
  }

  getReportByVehicle(from: string, to: string) {
    return this.request<{ success: boolean; data: any[] }>(`/api/reports/vehicles?from=${from}&to=${to}`);
  }

  getReportByEmployee(from: string, to: string) {
    return this.request<{ success: boolean; data: any[] }>(`/api/reports/employees?from=${from}&to=${to}`);
  }

  exportReport(from: string, to: string, type: string) {
    return this.request<{ success: boolean; data: string }>(`/api/reports/export?from=${from}&to=${to}&type=${type}`);
  }

  // Audit
  getAuditLogs(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/audit?${query}`);
  }

  // Backup
  exportBackup() {
    return this.request<{ success: boolean; data: any }>('/api/backup/export');
  }

  importBackup(data: any) {
    return this.request('/api/backup/import', { method: 'POST', body: data });
  }

  clearDemoData() {
    return this.request('/api/backup/clear-demo', { method: 'POST' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
