import { supabase } from '../../config/supabase';
import { Category, CategoryRow } from '../../types';

const transformCategoryRow = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  image: row.image,
  showOnHome: row.show_on_home,
  order: row.order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const categoriesService = {
  /**
   * Categories in the order the dashboard sets.
   *
   * This was `select('*')` with no `orderBy`, so the shop sidebar and the
   * footer listed categories in whatever order Postgres happened to return —
   * the `order` column an admin drags to reorder was written and then ignored.
   * Name is the tiebreaker so categories sharing an `order` (the default 0)
   * still come back in a stable, predictable sequence.
   */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as CategoryRow[]).map(transformCategoryRow);
  },

  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        image: category.image || null,
        show_on_home: category.showOnHome,
        order: category.order ?? 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformCategoryRow(data as CategoryRow);
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.showOnHome !== undefined) updateData.show_on_home = updates.showOnHome;
    if (updates.order !== undefined) updateData.order = updates.order;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformCategoryRow(data as CategoryRow);
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async reorderCategories(categoryOrders: { id: string; order: number }[]): Promise<void> {
    // Update all categories with their new order values
    const updates = categoryOrders.map(({ id, order }) =>
      supabase.from('categories').update({ order }).eq('id', id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((result) => result.error);

    if (errors.length > 0) {
      throw new Error(`Failed to reorder categories: ${errors[0].error.message}`);
    }
  },
};
