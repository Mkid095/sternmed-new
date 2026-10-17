/**
 * Banner state and mutations.
 *
 * Pulled out of AdminBanners.tsx, which held the fetch, three mutations, the
 * drag handlers and two components in one file.
 *
 * Every mutation writes back to the server and then refetches, rather than
 * patching local state and hoping. The previous drag handler was the clearest
 * symptom of the alternative: it reordered a local array, toasted "Banner
 * order updated", and never sent anything — so a reload reverted it.
 *
 * @module useBanners
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../services/api';
import type { Banner } from '../../../../types';

export interface UseBannersReturn {
  banners: Banner[];
  loading: boolean;
  /** Id currently being written, so its card can disable its own controls. */
  pendingId: string | null;
  reload: () => Promise<void>;
  setLive: (banner: Banner, isActive: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
  create: (imageUrl: string, linkTarget: string | null) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
}

export function useBanners(): UseBannersReturn {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await api.getBanners();
      setBanners([...data].sort((a, b) => a.order - b.order));
    } catch (error) {
      // Surfaced by the caller; logged here so it is not silently dropped.
      console.error('Failed to fetch banners:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload().catch(() => setBanners([]));
  }, [reload]);

  /** Wraps a mutation so exactly one card shows as busy at a time. */
  const run = useCallback(
    async (id: string | null, work: () => Promise<void>) => {
      setPendingId(id);
      try {
        await work();
      } finally {
        setPendingId(null);
      }
    },
    [],
  );

  const setLive = useCallback(
    (banner: Banner, isActive: boolean) =>
      run(banner.id, async () => {
        await api.updateBanner(banner.id, { isActive });
        await reload();
      }),
    [run, reload],
  );

  const create = useCallback(
    (imageUrl: string, linkTarget: string | null) =>
      run(null, async () => {
        await api.createBanner({
          imageUrl,
          order: banners.length + 1,
          // A banner added by an admin is live. Publishing something parked
          // would be a surprise, and the toggle is one click away.
          isActive: true,
          linkTarget,
        });
        await reload();
      }),
    [run, reload, banners.length],
  );

  const remove = useCallback(
    (id: string) =>
      run(id, async () => {
        await api.deleteBanner(id);
        await reload();
      }),
    [run, reload],
  );

  const reorder = useCallback(
    (orderedIds: string[]) =>
      run(null, async () => {
        // Show the new order immediately; the batched write follows.
        setBanners((prev) =>
          orderedIds
            .map((id, index) => {
              const found = prev.find((b) => b.id === id);
              return found ? { ...found, order: index + 1 } : undefined;
            })
            .filter((b): b is Banner => b !== undefined),
        );
        try {
          await api.reorderBanners(orderedIds);
        } catch (error) {
          await reload();
          throw error;
        }
      }),
    [run, reload],
  );

  return { banners, loading, pendingId, reload, setLive, remove, create, reorder };
}