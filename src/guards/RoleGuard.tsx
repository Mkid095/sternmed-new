import React, { ReactNode } from 'react';
import { User, Role } from '../types';

interface RoleGuardProps {
  children: ReactNode;
  user: User | null;
  allowedRoles?: Role[];
  requiredPermission?: string;
  fallback?: ReactNode;
}

export default function RoleGuard({
  children,
  user,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
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
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Role[],
  fallback?: ReactNode
) {
  return function RoleGuardedComponent(props: P & { user: User | null }) {
    const { user, ...rest } = props as P & { user: User | null };

    if (!user || !allowedRoles.includes(user.role)) {
      return <>{fallback}</>;
    }

    return <Component {...(rest as P)} />;
  };
}
