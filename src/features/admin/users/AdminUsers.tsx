/**
 * Admin Users Page
 *
 * Main user management interface for administrators.
 * Features include:
 * - User listing with role badges
 * - Add new users (admin and staff)
 * - Edit user roles
 * - Delete users (with last admin protection)
 * - Role display (admin/staff)
 *
 * @module AdminUsers
 */

import { useState, useEffect, useMemo, FormEvent, type Key } from 'react';
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Crown,
  UserCircle,
  X,
  Filter
} from 'lucide-react';
import { User } from '../../../types';
import { api } from '../../../services/api';
import { ConfirmationModal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';

/**
 * Admin Users Page Component
 *
 * Provides comprehensive user management with mobile-first design.
 *
 * @example
 * <Route path="/admin/users" element={<AdminUsers />} />
 */
export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
  });

  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmModal = useConfirmationModal();

  const fetchData = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const staffCount = users.filter((u) => u.role === 'staff').length;

  const canDeleteUser = (user: User) => {
    if (user.role === 'admin' && adminCount <= 1) {
      return false;
    }
    return true;
  };

  const openAddForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'staff' });
    setEditingUser(null);
    setIsAdding(true);
  };

  const openEditForm = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setEditingUser(user);
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'staff' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // For editing, only update role if changed
        if (formData.role !== editingUser.role) {
          await api.updateUserRole(editingUser.id, formData.role);
          showSuccess(`User role updated to ${formData.role}`);
        }
      } else {
        // Create new user
        await api.register(formData.email, formData.password, formData.name, formData.role);
        showSuccess(`User added successfully as ${formData.role}`);
      }

      closeForm();
      fetchData();
    } catch (error: any) {
      console.error('Failed to save user', error);
      showError(error.message || (editingUser ? 'Failed to update user' : 'Failed to add user'));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const user = users.find((u) => u.id === id);
    if (!user || !canDeleteUser(user)) {
      showError('Cannot delete the last admin user');
      return;
    }

    const confirmed = await confirmModal.confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await api.deleteUser(id);
        showSuccess('User deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Failed to delete user', error);
        showError('Failed to delete user');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Shield size={28} className="text-primary-600" />
              Users & Roles
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Manage admin and staff user accounts
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
            <Crown size={18} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-700">{adminCount} Admin</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <UserCircle size={18} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">{staffCount} Staff</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className={`sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              roleFilter !== 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            <Filter size={20} />
            Filters
          </button>

          <div className="hidden sm:block relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="staff">Staff</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ⌄
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {mobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden flex flex-col max-h-[70vh] animate-slide-up">
            <div className="flex justify-center pt-3 pb-1 bg-white rounded-t-2xl">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Filter size={20} />
                Filters
              </h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white px-4 py-4 pb-20 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <div className="space-y-2">
                  {['all', 'admin', 'staff'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setRoleFilter(filter as any);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${
                        roleFilter === filter
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="capitalize">{filter === 'all' ? 'All Roles' : filter + 's'}</span>
                      {roleFilter === filter && <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit User Modal */}
      {isAdding && (
        <UserFormModal
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isEditing={!!editingUser}
        />
      )}

      {/* Users Display */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No users found</h3>
          <p className="text-slate-500 mb-4">
            {search || roleFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first user to get started'}
          </p>
          {!search && roleFilter === 'all' && (
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
            >
              <Plus size={20} />
              Add Your First User
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View - 1 column */}
          <div className="sm:hidden space-y-3">
            {filteredUsers.map((user) => (
              <UserCompactCard
                key={user.id}
                user={user}
                onEdit={openEditForm}
                onDelete={handleDelete}
                canDelete={canDeleteUser(user)}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    onEdit={openEditForm}
                    onDelete={handleDelete}
                    canDelete={canDeleteUser(user)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={openAddForm}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal {...confirmModal.props} />
    </div>
  );
}

/**
 * User Compact Card (Mobile)
 */
interface UserCardProps {
  key?: Key;
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: string, name: string) => Promise<void>;
  canDelete: boolean;
}

function UserCompactCard({ user, onEdit, onDelete, canDelete }: UserCardProps) {
  const isAdmin = user.role === 'admin';

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${isAdmin ? 'border-purple-200' : 'border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 flex items-center gap-3 ${isAdmin ? 'bg-purple-50' : 'bg-slate-50'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
          isAdmin ? 'bg-purple-600' : 'bg-emerald-600'
        }`}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{user.name}</h3>
          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
            <Mail size={12} />
            {user.email}
          </p>
        </div>
        {isAdmin && (
          <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
            <Crown size={14} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 flex gap-2">
        <button
          onClick={() => onEdit(user)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Edit size={14} />
          Edit
        </button>
        <button
          onClick={() => onDelete(user.id, user.name)}
          disabled={!canDelete}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}

/**
 * User Table Row (Desktop)
 */
function UserTableRow({ user, onEdit, onDelete, canDelete }: UserCardProps) {
  const isAdmin = user.role === 'admin';

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
            isAdmin ? 'bg-purple-600' : 'bg-emerald-600'
          }`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="font-medium text-slate-900">{user.name}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600">{user.email}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
            isAdmin
              ? 'bg-purple-100 text-purple-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isAdmin ? <Crown size={12} /> : <UserCircle size={12} />}
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => onEdit(user)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit user"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(user.id, user.name)}
            disabled={!canDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={canDelete ? 'Delete user' : 'Cannot delete the last admin'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * User Form Modal
 */
interface UserFormModalProps {
  key?: Key;
  formData: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'staff';
  };
  onChange: (data: any) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  isEditing: boolean;
}

function UserFormModal({ formData, onChange, onSubmit, onClose, isEditing }: UserFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 space-y-4 pb-24 sm:pb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => onChange({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => onChange({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password {!isEditing && '*'}
              </label>
              <input
                type="password"
                required={!isEditing}
                value={formData.password}
                onChange={(e) => onChange({ ...formData, password: e.target.value })}
                placeholder={isEditing ? 'Leave empty to keep current' : '••••••••'}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {isEditing && (
                <p className="text-xs text-slate-400 mt-1">Leave empty to keep current password</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, role: 'admin' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                    formData.role === 'admin'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Crown size={18} />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, role: 'staff' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                    formData.role === 'staff'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <UserCircle size={18} />
                  <span>Staff</span>
                </button>
              </div>
            </div>

            {!isEditing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The user will receive an email to set their password.
                </p>
              </div>
            )}

            {isEditing && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Edit Mode:</strong> You can only change the user's role. Other details cannot be modified.
                </p>
              </div>
            )}
          </div>

          {/* Footer - INSIDE form */}
          <div className="flex gap-3 p-4 border-t border-slate-200 bg-white sm:bg-slate-50 pb-20 sm:pb-4 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
            >
              {isEditing ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
