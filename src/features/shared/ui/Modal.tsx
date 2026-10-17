/**
 * Modal dialog, built on Radix Dialog.
 *
 * Radix is used the way `sternmed-email` uses it: for the interactive
 * primitive that is painful to get right by hand, while the surface styling
 * stays plain Tailwind.
 *
 * The hand-rolled dialogs this replaces had no focus trap (Tab walked straight
 * out into the page behind), ignored Escape, carried no role="dialog" or
 * aria-modal so screen readers announced nothing, never moved focus into the
 * dialog on open, and never returned focus to whatever opened it. Six of them
 * existed — one each in banners, categories, mails (twice), products and users.
 *
 * Presentation is the one thing a page can still choose: `sheet` (bottom sheet
 * on phones, centred from sm up) or `center` (centred at every width).
 *
 * Props are unchanged from the old shared Modal, so its existing call sites
 * work untouched.
 */

import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  /** `sheet` rises from the bottom on phones; `center` stays centred throughout. */
  presentation?: 'sheet' | 'center';
  /** Footer pinned below the scrollable body, for Cancel/Save pairs. */
  footer?: ReactNode;
}

const sizes = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  full: 'sm:max-w-4xl',
} as const;

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  presentation = 'sheet',
  footer,
}: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx(
            'fixed inset-0 z-50 bg-slate-900/50',
            'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
            'motion-reduce:animate-none',
          )}
        />

        {/*
          On phones the sheet pins to the bottom edge and spans the full width;
          from sm up it becomes a centred panel of the requested size.

          The sheet is a flex column pinned to the bottom via `inset-x-0
          bottom-0`, and the centred panel uses `inset-x-0 top-1/2 -translate-y-1/2`.
          They are different positioning strategies rather than one class with
          overrides, because mixing `bottom-0` and `-translate-y-1/2` in the same
          element puts the panel half off-screen at some widths.
        */}
        <Dialog.Content
          className={clsx(
            'fixed z-50 flex flex-col overflow-hidden bg-white shadow-xl focus:outline-none',
            'max-h-[92dvh] data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out motion-reduce:animate-none',
            presentation === 'sheet'
              ? 'inset-x-0 bottom-0 rounded-t-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl'
              : 'inset-x-4 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl sm:inset-x-auto',
            sizes[size],
          )}
        >
          {(title || showCloseButton) && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
              {/* Radix links aria-labelledby to this, so the dialog gets an accessible name for free. */}
              {title && (
                <Dialog.Title className="text-base font-semibold text-slate-900 sm:text-lg">
                  {title}
                </Dialog.Title>
              )}
              {showCloseButton && (
                <Dialog.Close
                  // Icon-only control, so the label has to be explicit.
                  aria-label="Close dialog"
                  className="-mr-1 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </Dialog.Close>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
            {children}
          </div>

          {footer && (
            // Pinned so Save/Cancel stay reachable when the body scrolls —
            // on a phone the buttons used to sit below a long form with no way
            // to reach them without scrolling the whole dialog.
            <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}