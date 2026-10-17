/**
 * Add-banner dialog.
 *
 * Was a fourth hand-rolled modal: fixed overlay, no focus trap, no Escape
 * handling, no `role="dialog"`, and a footer with a `pb-24` hack to clear the
 * mobile bottom nav. Now the shared Radix-backed Modal, with the actions in
 * its footer so they stay reachable while the body scrolls.
 *
 * The submit button sits outside the <form> and is wired to it by id via the
 * `form` attribute — otherwise the buttons could not be pinned below the
 * scrolling image preview.
 *
 * @module BannerFormModal
 */

import { useId } from 'react';
import { ImageIcon, Plus } from 'lucide-react';
import { Modal, ImageUpload } from '../../../shared/ui';
import { BannerLinkPicker } from './BannerLinkPicker';

export interface BannerFormModalProps {
  imageUrl: string;
  onChange: (url: string) => void;
  linkTarget: string | null;
  onLinkChange: (path: string | null) => void;
  onSubmit: () => void;
  onClose: () => void;
  isUploading: boolean;
}

export function BannerFormModal({
  imageUrl,
  onChange,
  linkTarget,
  onLinkChange,
  onSubmit,
  onClose,
  isUploading,
}: BannerFormModalProps) {
  const formId = useId();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add Banner"
      size="md"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isUploading || !imageUrl}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isUploading ? 'Adding…' : (
              <>
                <Plus size={16} aria-hidden="true" />
                Add Banner
              </>
            )}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex flex-col gap-4">
        <ImageUpload
          label="Banner Image"
          value={imageUrl}
          onChange={onChange}
          recommendedSize="Recommended: 1900x500px for best display"
        />

        {imageUrl && (
          // Previewed at the real carousel ratio rather than intrinsic size, so
          // the crop a visitor will see is visible before saving.
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div className="aspect-[3.8/1]">
              <img
                src={imageUrl}
                alt="Banner preview"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <ImageIcon size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-slate-400" />
          <span>
            Use 1900&times;500px so the banner displays correctly across every device. It goes live
            immediately — switch it off afterwards if it is a draft.
          </span>
        </p>

        <BannerLinkPicker value={linkTarget} onChange={onLinkChange} />
      </form>
    </Modal>
  );
}