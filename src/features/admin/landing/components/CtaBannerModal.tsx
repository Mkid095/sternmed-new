/**
 * Editor for one call-to-action banner section.
 *
 * A CTA banner is a promotional flyer the admin drops into the home page
 * between the other blocks, with a link of its own. It is a section rather than
 * a row in the hero carousel so it can sit anywhere in the page order.
 *
 * The link picker is shared with the Banners page, so a CTA banner and a hero
 * banner are configured the same way and produce the same kind of path.
 *
 * @module CtaBannerModal
 */

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Trash2 } from 'lucide-react';
import { Modal, ImageUpload } from '../../../shared/ui';
import { BannerLinkPicker } from '../../banners/components/BannerLinkPicker';
import { api } from '../../../../services/api';
import type { Category, CtaBannerConfig, HomepageSection } from '../../../../types';

export interface CtaBannerModalProps {
  section: HomepageSection;
  onSave: (id: string, config: CtaBannerConfig) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function CtaBannerModal({ section, onSave, onRemove, onClose }: CtaBannerModalProps) {
  const config = (section.config ?? {}) as Partial<CtaBannerConfig>;

  const [imageUrl, setImageUrl] = useState(config.imageUrl ?? '');
  const [linkTarget, setLinkTarget] = useState<string | null>(config.linkTarget ?? null);
  const [alt, setAlt] = useState(config.alt ?? '');
  const [afterCategoryId, setAfterCategoryId] = useState<string>(config.afterCategoryId ?? '');
  const [categories, setCategories] = useState<Category[]>([]);

  // The section behind the dialog can change if another is opened first.
  useEffect(() => {
    setImageUrl(config.imageUrl ?? '');
    setLinkTarget(config.linkTarget ?? null);
    setAlt(config.alt ?? '');
    setAfterCategoryId(config.afterCategoryId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  // Only the categories actually rendered on the home page are worth pinning
  // to — pinning to a hidden category would place the banner nowhere.
  useEffect(() => {
    let cancelled = false;
    api.getCategories()
      .then((cats) => { if (!cancelled) setCategories(cats.filter((c) => c.showOnHome)); })
      .catch((err) => console.error('Failed to load categories for banner placement:', err));
    return () => { cancelled = true; };
  }, []);

  const save = () => {
    if (!imageUrl) return;
    onSave(section.id, {
      imageUrl,
      linkTarget: linkTarget ?? '',
      alt,
      // '' means "at the section's own position". Stored as absent rather than
      // an empty string so the renderer's check stays a simple falsy test.
      ...(afterCategoryId ? { afterCategoryId } : {}),
    });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Call to action banner"
      size="md"
      footer={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onRemove(section.id)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 size={15} aria-hidden="true" />
            Remove
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!imageUrl}
            className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save banner
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <ImageUpload
          label="Banner Image"
          value={imageUrl}
          onChange={setImageUrl}
          recommendedSize="Recommended: 1600x400px"
        />

        {imageUrl && (
          // Previewed at the ratio the home page renders it at, so the crop a
          // visitor sees is visible before saving.
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div className="aspect-[4/1]">
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="cta-alt" className="mb-1.5 block text-sm font-medium text-slate-700">
            Description for screen readers
          </label>
          <input
            id="cta-alt"
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="e.g. Winter sale on surgical drapes"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-colors hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Describe what the banner says. Leave blank if the image already contains words.
          </p>
        </div>

        <div>
          <p className="mb-1.5 block text-sm font-medium text-slate-700">Where does it appear?</p>
          <ul className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
            <li>
              <button
                type="button"
                onClick={() => setAfterCategoryId('')}
                aria-pressed={afterCategoryId === ''}
                className={clsx(
                  'flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left text-sm transition-colors',
                  afterCategoryId === '' ? 'bg-primary-50 font-medium text-primary-700' : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                <span>In page order</span>
                <span className="shrink-0 text-xs text-slate-400">Where the section sits</span>
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => setAfterCategoryId(category.id)}
                  aria-pressed={afterCategoryId === category.id}
                  className={clsx(
                    'flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left text-sm transition-colors last:border-b-0',
                    afterCategoryId === category.id ? 'bg-primary-50 font-medium text-primary-700' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt=""
                      className="h-6 w-6 flex-shrink-0 rounded object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span aria-hidden="true" className="h-6 w-6 flex-shrink-0 rounded bg-slate-100" />
                  )}
                  <span className="truncate">After &ldquo;{category.name}&rdquo;</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-slate-500">
            {afterCategoryId
              ? 'The banner shows directly below that category’s products.'
              : 'The banner shows wherever this section sits in the order above.'}
          </p>
        </div>

        <BannerLinkPicker value={linkTarget} onChange={setLinkTarget} />
      </div>
    </Modal>
  );
}