import { supabase } from '../../config/supabase';
import { Product, ProductRow } from '../../types';

const transformProductRow = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: row.price,
  categoryId: row.category_id,
  imageUrl: row.image_url,
  images: row.images || [],
  stock: row.stock,
  isFeatured: row.is_featured,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const productsService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw new Error(error.message);
    return (data as ProductRow[]).map(transformProductRow);
  },

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) return null;
    return transformProductRow(data as ProductRow);
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        category_id: product.categoryId,
        image_url: product.imageUrl,
        images: product.images || [],
        stock: product.stock,
        is_featured: product.isFeatured,
        status: product.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformProductRow(data as ProductRow);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformProductRow(data as ProductRow);
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
