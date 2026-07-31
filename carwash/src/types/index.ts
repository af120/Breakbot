// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// User & Auth
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  phone?: string;
  email?: string;
  active: boolean;
  force_password_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Customer
export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  preferred_language: 'ku' | 'ar' | 'en';
  notes?: string;
  marketing_consent: boolean;
  total_visits: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  last_visit?: string;
}

// Vehicle
export type VehicleType = 'sedan' | 'SUV' | 'pickup' | 'taxi' | 'minibus' | 'motorcycle' | 'other';

export interface Vehicle {
  id: string;
  customer_id: string;
  type: VehicleType;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  plate_number?: string;
  notes?: string;
  total_visits: number;
  last_service?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer; // populated on queries
}

// Service
export type ServiceCategory = 'quick_wash' | 'exterior_wash' | 'interior_exterior' | 'interior_cleaning' | 'deep_interior' | 'seat_cleaning' | 'carpet_cleaning' | 'engine_cleaning' | 'waxing' | 'polishing' | 'headlight_polishing' | 'full_detailing' | 'addons' | 'other';

export interface Service {
  id: string;
  name_ku: string;
  name_ar?: string;
  name_en?: string;
  description_ku?: string;
  description_ar?: string;
  description_en?: string;
  category: ServiceCategory;
  base_duration: number;
  image_url?: string;
  active: boolean;
  public_visible: boolean;
  display_order: number;
  prices?: ServicePrice[];
  created_at: string;
  updated_at: string;
}

export interface ServicePrice {
  id: string;
  service_id: string;
  vehicle_type: VehicleType;
  price: number;
}

// Employee
export type EmployeeStatus = 'available' | 'assigned' | 'on_break' | 'absent' | 'off_duty';

export interface Employee {
  id: string;
  user_id?: string;
  name: string;
  phone?: string;
  profile_image?: string;
  active: boolean;
  status: EmployeeStatus;
  working_days?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  break_start?: string;
  break_end?: string;
  skills?: string;
  completed_jobs: number;
  total_revenue: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Washing Bay
export type BayStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance' | 'closed';

export interface WashingBay {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  status: BayStatus;
  supported_vehicle_types?: string;
  current_vehicle_id?: string;
  current_appointment_id?: string;
  maintenance_note?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  current_appointment?: Appointment;
}

export interface BayBlock {
  id: string;
  bay_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_by?: string;
  created_at: string;
}

// Appointment
export type AppointmentStatus = 'pending' | 'confirmed' | 'alternative_suggested' | 'arrived' | 'waiting' | 'washing' | 'interior_cleaning' | 'drying' | 'ready' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentSource = 'website' | 'phone' | 'whatsapp' | 'walk_in' | 'admin' | 'other';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | 'cancelled';

export interface Appointment {
  id: string;
  booking_ref: string;
  customer_id: string;
  vehicle_id: string;
  requested_date: string;
  requested_time: string;
  confirmed_time?: string;
  bay_id?: string;
  source: AppointmentSource;
  status: AppointmentStatus;
  customer_note?: string;
  internal_note?: string;
  preferred_language: 'ku' | 'ar' | 'en';
  cancellation_reason?: string;
  payment_status: PaymentStatus;
  estimated_duration: number;
  estimated_total: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Populated
  customer?: Customer;
  vehicle?: Vehicle;
  services?: AppointmentService[];
  bay?: WashingBay;
  employees?: Employee[];
  payments?: Payment[];
  status_history?: AppointmentStatusHistory[];
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  service_name_snapshot: string;
  price_snapshot: number;
  duration_snapshot: number;
  vehicle_type: VehicleType;
}

export interface AppointmentStatusHistory {
  id: string;
  appointment_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  changed_at: string;
  note?: string;
}

// Payment
export type PaymentMethod = 'cash' | 'card' | 'zaincash' | 'qi' | 'bank_transfer' | 'mixed' | 'other';

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  recorded_by?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

// Expense
export type ExpenseCategory = 'rent' | 'electricity' | 'water' | 'cleaning_products' | 'chemicals' | 'equipment' | 'maintenance' | 'salaries' | 'marketing' | 'fuel' | 'internet' | 'other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  supplier?: string;
  reference_number?: string;
  note?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
}

// Gallery
export type GalleryCategory = 'exterior_cleaning' | 'interior_cleaning' | 'detailing' | 'polishing' | 'before_after' | 'facilities' | 'equipment' | 'staff' | 'other';

export interface GalleryItem {
  id: string;
  image_url: string;
  title_ku?: string;
  title_ar?: string;
  title_en?: string;
  caption_ku?: string;
  caption_ar?: string;
  caption_en?: string;
  category?: GalleryCategory;
  alt_text?: string;
  featured: boolean;
  public_visible: boolean;
  display_order: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// Testimonial
export interface Testimonial {
  id: string;
  customer_name: string;
  rating?: number;
  comment: string;
  language: 'ku' | 'ar' | 'en';
  public_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Settings
export interface BusinessSettings {
  [key: string]: string;
}

// Website Content
export interface WebsiteContent {
  key: string;
  value_ku?: string;
  value_ar?: string;
  value_en?: string;
  updated_at?: string;
  updated_by?: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  action: string;
  user_id?: string;
  user_name?: string;
  record_type?: string;
  record_id?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  created_at: string;
}

// Notification Log
export interface NotificationLog {
  id: string;
  appointment_id?: string;
  customer_id?: string;
  template: string;
  channel: string;
  sent_by?: string;
  message_preview?: string;
  sent_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  pending: number;
  confirmed: number;
  arrived: number;
  waiting: number;
  washing: number;
  drying: number;
  ready: number;
  completed: number;
  cancelled: number;
  no_show: number;
  total_bays: number;
  available_bays: number;
  occupied_bays: number;
  maintenance_bays: number;
  active_employees: number;
  today_income: number;
  today_expenses: number;
  today_net: number;
  outstanding_payments: number;
  recent_payments: Payment[];
  upcoming_appointments: Appointment[];
}

// Report Data
export interface ReportSummary {
  gross_income: number;
  total_expenses: number;
  net_income: number;
  total_vehicles: number;
  cancelled: number;
  no_shows: number;
  pending_payments: number;
  average_transaction: number;
  new_customers: number;
  returning_customers: number;
  online_bookings: number;
  walk_ins: number;
}

export interface ReportByService {
  service_name: string;
  count: number;
  revenue: number;
}

export interface ReportByVehicleType {
  vehicle_type: string;
  count: number;
  revenue: number;
}

export interface ReportByEmployee {
  employee_name: string;
  count: number;
  revenue: number;
}

// Booking Form Data
export interface BookingFormData {
  // Step 1: Vehicle
  vehicle_type: VehicleType;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_plate: string;
  // Step 2: Services
  selected_services: string[]; // service IDs
  // Step 3: Date/Time
  date: string;
  time: string;
  // Step 4: Customer Info
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  customer_email: string;
  customer_note: string;
  preferred_language: 'ku' | 'ar' | 'en';
  privacy_accepted: boolean;
}

// Time Slot
export interface TimeSlot {
  time: string;
  available: boolean;
}

// Opening Hours
export interface DayHours {
  open: string;
  close: string;
}

export interface OpeningHours {
  [day: string]: DayHours;
}
