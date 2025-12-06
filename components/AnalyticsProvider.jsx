'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Analytics Provider
 * Tracks page views on route changes
 */
export default function AnalyticsProvider({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on mount and route changes
    trackPageView(pathname);
  }, [pathname]);

  return children;
}
