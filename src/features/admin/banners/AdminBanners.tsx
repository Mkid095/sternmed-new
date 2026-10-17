/**
 * Admin Banners page.
 *
 * Manages the homepage carousel: upload a banner, park one temporarily, delete
 * one, and set the order they appear in.
 *
 * What changed
 * ------------
 * - **Banners can be parked.** A banner used to be either in the carousel or
 *   deleted; hiding one meant destroying it. `banners.is_active` (added in the
 *   `add_banners_is_active` migration) keeps the row and takes it out of
 *   rotation, and the homepage queries only live ones.
 * - **Reordering actually saves.** The old drag handler reordered a local array,
 *   toasted "Banner order updated" and never sent anything — a reload reverted
 *   every drag. It now calls `api.reorderBanners`.
 * - **Mobile reordering works.** HTML5 drag has no touch equivalent, so small
 *   screens get explicit move buttons.
 * - **The upload dialog is the shared Modal** instead of a hand-rolled overlay
 *   with no focus trap and a `pb-24` footer hack.
 *
 * Drag state lives here; the data and mutations live in useBanners.
 *
 * @module AdminBanners
 */

import { useState, type DragEvent } from 'react';
import { Plus, ImageIcon, ExternalLink } from 'lucide-react';
import { useBanners } from './hooks/useBanners';
import { BannerCard } from './components/BannerCard';
import { BannerFormModal } from './components/BannerFormModal';
import { ConfirmationModal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';
import type { Banner } from '../../../types';

export default function AdminBanners() {
  const { banners, loading, pendingId, setLive, remove, create, reorder } = useBanners();

  const [isAdding, setIsAdding] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [linkTarget, setLinkTarget] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmModal = useConfirmationModal();

  const liveCount = banners.filter((b) => b.isActive !== false).length;

  const closeForm = () => {
    setIsAdding(false);
    setImageUrl('');
    setLinkTarget(null);
  };

  const handleCreate = async () => {
    if (!imageUrl) return;
    setIsUploading(true);
    try {
      await create(imageUrl, linkTarget);
      showSuccess('Banner added');
      closeForm();
    } catch (error) {
      console.error('Failed to create banner:', error);
      showError('Failed to add banner');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleLive = async (banner: Banner) => {
    const next = banner.isActive === false;
    try {
      await setLive(banner, next);
      showSuccess(next ? 'Banner is live' : 'Banner parked');
    } catch (error) {
      console.error('Failed to update banner:', error);
      showError('Failed to update banner');
    }
  };

  const handleDelete = async (id: string) => {
    const banner = banners.find((b) => b.id === id);
    const confirmed = await confirmModal.confirm({
      title: 'Delete Banner',
      message: banner
        ? `"${banner.imageUrl.split('/').pop() || `Banner ${banner.order}`}" will be removed permanently. Park it instead if you only want it off the homepage.`
        : 'This banner will be removed permanently.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      await remove(id);
      showSuccess('Banner deleted');
    } catch (error) {
      console.error('Failed to delete banner:', error);
      showError('Failed to delete banner');
    }
  };

  /** Nudges a banner one slot, for the touch path where drag is unavailable. */
  const handleMove = async (id: string, direction: -1 | 1) => {
    const ids = banners.map((b) => b.id);
    const from = ids.indexOf(id);
    const to = from + direction;
    if (from === -1 || to < 0 || to >= ids.length) return;

    const next = [...ids];
    [next[from], next[to]] = [next[to], next[from]];
    try {
      await reorder(next);
    } catch (error) {
      console.error('Failed to reorder banners:', error);
      showError('Failed to change banner order');
    }
  };

  const handleDragStart = (e: DragEvent<HTMLElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: DragEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const ids = banners.map((b) => b.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    setDraggedId(null);
    if (from === -1 || to === -1) return;

    const next = [...ids];
    [next[from], next[to]] = [next[to], next[from]];
    try {
      await reorder(next);
    } catch (error) {
      console.error('Failed to reorder banners:', error);
      showError('Failed to change banner order');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-10">
      {/* No page title here — the layout header bar already reads "Banners". */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {banners.length === 0
            ? 'No banners yet'
            : `${liveCount} of ${banners.length} live on the homepage`}
        </p>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ExternalLink size={14} aria-hidden="true" />
            View home
          </a>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="hidden items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-primary-700 sm:flex"
          >
            <Plus size={18} aria-hidden="true" />
            Add Banner
          </button>
        </div>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-100">
            <ImageIcon size={30} className="text-slate-300" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">No banners yet</h2>
          <p className="mb-5 text-sm text-slate-500">
            Add a banner to display in the homepage carousel.
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus size={18} aria-hidden="true" />
            Add Your First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner, index) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              index={index}
              total={banners.length}
              isDragging={draggedId === banner.id}
              isPending={pendingId === banner.id}
              onToggleLive={handleToggleLive}
              onDelete={handleDelete}
              onMove={handleMove}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {isAdding && (
        <BannerFormModal
          imageUrl={imageUrl}
          onChange={setImageUrl}
          linkTarget={linkTarget}
          onLinkChange={setLinkTarget}
          onSubmit={handleCreate}
          onClose={closeForm}
          isUploading={isUploading}
        />
      )}

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        aria-label="Add banner"
        className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary-600 text-white shadow-lg transition-all active:scale-95 sm:hidden"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      <ConfirmationModal {...confirmModal.props} />
    </div>
  );
}