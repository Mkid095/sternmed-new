import { supabase } from '../../config/supabase';
import { Banner, BannerRow } from '../../types';

const transformBannerRow = (row: BannerRow): Banner => ({
  id: row.id,
  imageUrl: row.image_url,
  order: row.display_order,
  // A row predating the column, or one whose value the driver hands back as
  // null, must read as live. Defaulting to false here would silently drop
  // banners off the homepage.
  isActive: row.is_active !== false,
  linkTarget: row.link_target ?? null,
  createdAt: row.created_at,
});

export const bannersService = {
  /** Every banner, live or parked. The admin page needs to show both. */
  async getBanners(): Promise<Banner[]> {
    const { data, error } = await supabase.from('banners').select('*').order('display_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as BannerRow[]).map(transformBannerRow);
  },

  /**
   * Only the banners the carousel should show.
   *
   * The homepage uses this so a parked banner keeps its row and its position in
   * `display_order` but is not rendered.
   */
  async getActiveBanners(): Promise<Banner[]> {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as BannerRow[]).map(transformBannerRow);
  },

  async createBanner(banner: Omit<Banner, 'id' | 'createdAt'>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .insert({
        image_url: banner.imageUrl,
        display_order: banner.order,
        is_active: banner.isActive ?? true,
        link_target: banner.linkTarget ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformBannerRow(data as BannerRow);
  },

  /**
   * Partial update. Only the fields present are written, so toggling a banner's
   * live state cannot clobber its image or position.
   */
  async updateBanner(id: string, changes: Partial<Omit<Banner, 'id' | 'createdAt'>>): Promise<Banner> {
    const patch: Record<string, unknown> = {};
    if (changes.imageUrl !== undefined) patch.image_url = changes.imageUrl;
    if (changes.order !== undefined) patch.display_order = changes.order;
    if (changes.isActive !== undefined) patch.is_active = changes.isActive;
    // `null` clears the link, so this cannot be an `!== undefined` skip that
    // silently keeps the old target.
    if ('linkTarget' in changes) patch.link_target = changes.linkTarget ?? null;

    const { data, error } = await supabase
      .from('banners')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformBannerRow(data as BannerRow);
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * Persist a new carousel order.
   *
   * Written as one batched upsert rather than a request per banner: the previous
   * drag handler only updated local state and showed a "order updated" toast,
   * so a reload silently reverted every drag.
   */
  async reorderBanners(orderedIds: string[]): Promise<void> {
    const rows = orderedIds.map((id, index) => ({ id, display_order: index + 1 }));
    const { error } = await supabase.from('banners').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  },
};