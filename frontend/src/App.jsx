import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';

// Public & Auth Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';
import { AuthCallbackPage } from './pages/public/AuthCallbackPage';
import { CompleteProfilePage } from './pages/public/CompleteProfilePage';
import { UnauthorizedPage } from './pages/public/UnauthorizedPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Student Portal Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudyAssistantPage } from './pages/student/StudyAssistantPage';
import { StudyDocumentsPage } from './pages/student/StudyDocumentsPage';
import { DocumentDetailPage } from './pages/student/DocumentDetailPage';
import { StudyHistoryPage } from './pages/student/StudyHistoryPage';
import { StudentRequestsPage } from './pages/student/StudentRequestsPage';
import { NewRequestPage } from './pages/student/NewRequestPage';
import { RequestDetailPage } from './pages/student/RequestDetailPage';
import { AnnouncementsPage } from './pages/student/AnnouncementsPage';
import { AnnouncementDetailPage } from './pages/student/AnnouncementDetailPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentSettingsPage } from './pages/student/StudentSettingsPage';

// Staff Portal Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffRequestsPage } from './pages/staff/StaffRequestsPage';
import { StaffRequestDetailPage } from './pages/staff/StaffRequestDetailPage';
import { StaffAnnouncementsPage } from './pages/staff/StaffAnnouncementsPage';
import { StaffProfilePage } from './pages/staff/StaffProfilePage';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import './App.css';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* 1. Public & Authentication Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Direct convenience aliases */}
            <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/study" element={<Navigate to="/student/study" replace />} />
            <Route path="/documents" element={<Navigate to="/student/study/documents" replace />} />
            <Route path="/requests" element={<Navigate to="/student/requests" replace />} />
            <Route path="/announcements" element={<Navigate to="/student/announcements" replace />} />

            {/* 2. Protected Student Portal Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['student', 'admin']}>
                    <AppShell />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="study" element={<StudyAssistantPage />} />
              <Route path="assistant" element={<Navigate to="/student/study" replace />} />
              <Route path="chat" element={<Navigate to="/student/study" replace />} />
              <Route path="study/documents" element={<StudyDocumentsPage />} />
              <Route path="documents" element={<Navigate to="/student/study/documents" replace />} />
              <Route path="study/documents/:documentId" element={<DocumentDetailPage />} />
              <Route path="study/history" element={<StudyHistoryPage />} />
              <Route path="history" element={<Navigate to="/student/study/history" replace />} />
              <Route path="requests" element={<StudentRequestsPage />} />
              <Route path="requests/new" element={<NewRequestPage />} />
              <Route path="requests/:requestId" element={<RequestDetailPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="announcements/:announcementId" element={<AnnouncementDetailPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="settings" element={<StudentSettingsPage />} />
            </Route>

            {/* 3. Protected Faculty & Staff Portal Routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['staff', 'admin']}>
                    <AppShell />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="requests" element={<StaffRequestsPage />} />
              <Route path="requests/:requestId" element={<StaffRequestDetailPage />} />
              <Route path="announcements" element={<StaffAnnouncementsPage />} />
              <Route path="profile" element={<StaffProfilePage />} />
            </Route>

            {/* 4. Protected College Administrator Portal Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <AppShell />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="departments" element={<AdminDepartmentsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="requests" element={<AdminRequestsPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* 5. Catch-All Route (Friendly Not-Found Page) */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
