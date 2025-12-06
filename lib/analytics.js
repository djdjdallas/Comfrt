/**
 * Analytics Tracking Library
 *
 * Tracks user events and sends them to the analytics API.
 * Uses batching to reduce API calls and anonymous session IDs for privacy.
 */

// Event queue for batching
let eventQueue = [];
let flushTimeout = null;
const FLUSH_INTERVAL = 5000; // 5 seconds

/**
 * Get or create anonymous session ID
 */
function getSessionId() {
  if (typeof window === 'undefined') return null;

  let sessionId = sessionStorage.getItem('comfrt-session-id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('comfrt-session-id', sessionId);
  }
  return sessionId;
}

/**
 * Get current page path
 */
function getPagePath() {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

/**
 * Flush event queue to API
 */
async function flushEvents() {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSend }),
    });
  } catch {
    // Silently fail - analytics should never break the app
    // Optionally re-queue events for retry
  }
}

/**
 * Schedule flush if not already scheduled
 */
function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushEvents();
  }, FLUSH_INTERVAL);
}

/**
 * Track an analytics event
 * @param {string} eventType - Type of event (page_view, search, venue_click, etc.)
 * @param {object} eventData - Additional event data
 */
export function trackEvent(eventType, eventData = {}) {
  if (typeof window === 'undefined') return;

  const event = {
    event_type: eventType,
    event_data: eventData,
    page_path: getPagePath(),
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  };

  eventQueue.push(event);
  scheduleFlush();
}

/**
 * Track page view
 * @param {string} path - Optional path override
 */
export function trackPageView(path) {
  trackEvent('page_view', {
    path: path || getPagePath(),
    referrer: typeof document !== 'undefined' ? document.referrer : ''
  });
}

/**
 * Track search event
 * @param {string} query - Search query
 * @param {string} location - Location searched
 * @param {number} resultsCount - Number of results returned
 */
export function trackSearch(query, location, resultsCount) {
  trackEvent('search', {
    query,
    location,
    results_count: resultsCount,
  });
}

/**
 * Track venue click
 * @param {object} venue - Venue object with id, name, comfort_score
 */
export function trackVenueClick(venue) {
  trackEvent('venue_click', {
    venue_id: venue.id,
    venue_name: venue.name,
    comfort_score: venue.comfort_score,
  });
}

/**
 * Track map view
 * @param {number} venueCount - Number of venues on map
 */
export function trackMapView(venueCount) {
  trackEvent('map_view', {
    venue_count: venueCount,
  });
}

/**
 * Track filter usage
 * @param {string} filterType - Type of filter (comfort_score, etc.)
 * @param {any} value - Filter value
 */
export function trackFilterUsed(filterType, value) {
  trackEvent('filter_used', {
    filter_type: filterType,
    value,
  });
}

/**
 * Track preference set
 * @param {string} preferenceType - Type of preference
 */
export function trackPreferenceSet(preferenceType) {
  trackEvent('preference_set', {
    preference_type: preferenceType,
  });
}

/**
 * Flush events immediately (call on page unload)
 */
export function flushImmediate() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  // Use sendBeacon for reliable delivery on page unload
  if (eventQueue.length > 0 && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', JSON.stringify({ events: eventQueue }));
    eventQueue = [];
  } else {
    flushEvents();
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushImmediate);
  window.addEventListener('pagehide', flushImmediate);
}
