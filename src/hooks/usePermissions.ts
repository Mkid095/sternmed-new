import { User, Role } from '../types';

type Permission =
  | 'products:read'
  | 'products:write'
  | 'categories:read'
  | 'categories:write'
  | 'banners:read'
  | 'banners:write'
  | 'emails:read'
  | 'emails:write'
  | 'users:read'
  | 'users:write'
  | 'settings:read'
  | 'settings:write';

// Define permissions for each role
const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'products:read',
    'products:write',
    'categories:read',
    'categories:write',
    'banners:read',
    'banners:write',
    'emails:read',
    'emails:write',
    'users:read',
    'users:write',
    'settings:read',
    'settings:write',
  ],
  staff: [
    'products:read',
    'products:write',
    'categories:read',
    'banners:read',
    'emails:read',
    'emails:write',
    'settings:read',
  ],
  email_user: [] as Permission[], // Email users have no admin permissions
};

export function usePermissions(user: User | null) {
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every((permission) => hasPermission(permission));
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isStaff = (): boolean => {
    return user?.role === 'staff';
  };

  const canManageUsers = (): boolean => {
    return hasPermission('users:write');
  };

  const canManageProducts = (): boolean => {
    return hasPermission('products:write');
  };

  const canManageCategories = (): boolean => {
    return hasPermission('categories:write');
  };

  const canManageBanners = (): boolean => {
    return hasPermission('banners:write');
  };

  const canManageSettings = (): boolean => {
    return hasPermission('settings:write');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isStaff,
    canManageUsers,
    canManageProducts,
    canManageCategories,
    canManageBanners,
    canManageSettings,
  };
}

export default usePermissions;
