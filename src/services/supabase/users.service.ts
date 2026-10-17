import { supabase } from '../../config/supabase';
import { User, UserRow } from '../../types';

const transformUserRow = (row: UserRow): User => ({
  id: row.id,
  firebaseUid: row.firebase_uid,
  email: row.email,
  name: row.name,
  role: row.role,
  // `permissions` is jsonb. It is null for admins, which means "unrestricted".
  // Coerced to a plain string array here so no caller has to think about jsonb.
  permissions: Array.isArray(row.permissions) ? (row.permissions as string[]) : null,
  emailAliasId: row.email_alias_id ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const usersService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw new Error(error.message);
    return (data as UserRow[]).map(transformUserRow);
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async updateUserRole(id: string, role: 'admin' | 'staff'): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformUserRow(data as UserRow);
  },

  /**
   * Replace this user's page access.
   *
   * `permissions` is written as a whole rather than merged, so clearing the
   * last page actually clears it — a merge here would leave a revoked key in
   * place and silently keep the access.
   *
   * `null` restores the unrestricted default, which is what admins use.
   */
  async updateUserPermissions(id: string, permissions: string[] | null): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ permissions, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformUserRow(data as UserRow);
  },

  async createUser(user: {
    firebaseUid: string;
    email: string;
    name: string;
    role: 'admin' | 'staff';
    permissions?: string[] | null;
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        firebase_uid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformUserRow(data as UserRow);
  },

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();
    if (error || !data) return null;
    return transformUserRow(data as UserRow);
  },
};