import { supabase } from '../../config/supabase';
import { Banner, BannerRow } from '../../types';

const transformBannerRow = (row: BannerRow): Banner => ({
  id: row.id,
  imageUrl: row.image_url,
  order: row.display_order,
  createdAt: row.created_at,
});

export const bannersService = {
  async getBanners(): Promise<Banner[]> {
    const { data, error } = await supabase.from('banners').select('*').order('display_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as BannerRow[]).map(transformBannerRow);
  },

  async createBanner(banner: Omit<Banner, 'id' | 'createdAt'>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .insert({
        image_url: banner.imageUrl,
        display_order: banner.order,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformBannerRow(data as BannerRow);
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
