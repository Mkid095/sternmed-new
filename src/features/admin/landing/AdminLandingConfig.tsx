/**
 * Admin Landing Page.
 *
 * The layout of the public home page: which blocks it is made of, in what
 * order, and which are switched on.
 *
 * What this page is NOT
 * ---------------------
 * It is no longer a second place to decide whether a category appears on the
 * home page. That control lives on the Categories page; here it is a read-only
 * summary. See `CategoryStatusList` for why.
 *
 * @module AdminLandingConfig
 */

import { useEffect, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Plus, Settings2 } from 'lucide-react';
import { useHomeSections } from './hooks/useHomeSections';
import { SectionRow } from './components/SectionRow';
import { CategoryStatusList } from './components/CategoryStatusList';
import { CtaBannerModal } from './components/CtaBannerModal';
import { api } from '../../../services/api';
import type { Category, CtaBannerConfig } from '../../../types';
import { useToastSuccess, useToastError } from '../../shared/ui';

export default function AdminLandingConfig() {
  const {
    sections,
    loading: sectionsLoading,
    saving,
    error: sectionsError,
    setEnabled,
    move,
    reorder,
    addSection,
    updateConfig,
    removeSection,
  } = useHomeSections();

  const [categories, setCategories] = useState<Array<Category & { productCount?: number }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  /** Id of the CTA banner being edited, or null. */
  const [editingId, setEditingId] = useState<string | null>(null);

  const showSuccess = useToastSuccess();
  const showError = useToastError();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [cats, products] = await Promise.all([api.getCategories(), api.getProducts()]);
        if (cancelled) return;
        setCategories(
          cats.map((cat) => ({
            ...cat,
            productCount: products.filter((p) => p.categoryId === cat.id).length,
          })),
        );
      } catch (err) {
        console.error('Failed to load categories:', err);
        if (!cancelled) showError('Failed to load categories');
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // Toast helpers are stable; re-running on them would refetch needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await setEnabled(id, enabled);
    } catch {
      // useHomeSections has already surfaced the failure and rolled back.
      showError('Could not change the home page layout');
    }
  };

  const handleMove = async (id: string, direction: -1 | 1) => {
    try {
      await move(id, direction);
    } catch {
      showError('Could not change the order');
    }
  };

  /** Creates a new CTA banner section, then opens it so an image can be set. */
  const handleAddCtaBanner = async () => {
    try {
      const created = await addSection('cta-banner');
      if (created) setEditingId(created.id);
    } catch {
      showError('Could not add the banner section');
    }
  };

  const handleSaveCtaBanner = async (id: string, config: CtaBannerConfig) => {
    try {
      await updateConfig(id, { ...config });
      setEditingId(null);
      showSuccess('Banner saved');
    } catch {
      showError('Could not save the banner');
    }
  };

  const handleRemoveCtaBanner = async (id: string) => {
    try {
      await removeSection(id);
      setEditingId(null);
      showSuccess('Banner section removed');
    } catch {
      showError('Could not remove the banner section');
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

    const ids = sections.map((s) => s.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    setDraggedId(null);
    if (from === -1 || to === -1) return;

    const next = [...ids];
    [next[from], next[to]] = [next[to], next[from]];
    try {
      await reorder(next);
      showSuccess('Home page order updated');
    } catch {
      showError('Could not change the order');
    }
  };

  const loading = sectionsLoading || categoriesLoading;
  const hiddenCount = sections.filter((s) => !s.enabled).length;
  const editing = editingId ? sections.find((s) => s.id === editingId) : undefined;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {sectionsError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
          {sectionsError}
        </p>
      )}

      {/* ============ Home page layout ============ */}
      <section>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Home page sections</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Drag to change the order they appear. Switch off a section to hide it.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Preview
            </a>
            <button
              type="button"
              onClick={handleAddCtaBanner}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <Plus size={14} aria-hidden="true" />
              Add banner
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {sections.map((section, index) => (
            <SectionRow
              key={section.id}
              section={section}
              index={index}
              total={sections.length}
              isDragging={draggedId === section.id}
              isSaving={saving}
              onToggle={handleToggle}
              onMove={handleMove}
              onEdit={section.type === 'cta-banner' ? (id) => setEditingId(id) : undefined}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </ul>

        {hiddenCount > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            {hiddenCount} section{hiddenCount === 1 ? ' is' : 's are'} switched off and will not appear
            on the home page.
          </p>
        )}
      </section>

      {/* ============ Categories ============ */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Categories on the home page</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            These appear under <span className="font-medium">Shop by category</span> above, in the order
            set under{' '}
            <Link to="/admin/settings" className="text-primary-600 underline-offset-2 hover:underline">
              Settings
            </Link>
            .
          </p>
        </div>

        <CategoryStatusList categories={categories} />

        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Settings2 size={13} aria-hidden="true" />
          Switch categories on or off from the Categories page, where each one has its image and products.
        </p>
      </section>

      {editing && (
        <CtaBannerModal
          section={editing}
          onSave={handleSaveCtaBanner}
          onRemove={handleRemoveCtaBanner}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}