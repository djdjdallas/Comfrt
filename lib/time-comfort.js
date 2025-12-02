/**
 * Time-Based Comfort Predictions
 *
 * Predicts when venues are likely to be calmest based on
 * category patterns and business hours.
 */

// Default busy patterns by venue category (hours in 24h format)
const TIME_PATTERNS = {
  // Coffee shops - quiet early, busy mid-morning
  coffee: {
    quiet: [6, 7, 14, 15, 16],
    moderate: [8, 9, 13, 17],
    busy: [10, 11, 12]
  },
  cafes: {
    quiet: [6, 7, 14, 15, 16],
    moderate: [8, 9, 13, 17],
    busy: [10, 11, 12]
  },

  // Restaurants - quiet early/late, busy at meal times
  restaurants: {
    quiet: [11, 14, 15, 16, 21, 22],
    moderate: [12, 13, 17, 20],
    busy: [18, 19]
  },
  italian: {
    quiet: [11, 14, 15, 16, 21, 22],
    moderate: [12, 13, 17, 20],
    busy: [18, 19]
  },
  japanese: {
    quiet: [11, 14, 15, 16, 21, 22],
    moderate: [12, 13, 17, 20],
    busy: [18, 19]
  },
  sushi: {
    quiet: [11, 14, 15, 16, 21, 22],
    moderate: [12, 13, 17, 20],
    busy: [18, 19]
  },

  // Brunch spots - quiet weekday mornings, busy weekends
  breakfast_brunch: {
    quiet: [7, 8, 14, 15],
    moderate: [9, 13],
    busy: [10, 11, 12]
  },

  // Bars - quiet early evening, busy late
  bars: {
    quiet: [16, 17],
    moderate: [18, 19],
    busy: [20, 21, 22, 23]
  },
  pubs: {
    quiet: [15, 16, 17],
    moderate: [18, 19],
    busy: [20, 21, 22]
  },

  // Tea rooms - generally quiet
  tea: {
    quiet: [10, 11, 13, 14, 15, 16, 17],
    moderate: [12],
    busy: []
  },

  // Default pattern
  default: {
    quiet: [14, 15, 16],
    moderate: [11, 12, 13, 17],
    busy: [18, 19, 20]
  }
};

// Weekend modifiers - some places get busier on weekends
const WEEKEND_ADJUSTMENTS = {
  breakfast_brunch: { shiftBusy: 1 }, // Brunch rush is later on weekends
  bars: { extendBusy: 2 }, // Bars stay busy later on weekends
  restaurants: { extendBusy: 1 }, // Restaurants stay busy longer
};

/**
 * Get the category pattern for a venue
 */
function getVenuePattern(venue) {
  const categories = venue.categories?.map(c => c.alias.toLowerCase()) || [];

  // Check each category for a matching pattern
  for (const category of categories) {
    if (TIME_PATTERNS[category]) {
      return { pattern: TIME_PATTERNS[category], category };
    }
  }

  // Check for partial matches
  for (const category of categories) {
    for (const patternKey of Object.keys(TIME_PATTERNS)) {
      if (category.includes(patternKey) || patternKey.includes(category)) {
        return { pattern: TIME_PATTERNS[patternKey], category: patternKey };
      }
    }
  }

  return { pattern: TIME_PATTERNS.default, category: 'default' };
}

/**
 * Predict comfort level for a specific hour
 * @param {Object} venue - Venue data
 * @param {number} hour - Hour of day (0-23)
 * @param {boolean} isWeekend - Whether it's a weekend
 * @returns {Object} { level: 'quiet'|'moderate'|'busy', score: 0-100, confidence: 0-100 }
 */
export function predictComfortByTime(venue, hour, isWeekend = false) {
  const { pattern, category } = getVenuePattern(venue);

  let level = 'moderate';
  let score = 60;

  if (pattern.quiet.includes(hour)) {
    level = 'quiet';
    score = 85;
  } else if (pattern.busy.includes(hour)) {
    level = 'busy';
    score = 35;
  }

  // Apply weekend adjustments
  if (isWeekend && WEEKEND_ADJUSTMENTS[category]) {
    const adj = WEEKEND_ADJUSTMENTS[category];
    if (adj.shiftBusy && pattern.busy.includes(hour - adj.shiftBusy)) {
      level = 'busy';
      score = 35;
    }
    if (adj.extendBusy && pattern.busy.includes(hour - adj.extendBusy)) {
      level = 'busy';
      score = 40;
    }
  }

  // Adjust based on venue's base comfort score
  const baseComfort = venue.comfort_score || 60;
  if (baseComfort >= 75) {
    score = Math.min(100, score + 10);
  } else if (baseComfort < 50) {
    score = Math.max(0, score - 10);
  }

  // Confidence based on how specific our pattern is
  const confidence = category === 'default' ? 40 : 70;

  return { level, score, confidence };
}

/**
 * Get best times to visit a venue
 * @param {Object} venue - Venue data
 * @returns {Array} Array of { startHour, endHour, label, score }
 */
export function getBestTimes(venue) {
  const { pattern } = getVenuePattern(venue);
  const bestTimes = [];

  // Group consecutive quiet hours into windows
  let windowStart = null;

  for (let hour = 6; hour <= 22; hour++) {
    const isQuiet = pattern.quiet.includes(hour);

    if (isQuiet && windowStart === null) {
      windowStart = hour;
    } else if (!isQuiet && windowStart !== null) {
      bestTimes.push({
        startHour: windowStart,
        endHour: hour - 1,
        label: formatTimeWindow(windowStart, hour - 1),
        score: 85
      });
      windowStart = null;
    }
  }

  // Close any open window
  if (windowStart !== null) {
    bestTimes.push({
      startHour: windowStart,
      endHour: 22,
      label: formatTimeWindow(windowStart, 22),
      score: 85
    });
  }

  return bestTimes;
}

/**
 * Get hourly comfort data for a full day
 * @param {Object} venue - Venue data
 * @param {boolean} isWeekend - Whether it's a weekend
 * @returns {Array} Array of { hour, level, score } for hours 6-23
 */
export function getHourlyComfort(venue, isWeekend = false) {
  const hours = [];

  for (let hour = 6; hour <= 23; hour++) {
    const prediction = predictComfortByTime(venue, hour, isWeekend);
    hours.push({
      hour,
      ...prediction,
      label: formatHour(hour)
    });
  }

  return hours;
}

/**
 * Get a simple recommendation for when to visit
 * @param {Object} venue - Venue data
 * @returns {string} Recommendation text
 */
export function getTimeRecommendation(venue) {
  const bestTimes = getBestTimes(venue);

  if (bestTimes.length === 0) {
    return "This venue tends to have consistent crowd levels throughout the day.";
  }

  const primary = bestTimes[0];

  if (bestTimes.length === 1) {
    return `Best visited ${primary.label} when it's typically quietest.`;
  }

  return `Calmest ${primary.label} or ${bestTimes[1].label}.`;
}

/**
 * Format a time window for display
 */
function formatTimeWindow(startHour, endHour) {
  const start = formatHour(startHour);
  const end = formatHour(endHour);

  if (startHour === endHour) {
    return `around ${start}`;
  }

  return `${start}-${end}`;
}

/**
 * Format an hour for display (12h format)
 */
function formatHour(hour) {
  if (hour === 0 || hour === 24) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

/**
 * Get color for comfort level
 */
export function getComfortTimeColor(level) {
  switch (level) {
    case 'quiet':
      return '#5a7a52';
    case 'moderate':
      return '#c9b84a';
    case 'busy':
      return '#c95a4a';
    default:
      return '#9a9a9a';
  }
}
