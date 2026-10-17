/**
 * Toggle switch, built on Radix Switch.
 *
 * Used wherever an admin flips something on or off: whether a category appears
 * on the home page, whether a banner is live, whether a landing section is
 * shown, and the homepage settings.
 *
 * Why a switch and not a checkbox
 * -------------------------------
 * A checkbox says "include this in the batch"; a switch says "this is on right
 * now". These are live settings that take effect immediately, and a switch
 * shows the current state without being read at all.
 *
 * Radix underneath because the hard part is not the visual: it has to respond
 * to Space and Enter, carry role="switch" with aria-checked, and let a label be
 * associated correctly.
 *
 * Visual notes
 * ------------
 * Sized off the track rather than guessed. h-6 is 24px; w-11 is 44px. With a
 * 4px inset on each side the thumb travels 44 - 20 - 8 = 16px, so the two
 * translate values below are the two ends of that range. Hardcoding the wrong
 * pair is what leaves the thumb short of the right edge when on.
 *
 * The off state is a filled slate rather than an empty outline. An outline
 * switch reads as "disabled" or "not yet configured"; a filled one reads as a
 * control that is genuinely off, which is what it is.
 *
 * @module Toggle
 */

import * as Switch from '@radix-ui/react-switch';
import { useId, type ReactNode } from 'react';
import { clsx } from 'clsx';

/** Track and thumb dimensions. Kept as constants so the two cannot drift. */
const TRACK = 'h-6 w-11'; // 24 × 44
const THUMB = 'h-5 w-5'; // 20px square
/**
 * Thumb placement. Absolute, not a flex item: `absolute` is what makes `left`
 * and `top` mean anything, and without it the inset classes below are inert
 * and the thumb rides flex centring instead — which pushes it past the right
 * edge once it is translated.
 */
const THUMB_PLACEMENT = 'absolute left-0.5 top-1/2 -translate-y-1/2';
/**
 * Travel: 44px track − 20px thumb − 2px inset at each end = 20px, i.e.
 * `translate-x-5`. This only holds because the track carries NO border: a
 * transparent `border-2` would shrink the padding box to 40px, and 20px of
 * travel would then park the thumb against the outer edge. Focus is drawn with
 * a ring-offset instead, which does not consume layout space.
 */
const THUMB_ON = 'translate-x-5';
const THUMB_OFF = 'translate-x-0';

export interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible text. Also becomes the control's accessible name. */
  label?: ReactNode;
  /** Secondary line under the label. */
  hint?: ReactNode;
  disabled?: boolean;
  /** Hides the text but keeps it for screen readers. */
  hideLabel?: boolean;
  className?: string;
  id?: string;
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
  hint,
  disabled = false,
  hideLabel = false,
  className,
  id,
}: ToggleProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;

  return (
    <div className={clsx('flex items-center justify-between gap-4', className)}>
      {(label || hint) && (
        <div className={clsx('min-w-0', hideLabel && 'sr-only')}>
          {label && (
            <label
              htmlFor={controlId}
              className={clsx(
                'block text-sm font-medium',
                disabled ? 'text-slate-400' : 'text-slate-800',
              )}
            >
              {label}
            </label>
          )}
          {hint && (
            <p
              id={hintId}
              className={clsx(
                'mt-0.5 text-xs',
                disabled ? 'text-slate-300' : 'text-slate-500',
              )}
            >
              {hint}
            </p>
          )}
        </div>
      )}

      <Switch.Root
        id={controlId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={hintId}
        className={clsx(
          'relative inline-flex flex-shrink-0 items-center rounded-full',
          TRACK,
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary-600' : 'bg-slate-200',
        )}
      >
        <Switch.Thumb
          className={clsx(
            'pointer-events-none block rounded-full bg-white',
            // Ring rather than shadow: a ring reads as a crisp edge at any
            // scale, a blur shadow goes muddy against the brand fill.
            'ring-1 ring-slate-900/10',
            'transition-transform duration-150 will-change-transform',
            THUMB_PLACEMENT,
            THUMB,
            checked ? THUMB_ON : THUMB_OFF,
          )}
        />
      </Switch.Root>
    </div>
  );
}