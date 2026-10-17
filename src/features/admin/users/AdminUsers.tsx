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
 * The add/edit user dialog was the last hand-rolled modal here and now uses the
 * shared Radix-backed Modal, which brings a focus trap, Escape handling,
 * role="dialog", focus on open and restore on close, and a viewport height cap.
 * The mobile filter sheet below the header is a drawer, not a dialog, and is
 * deliberately left as it is.
 *
 * @module AdminUsers
 */

import { useState, useEffect, useMemo, useId, FormEvent, type Key } from 'react';
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
import { UserFormModal, type UserFormData } from './components/UserFormModal';
import { serialisePermissions } from '../permissions';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { ConfirmationModal, Modal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';

/** Minimum password length (mirrors Firebase Auth's floor) */
const MIN_PASSWORD_LENGTH = 8;

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
  // `email_user` was missing here, which is why this page listed nine email
  // accounts it could not filter down to, count, or explain.
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff' | 'email_user'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    // Nothing granted by default: a new staff member should be given pages
    // deliberately, not inherit the whole admin.
    permissions: [],
  });
  const [sendingReset, setSendingReset] = useState(false);

  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmModal = useConfirmationModal();
  const currentUser = useAuthStore((state) => state.user);

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
  const emailUserCount = users.filter((u) => u.role === 'email_user').length;

  const canDeleteUser = (user: User) => {
    if (user.role === 'admin' && adminCount <= 1) {
      return false;
    }
    return true;
  };

  const openAddForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'staff', permissions: [] });
    setEditingUser(null);
    setIsAdding(true);
  };

  const openEditForm = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role === 'email_user' ? 'staff' : user.role,
      // Admins are unrestricted, so their editor shows no picker. Reading the
      // stored list here keeps the state honest either way.
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    });
    setEditingUser(user);
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'staff', permissions: [] });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Prevent self-role-change to avoid lockout
    if (editingUser && currentUser && editingUser.id === currentUser.id && formData.role !== editingUser.role) {
      showError('You cannot change your own role');
      return;
    }

    const newPassword = formData.password.trim();

    // Validate before doing anything, so we never half-apply a change
    if (editingUser && newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
      showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        // Track what actually changed so we only report real updates.
        //
        // Page access counts as a change on its own. Without this, editing
        // somebody's permissions and pressing Save reported "Nothing to
        // update" and silently did nothing.
        const roleChanged = formData.role !== editingUser.role;
        const passwordChanged = newPassword.length > 0;
        const previousPermissions = new Set(editingUser.permissions ?? []);
        const nextPermissions = new Set<string>(formData.permissions);
        const permissionsChanged =
          previousPermissions.size !== nextPermissions.size ||
          [...nextPermissions].some((key) => !previousPermissions.has(key));

        if (!roleChanged && !passwordChanged && !permissionsChanged) {
          showError('Nothing to update');
          return;
        }

        // Password first: if it fails, the role is left untouched so the
        // admin can retry without wondering which half landed.
        if (passwordChanged) {
          await api.setUserPassword(editingUser.id, newPassword);
        }

        if (roleChanged) {
          await api.updateUserRole(editingUser.id, formData.role);
        }

        if (permissionsChanged) {
          await api.updateUserPermissions(
            editingUser.id,
            serialisePermissions(formData.role, nextPermissions),
          );
        }

        const changes = [
          passwordChanged && 'password',
          roleChanged && 'role',
          permissionsChanged && 'page access',
        ].filter(Boolean);
        showSuccess(`Updated ${changes.join(', ')} for ${editingUser.name}`);
      } else {
        // Create new user
        await api.register(formData.email, formData.password, formData.name, formData.role);
        // `register` creates the Firebase account; the Supabase row it writes is
        // then given the page access chosen in the form.
        const created = await api.getUsers();
        const match = created.find((u) => u.email.toLowerCase() === formData.email.toLowerCase());
        if (match && formData.role !== 'admin') {
          await api.updateUserPermissions(match.id, serialisePermissions(formData.role, new Set(formData.permissions)));
        }
        showSuccess(`User added successfully as ${formData.role}`);
      }

      closeForm();
      fetchData();
    } catch (error: any) {
      console.error('Failed to save user', error);
      showError(error.message || (editingUser ? 'Failed to update user' : 'Failed to add user'));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Emails the user a Firebase password reset link.
   *
   * This is the working alternative to setting a password inline, which needs a
   * service-account key this project does not have. It goes through the client
   * SDK, so it needs no secret at all.
   */
  const handleSendResetEmail = async () => {
    if (!editingUser?.email) return;
    setSendingReset(true);
    try {
      await api.resetPassword(editingUser.email);
      showSuccess(`Password reset sent to ${editingUser.email}`);
    } catch (error) {
      console.error('Failed to send password reset:', error);
      showError('Could not send the reset email. Check the address and try again.');
    } finally {
      setSendingReset(false);
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
      {/*
        No page title. The layout header bar already names this route
        ("Users & roles") and the page printed its own "Users & Roles" a few
        pixels below it - the same words twice, in two capitalisations.
      */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {users.length === 0
              ? 'No accounts yet'
              : `${users.length} accounts - ${adminCount} admin, ${staffCount} staff, ${emailUserCount} email user${emailUserCount === 1 ? '' : 's'}`}
          </p>
          <button
            onClick={openAddForm}
            className="hidden items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-primary-700 sm:flex"
          >
            <Plus size={18} aria-hidden="true" />
            Add User
          </button>
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
              <option value="email_user">Email users</option>
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
          onSendResetEmail={editingUser ? handleSendResetEmail : undefined}
          sendingReset={sendingReset}
          onClose={closeForm}
          isEditing={!!editingUser}
          saving={saving}
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
 * Presentation per role.
 *
 * The label is written out rather than derived from the raw value, because
 * `capitalize` on `email_user` renders "Email_user" - the underscore is CSS's
 * word-boundary marker, not something a person should read.
 */
const ROLE_TONE: Record<
  string,
  { label: string; avatar: string; badge: string; Icon: typeof Crown }
> = {
  admin: {
    label: 'Admin',
    avatar: 'bg-purple-100 text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    Icon: Crown,
  },
  staff: {
    label: 'Staff',
    avatar: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    Icon: UserCircle,
  },
  email_user: {
    label: 'Email user',
    avatar: 'bg-slate-100 text-slate-600',
    badge: 'bg-slate-100 text-slate-600',
    Icon: Mail,
  },
};

/**
 * User Table Row (Desktop)
 */
function UserTableRow({ user, onEdit, onDelete, canDelete }: UserCardProps) {
  const tone = ROLE_TONE[user.role] ?? ROLE_TONE.staff;
  const RoleIcon = tone.Icon;

  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-sm font-semibold ${tone.avatar}`}
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{user.name}</div>
            <a
              href={`mailto:${user.email}`}
              className="block max-w-[240px] truncate text-xs text-slate-500 transition-colors hover:text-slate-900 hover:underline"
            >
              {user.email}
            </a>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
        >
          <RoleIcon size={12} aria-hidden="true" />
          {tone.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          {/*
            Quiet until hovered. A permanently red Delete on every row turned
            the list into a column of warnings, and `title` alone is not an
            accessible name - these say what they act on.
          */}
          <button
            type="button"
            onClick={() => onEdit(user)}
            aria-label={`Edit ${user.name}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <Edit size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(user.id, user.name)}
            disabled={!canDelete}
            aria-label={canDelete ? `Delete ${user.name}` : `Cannot delete ${user.name} - the last admin`}
            title={canDelete ? 'Delete user' : 'Cannot delete the last admin'}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
