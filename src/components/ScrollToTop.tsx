/**
 * Scroll to Top Component
 *
 * Automatically scrolls to the top of the page when navigating to a new route.
 * This ensures users always start at the top of each page, regardless of
 * their scroll position on the previous page.
 *
 * @module ScrollToTop
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Use 'instant' for immediate scroll, 'smooth' for animated
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;
