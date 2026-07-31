import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/index.css';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import ServicesPage from './pages/public/ServicesPage';
import BookingPage from './pages/public/BookingPage';
import GalleryPage from './pages/public/GalleryPage';
import AboutPage from './pages/public/AboutPage';
import LocationPage from './pages/public/LocationPage';
import BookingStatusPage from './pages/public/BookingStatusPage';
import PrivacyPage from './pages/public/PrivacyPage';

// Admin Pages
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import AppointmentDetailPage from './pages/admin/AppointmentDetailPage';
import QueuePage from './pages/admin/QueuePage';
import BaysPage from './pages/admin/BaysPage';
import CustomersPage from './pages/admin/CustomersPage';
import VehiclesPage from './pages/admin/VehiclesPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import ServicesManagePage from './pages/admin/ServicesManagePage';
import PaymentsPage from './pages/admin/PaymentsPage';
import ExpensesPage from './pages/admin/ExpensesPage';
import ReportsPage from './pages/admin/ReportsPage';
import GalleryManagePage from './pages/admin/GalleryManagePage';
import TestimonialsPage from './pages/admin/TestimonialsPage';
import SettingsPage from './pages/admin/SettingsPage';
import ContentPage from './pages/admin/ContentPage';
import UsersPage from './pages/admin/UsersPage';
import AuditPage from './pages/admin/AuditPage';
import BackupPage from './pages/admin/BackupPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/*" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="book" element={<BookingPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="location" element={<LocationPage />} />
              <Route path="booking-status" element={<BookingStatusPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
            </Route>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/*" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="appointments/:id" element={<AppointmentDetailPage />} />
              <Route path="queue" element={<QueuePage />} />
              <Route path="bays" element={<BaysPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="services" element={<ServicesManagePage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="gallery" element={<GalleryManagePage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="backup" element={<BackupPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
