/**
 * Add / edit product — multi-step dialog.
 *
 * Split out of AdminProducts.tsx, which had grown past 1000 lines.
 *
 * Why a wizard and not tabs
 * ------------------------
 * This started as a three-tab form. Tabs are wrong for creating something: a
 * tab strip does not tell you there is anything behind the next tab, and with
 * Save pinned to the bottom a person can press it with a required field still
 * empty and get no visible response, because the error is on a tab they never
 * opened.
 *
 * A wizard makes the remaining work explicit. Each step is numbered and named,
 * the primary button says "Next" until the last step, and a step cannot be left
 * with something missing in it — the error appears on the step you are actually
 * looking at.
 *
 * The final Review step exists because "Create product" should never be a leap
 * of faith; you get to see what is about to be saved first.
 *
 * @module ProductFormModal
 */

import { useState, type FormEvent, type Key } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { Category, ProductStatus } from '../../../../types';
import { ImageUpload, MultiImageUpload, Modal } from '../../../shared/ui';

const STATUS_HINT: Record<ProductStatus, string> = {
  active: 'Visible and purchasable.',
  coming_soon: 'Visible, but customers cannot buy it yet.',
  draft: 'Hidden from customers.',
  archived: 'Hidden and out of the catalogue.',
  out_of_stock: 'Visible, but unavailable to buy until stock is added.',
};

const STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'Active',
  coming_soon: 'Coming soon',
  draft: 'Draft',
  archived: 'Archived',
  out_of_stock: 'Out of stock',
};

interface StepDef {
  id: 'details' | 'pricing' | 'media';
  title: string;
  /** Short description of what belongs here, shown as the step's subtitle. */
  blurb: string;
}

const STEPS: StepDef[] = [
  {
    id: 'details',
    title: 'Details',
    blurb: 'What the product is and where it belongs.',
  },
  {
    id: 'pricing',
    title: 'Pricing & stock',
    blurb: 'What it costs and how many you have.',
  },
  {
    id: 'media',
    title: 'Media',
    blurb: 'The image buyers will see first.',
  },
];

interface ProductFormModalProps {
  key?: Key;
  product: {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    imageUrl: string;
    images: string[];
    stock: string;
    isFeatured: boolean;
    status: ProductStatus;
  };
  categories: Category[];
  isEditing: boolean;
  onChange: (product: ProductFormModalProps['product']) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

/** Problems grouped by the step that owns them. */
type Errors = Record<StepDef['id'], string[]>;

function validateStep(
  product: ProductFormModalProps['product'],
  step: StepDef['id']
): string[] {
  const out: string[] = [];

  if (step === 'details') {
    if (!product.name.trim()) out.push('Product name is required.');
    if (!product.description.trim()) out.push('Description is required.');
    if (!product.categoryId) out.push('Choose a category.');
  }

  if (step === 'pricing') {
    if (product.price === '' || Number.isNaN(parseFloat(product.price))) {
      out.push('Enter a valid price.');
    } else if (parseFloat(product.price) < 0) {
      out.push('Price cannot be negative.');
    }

    if (product.stock === '' || Number.isNaN(parseInt(product.stock, 10))) {
      out.push('Enter a valid stock quantity.');
    } else if (parseInt(product.stock, 10) < 0) {
      out.push('Stock cannot be negative.');
    }
  }

  if (step === 'media' && !product.imageUrl) {
    out.push('A main product image is required.');
  }

  return out;
}

export function ProductFormModal({
  product,
  categories,
  isEditing,
  onChange,
  onSubmit,
  onClose,
}: ProductFormModalProps) {
  const formId = 'product-form';
  // `stepIndex` walks past the last content step to reach the review screen.
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Errors>({ details: [], pricing: [], media: [] });

  const step = STEPS[stepIndex];
  const isReview = stepIndex >= STEPS.length;
  const stepErrors = isReview ? [] : errors[step.id];

  const field =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25';
  const label = 'mb-1.5 block text-sm font-medium text-slate-700';

  const goTo = (index: number) => {
    setStepIndex(Math.max(0, Math.min(index, STEPS.length)));
    // Errors are cleared on navigation: leaving them on a step you have now
    // corrected reads as the fix having failed.
    setErrors({ details: [], pricing: [], media: [] });
  };

  const handleNext = () => {
    const found = validateStep(product, step.id);
    if (found.length > 0) {
      setErrors((prev) => ({ ...prev, [step.id]: found }));
      return;
    }
    goTo(stepIndex + 1);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate every step, not just the review screen, so arriving here does
    // not bypass anything.
    const all: Errors = {
      details: validateStep(product, 'details'),
      pricing: validateStep(product, 'pricing'),
      media: validateStep(product, 'media'),
    };
    const total = all.details.length + all.pricing.length + all.media.length;

    if (total > 0) {
      setErrors(all);
      const firstBad = STEPS.findIndex((s) => all[s.id].length > 0);
      if (firstBad >= 0) goTo(firstBad);
      return;
    }

    onSubmit(e);
  };

  const remaining = STEPS.reduce((n, s) => n + validateStep(product, s.id).length, 0);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Edit product' : 'Add new product'}
      size="full"
      footer={
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => goTo(stepIndex - 1)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>

          <div className="ml-auto flex items-center gap-3">
            {!isReview && (
              <span className="text-xs text-slate-400">
                Step {stepIndex + 1} of {STEPS.length}
              </span>
            )}

            {isReview ? (
              <button
                type="submit"
                form={formId}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                {isEditing ? 'Save changes' : 'Create product'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                Next
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col">
        {/*
          Progress. Pinned to the top of the scrolling body, because the whole
          point is that you can always see how much is left — scrolled out of
          sight on a long step it stops doing its job.
        */}
        <ol
          className="sticky top-0 z-10 -mx-4 mb-5 flex items-center gap-1.5 border-b border-slate-100 bg-white px-4 py-3 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6"
          aria-label="Progress"
        >
          {STEPS.map((s, index) => {
            const state =
              index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'todo';
            const bad = state !== 'done' && validateStep(product, s.id).length > 0 && index === stepIndex;

            return (
              <li key={s.id} className="flex flex-1 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  className={clsx(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                    state === 'current' ? 'bg-primary-50' : 'hover:bg-slate-50',
                  )}
                >
                  <span
                    className={clsx(
                      'grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-semibold',
                      state === 'done' && 'bg-primary-600 text-white',
                      state === 'current' && 'bg-primary-100 text-primary-700',
                      state === 'todo' && 'bg-slate-100 text-slate-400',
                    )}
                  >
                    {state === 'done' ? (
                      <Check size={13} aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={clsx(
                        'block truncate text-xs font-medium',
                        state === 'current'
                          ? 'text-primary-700'
                          : state === 'done'
                            ? 'text-slate-600'
                            : 'text-slate-400',
                      )}
                    >
                      {s.title}
                    </span>
                  </span>
                  {bad && (
                    <AlertCircle size={13} className="ml-auto text-red-500" aria-hidden="true" />
                  )}
                </button>

                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'h-px w-3 flex-shrink-0',
                      index < stepIndex ? 'bg-primary-300' : 'bg-slate-200',
                    )}
                  />
                )}
              </li>
            );
          })}

          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-px w-3 flex-shrink-0 bg-slate-200" />
            <span
              className={clsx(
                'whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium',
                isReview ? 'bg-primary-50 text-primary-700' : 'text-slate-400',
              )}
            >
              Review
            </span>
          </li>
        </ol>

        {/* Error summary sits directly under the pinned progress bar so it is
            the first thing seen when a step is blocked. */}
        {!isReview && stepErrors.length > 0 && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3"
          >
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" aria-hidden="true" />
            <ul className="list-inside list-disc space-y-0.5 text-sm text-red-700">
              {stepErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* On the Review step `step` is undefined (stepIndex walks past the
            last content step), so the step bodies are only reachable through
            stepIndex < STEPS.length — guard on isReview to keep the types
            honest and the render safe. */}
        {!isReview && step.id === 'details' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">{step.blurb}</p>

            {/* Name and category share a row — the extra dialog width exists
                precisely so these do not each claim a full line. */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="pf-name" className={label}>
                  Product name <span className="text-red-500">*</span>
                </label>
                <input
                  id="pf-name"
                  type="text"
                  data-modal-autofocus
                  value={product.name}
                  onChange={(e) => onChange({ ...product, name: e.target.value })}
                  placeholder="e.g. I.V. Cannula 18G"
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="pf-category" className={label}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="pf-category"
                  value={product.categoryId}
                  onChange={(e) => onChange({ ...product, categoryId: e.target.value })}
                  className={field}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="pf-description" className={label}>
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="pf-description"
                rows={4}
                value={product.description}
                onChange={(e) => onChange({ ...product, description: e.target.value })}
                placeholder="What it is, what it is used for, and anything a buyer would ask."
                className={clsx(field, 'resize-none')}
              />
              <p className="mt-1 text-xs text-slate-400">
                Shown on the product page — it is the main thing a buyer reads.
              </p>
            </div>

            <div className="sm:max-w-xs">
              <label htmlFor="pf-status" className={label}>
                Status
              </label>
              <select
                id="pf-status"
                value={product.status}
                onChange={(e) =>
                  onChange({ ...product, status: e.target.value as ProductStatus })
                }
                className={field}
              >
                {(Object.keys(STATUS_LABEL) as ProductStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">{STATUS_HINT[product.status]}</p>
            </div>
          </div>
        )}

        {!isReview && step.id === 'pricing' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">{step.blurb}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pf-price" className={label}>
                  Price (Ksh) <span className="text-red-500">*</span>
                </label>
                <input
                  id="pf-price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={product.price}
                  onChange={(e) => onChange({ ...product, price: e.target.value })}
                  placeholder="0.00"
                  className={field}
                />
                {/* A zero price is allowed - plenty of catalogue items are not
                    priced yet - but it should be deliberate, not a blank that
                    silently saves as nothing. */}
                {product.price !== '' && parseFloat(product.price) === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    This product will show as having no price.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="pf-stock" className={label}>
                  Stock on hand <span className="text-red-500">*</span>
                </label>
                <input
                  id="pf-stock"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={product.stock}
                  onChange={(e) => onChange({ ...product, stock: e.target.value })}
                  placeholder="0"
                  className={field}
                />
              </div>
            </div>

            <label
              htmlFor="pf-featured"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5"
            >
              <input
                id="pf-featured"
                type="checkbox"
                checked={product.isFeatured}
                onChange={(e) => onChange({ ...product, isFeatured: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">
                  Feature on the home page
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Pins this product to the top of the shop.
                </span>
              </span>
            </label>
          </div>
        )}

        {!isReview && step.id === 'media' && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-slate-500">{step.blurb}</p>

            <div>
              <ImageUpload
                label="Main image"
                value={product.imageUrl}
                onChange={(url) => onChange({ ...product, imageUrl: url })}
                recommendedSize="Recommended: 400x300px"
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                This is the image buyers see in listings.
              </p>
            </div>

            <div>
              <MultiImageUpload
                label="Gallery"
                value={product.images}
                onChange={(urls) => onChange({ ...product, images: urls })}
                recommendedSize="Recommended: 400x300px. Up to 5 images."
                maxImages={5}
              />
            </div>
          </div>
        )}

        {isReview && (
          <div className="flex flex-col gap-4">
            {remaining > 0 && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3"
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" aria-hidden="true" />
                <ul className="list-inside list-disc space-y-0.5 text-sm text-red-700">
                  {STEPS.flatMap((s) => validateStep(product, s.id)).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              <ReviewRow label="Name" value={product.name || '—'} onEdit={() => goTo(0)} />
              <ReviewRow label="Category" value={categoryName(categories, product.categoryId)} onEdit={() => goTo(0)} />
              <ReviewRow label="Status" value={STATUS_LABEL[product.status]} onEdit={() => goTo(0)} />
              <ReviewRow
                label="Price"
                value={
                  product.price !== '' && !Number.isNaN(parseFloat(product.price))
                    ? `Ksh ${parseFloat(product.price).toLocaleString()}`
                    : '—'
                }
                onEdit={() => goTo(1)}
              />
              <ReviewRow label="Stock" value={product.stock || '—'} onEdit={() => goTo(1)} />
              <ReviewRow label="Featured" value={product.isFeatured ? 'Yes' : 'No'} onEdit={() => goTo(1)} />
              <ReviewRow
                label="Images"
                value={`1 main${product.images.length ? ` + ${product.images.length} gallery` : ''}`}
                onEdit={() => goTo(2)}
              />
            </dl>
          </div>
        )}
      </form>
    </Modal>
  );
}

function categoryName(categories: Category[], id: string): string {
  return categories.find((c) => c.id === id)?.name ?? '—';
}

/** One review line, with a link back to the step that owns the value. */
function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <dt className="w-24 flex-shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{value}</dd>
      <button
        type="button"
        onClick={onEdit}
        className="flex-shrink-0 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
      >
        Edit
      </button>
    </div>
  );
}

export type { ProductFormModalProps };