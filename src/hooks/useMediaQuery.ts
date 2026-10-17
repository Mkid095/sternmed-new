/**
 * Media query hook.
 *
 * Used to pick which of two card variants to render rather than rendering both
 * and hiding one with CSS. Hiding is not equivalent: a `hidden` container is
 * still in the DOM, so every item inside it is still exposed to assistive
 * technology. Rendering both grids meant each category appeared twice in the
 * accessibility tree — a screen reader user heard nine categories, then nine
 * again.
 *
 * The initial value is read synchronously on first render so the correct
 * variant is used immediately; there is no flash of the wrong one.
 *
 * @module useMediaQuery
 */

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Re-read in case the viewport changed between first render and the effect
    // running.
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True from the `sm` breakpoint up — the same 640px the email app uses. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 640px)');
}