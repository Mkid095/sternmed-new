/**
 * useUsersManager Hook
 *
 * Custom hook for managing users page state and operations.
 * Handles data fetching and delete operations with toast notifications.
 *
 * @module useUsersManager
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';
import { User } from '../../../../types';
import { useToastError, useToastSuccess } from '../../../shared/ui';
import { ConfirmationModal, useConfirmationModal } from '../../../shared/ui';

/**
 * Return type for useUsersManager hook
 */
export interface UseUsersManagerReturn {
  /** All users */
  users: User[];

  /** Whether data is loading */
  loading: boolean;

  /** Handle delete user with confirmation */
  handleDelete: (id: string, name: string) => Promise<void>;

  /** Refresh users from API */
  refreshUsers: () => Promise<void>;

  /** Check if user can be deleted (last admin protection) */
  canDeleteUser: (user: User) => boolean;

  /** Props for delete confirmation modal */
  deleteModal: ReturnType<typeof useConfirmationModal>;
}

/**
 * Custom hook for users page management
 *
 * Provides state management for the users page:
 * - Fetches users from API
 * - Handles delete operations with admin protection
 * - Checks if user can be safely deleted
 * - Uses toast notifications for feedback
 *
 * @returns Users state and handlers
 *
 * @example
 * function AdminUsers() {
 *   const { users, loading, handleDelete, canDeleteUser, deleteModal } = useUsersManager();
 *
 *   return <UsersPage {...} />;
 * }
 */
export function useUsersManager(): UseUsersManagerReturn {
  // ============ State ============

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast notifications
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  // Delete confirmation modal
  const deleteModal = useConfirmationModal();

  // ============ Data Fetching ============

  /**
   * Fetch users from API
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Refresh users (alias for fetchUsers)
   */
  const refreshUsers = fetchUsers;

  // ============ CRUD Operations ============

  /**
   * Check if user can be deleted
   * Prevents deletion of the last admin user
   */
  const canDeleteUser = useCallback((user: User) => {
    // Count admin users
    const adminCount = users.filter((u) => u.role === 'admin').length;

    // Prevent deleting the last admin
    if (user.role === 'admin' && adminCount <= 1) {
      return false;
    }

    return true;
  }, [users]);

  /**
   * Handle delete user button click
   * Opens confirmation dialog or shows warning
   */
  const handleDelete = useCallback(async (id: string, name: string) => {
    const user = users.find((u) => u.id === id);

    if (!user) {
      console.error('User not found');
      return;
    }

    // Check if user can be deleted
    if (!canDeleteUser(user)) {
      showError('Cannot delete the last admin user.');
      return;
    }

    // Open confirmation modal
    deleteModal.open({
      title: 'Delete User',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.deleteUser(id);
          showSuccess('User deleted successfully');
          await fetchUsers();
        } catch (error) {
          console.error('Failed to delete user:', error);
          showError('Failed to delete user. Please try again.');
        }
      },
    });
  }, [users, canDeleteUser, deleteModal, showError, showSuccess, fetchUsers]);

  return {
    users,
    loading,
    handleDelete,
    refreshUsers,
    canDeleteUser,
    deleteModal,
  };
}
