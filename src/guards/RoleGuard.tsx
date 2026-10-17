import React, { ReactNode } from 'react';
import { User, Role } from '../types';
import { useAuthStore } from '../store/authStore';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: Role[];
  requiredPermission?: string;
  fallback?: ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  // Get user from authStore instead of requiring it as a prop
  const user = useAuthStore((state) => state.user);
  // If no user, don't render
  if (!user) {
    return <>{fallback}</>;
  }

  // If allowedRoles specified, check if user's role is included
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Higher-order component version for convenience

