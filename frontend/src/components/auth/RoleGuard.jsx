import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CardSkeleton } from '../common/LoadingSkeleton';

export function RoleGuard({ allowedRoles = [], children }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <CardSkeleton />
      </div>
    );
  }

  const hasAccess = Array.isArray(allowedRoles)
    ? allowedRoles.includes(role)
    : allowedRoles === role;

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
}
