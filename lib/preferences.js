const STORAGE_KEY = 'comfrt-preferences';

const defaultPreferences = {
  noiseSensitivity: 3,
  lightSensitivity: 3,
  spaciousnessPreference: 3,
  otherNeeds: '',
  onboardingComplete: false,
};

/**
 * Get user preferences from localStorage
 */
export function getPreferences() {
  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore localStorage errors
  }

  return defaultPreferences;
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences(preferences) {
  if (typeof window === 'undefined') return;

  try {
    const current = getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    // Ignore localStorage errors
    return preferences;
  }
}

/**
 * Clear all preferences
 */
export function clearPreferences() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete() {
  return getPreferences().onboardingComplete;
}

/**
 * Format preferences for API context
 */
export function formatPreferencesForAPI(preferences) {
  const sensitivityLabels = {
    1: 'very low',
    2: 'low',
    3: 'moderate',
    4: 'high',
    5: 'very high',
  };

  const parts = [];

  if (preferences.noiseSensitivity >= 4) {
    parts.push(`high noise sensitivity - prefer quiet venues`);
  } else if (preferences.noiseSensitivity <= 2) {
    parts.push(`low noise sensitivity - moderate noise is okay`);
  }

  if (preferences.lightSensitivity >= 4) {
    parts.push(`high light sensitivity - prefer dim or natural lighting`);
  } else if (preferences.lightSensitivity <= 2) {
    parts.push(`low light sensitivity - bright lighting is fine`);
  }

  if (preferences.spaciousnessPreference >= 4) {
    parts.push(`strong preference for spacious, uncrowded venues`);
  } else if (preferences.spaciousnessPreference <= 2) {
    parts.push(`cozy/intimate spaces are preferred`);
  }

  if (preferences.otherNeeds?.trim()) {
    parts.push(`other needs: ${preferences.otherNeeds.trim()}`);
  }

  return parts.length > 0
    ? `User preferences: ${parts.join('; ')}`
    : '';
}
