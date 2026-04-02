import { supabase } from '../../config/supabase';
import { User, UserRow } from '../../types';

const transformUserRow = (row: UserRow): User => ({
  id: row.id,
  firebaseUid: row.firebase_uid,
  email: row.email,
  name: row.name,
  role: row.role,
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

  async createUser(user: { firebaseUid: string; email: string; name: string; role: 'admin' | 'staff' }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        firebase_uid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformUserRow(data as UserRow);
  },

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('firebase_uid', firebaseUid).single();
    if (error || !data) return null;
    return transformUserRow(data as UserRow);
  },
};
