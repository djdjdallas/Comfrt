/**
 * Follow-up Query Detection & Filtering
 *
 * Detects when a user's follow-up question is asking to filter existing results
 * vs. performing an entirely new search.
 */

// Patterns that indicate filtering intent (refining existing results)
const FILTER_PATTERNS = [
  // Attribute-based filters
  /\b(with|has|have|got)\s+(outdoor|patio|terrace|rooftop)\s*(seating|area|space)?/i,
  /\boutdoor\s*(seating|dining|patio|area)?\b/i,
  /\b(with|has|have|got)\s+(wifi|wi-fi|internet)/i,
  /\b(with|has|have|got)\s+reservations?\b/i,
  /\b(takes?|accepts?)\s+reservations?\b/i,
  /\bopen\s+(now|late|early|24)/i,
  /\b(cheaper|less expensive|budget|affordable)\b/i,
  /\b(fancier|nicer|upscale|high-end)\b/i,
  /\b(closer|nearby|nearer|walking distance)\b/i,
  /\b(quieter|more quiet|less noisy|calmer)\b/i,
  /\b(louder|more lively|energetic)\b/i,
  /\bhigher\s+rated\b/i,
  /\bbetter\s+reviews?\b/i,

  // Question words that reference previous results
  /\b(which|what about|how about)\s+(one|ones|of these|of those|them)\b/i,
  /\bany\s+(of\s+)?(them|these|those)\s+(with|have|has|got|open|take)/i,
  /\bdo\s+any\s+(of\s+)?(them|these|those)\b/i,
  /\bwhat\s+about\s+(the\s+)?(other|rest|remaining)\b/i,
  /\banything\s+(with|that\s+has|quieter|cheaper|closer|open)/i,
  /\bany\s+(other\s+)?options?\s+(with|that)/i,

  // Comparative/superlative asking about existing set
  /\bwhich\s+(is|are|one|ones)\s+(the\s+)?(quietest|cheapest|closest|best|highest)/i,
  /\bthe\s+(quietest|cheapest|closest|best|most)\s+(one|option|place|spot)/i,

  // Exclusion filters
  /\b(without|no|not|exclude)\s+(outdoor|patio|music|tv|sports)/i,
  /\bnot\s+too\s+(loud|noisy|crowded|busy|expensive)/i,
];

// Patterns that indicate a NEW search (different query entirely)
const NEW_SEARCH_PATTERNS = [
  // Different cuisine/type
  /\b(find|show|search|look for|get|recommend)\s+(me\s+)?(a|an|some)\b/i,
  /\bhow about\s+(a|an|some)\s+(different|other|new)\b/i,
  /\bwhat about\s+(mexican|italian|chinese|japanese|thai|indian|french|korean|vietnamese)/i,
  /\bswitch to\b/i,
  /\binstead\s+(of|,)\s*(find|show|search|get)/i,

  // Explicitly new search
  /\b(new|different|another)\s+(search|type|cuisine|kind|category)/i,
  /\bstart\s+(over|fresh|again)\b/i,
  /\bforget\s+(that|those|them)\b/i,

  // Location change
  /\bin\s+(a\s+)?different\s+(area|neighborhood|location|city)/i,
  /\bsomewhere\s+else\b/i,
];

// Attribute mappings for filtering
const ATTRIBUTE_FILTERS = {
  outdoor_seating: {
    patterns: [/outdoor/i, /patio/i, /terrace/i, /rooftop/i, /outside/i, /al\s*fresco/i],
    venueField: 'attributes.outdoor_seating',
    fallbackField: 'outdoor_seating',
    searchReviews: true, // Also search review text for this attribute
  },
  reservations: {
    patterns: [/reservations?/i, /book(ing)?/i],
    venueField: 'attributes.restaurants_reservations',
    fallbackField: 'reservations',
  },
  wifi: {
    patterns: [/wifi/i, /wi-fi/i, /internet/i],
    venueField: 'attributes.wifi',
    fallbackField: 'wifi',
  },
  quiet: {
    patterns: [/quiet/i, /calm/i, /peaceful/i, /less\s+noisy/i, /not\s+(too\s+)?loud/i],
    scoreFilter: (venue) => venue.comfort_score >= 60 || venue.noise_level === 'quiet',
  },
  price_low: {
    patterns: [/cheap/i, /budget/i, /affordable/i, /inexpensive/i, /less\s+expensive/i],
    scoreFilter: (venue) => venue.price === '$' || venue.price === '$$',
  },
  price_high: {
    patterns: [/fancy/i, /upscale/i, /high-end/i, /nice/i, /splurge/i],
    scoreFilter: (venue) => venue.price === '$$$' || venue.price === '$$$$',
  },
  open_now: {
    patterns: [/open\s+now/i, /currently\s+open/i, /still\s+open/i],
    venueField: 'hours[0].is_open_now',
    fallbackField: 'is_open_now',
  },
  higher_rated: {
    patterns: [/higher\s+rated/i, /better\s+review/i, /top\s+rated/i, /best\s+rated/i],
    scoreFilter: (venue) => venue.rating >= 4.5,
  },
};

/**
 * Analyze a message to determine if it's a filter request or new search
 * @param {string} message - The user's message
 * @param {boolean} hasExistingResults - Whether there are previous results to filter
 * @returns {Object} - { isFilter: boolean, isNewSearch: boolean, detectedFilters: string[], confidence: string }
 */
export function analyzeFollowUp(message, hasExistingResults = false) {
  if (!message || !hasExistingResults) {
    return {
      isFilter: false,
      isNewSearch: true,
      detectedFilters: [],
      confidence: 'high',
    };
  }

  const normalizedMessage = message.toLowerCase().trim();

  // Check for explicit new search patterns first
  for (const pattern of NEW_SEARCH_PATTERNS) {
    if (pattern.test(normalizedMessage)) {
      return {
        isFilter: false,
        isNewSearch: true,
        detectedFilters: [],
        confidence: 'high',
      };
    }
  }

  // Check for filter patterns
  const matchedFilterPatterns = [];
  for (const pattern of FILTER_PATTERNS) {
    if (pattern.test(normalizedMessage)) {
      matchedFilterPatterns.push(pattern.source);
    }
  }

  // Detect specific attribute filters
  const detectedFilters = [];
  for (const [filterName, config] of Object.entries(ATTRIBUTE_FILTERS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedMessage)) {
        detectedFilters.push(filterName);
        break;
      }
    }
  }

  // Determine confidence
  let confidence = 'low';
  if (matchedFilterPatterns.length >= 2 || detectedFilters.length >= 1) {
    confidence = 'high';
  } else if (matchedFilterPatterns.length === 1) {
    confidence = 'medium';
  }

  // Short messages with filter-like words are likely filters
  const wordCount = normalizedMessage.split(/\s+/).length;
  if (wordCount <= 6 && detectedFilters.length > 0) {
    confidence = 'high';
  }

  const isFilter = matchedFilterPatterns.length > 0 || detectedFilters.length > 0;

  return {
    isFilter,
    isNewSearch: !isFilter,
    detectedFilters,
    matchedPatterns: matchedFilterPatterns.length,
    confidence,
  };
}

/**
 * Filter venues based on detected filter criteria
 * @param {Array} venues - Array of venue objects from previous search
 * @param {Array} filterNames - Array of filter names to apply (from analyzeFollowUp)
 * @returns {Object} - { filtered: Array, applied: Array, noMatch: boolean }
 */
export function filterVenues(venues, filterNames) {
  if (!venues || venues.length === 0 || !filterNames || filterNames.length === 0) {
    return { filtered: venues, applied: [], noMatch: false };
  }

  let filteredVenues = [...venues];
  const appliedFilters = [];

  for (const filterName of filterNames) {
    const config = ATTRIBUTE_FILTERS[filterName];
    if (!config) continue;

    const beforeCount = filteredVenues.length;

    if (config.scoreFilter) {
      // Use custom score filter function
      filteredVenues = filteredVenues.filter(config.scoreFilter);
    } else {
      // Use field-based filter
      filteredVenues = filteredVenues.filter(venue => {
        // Check nested attribute path
        if (config.venueField) {
          const value = getNestedValue(venue, config.venueField);
          if (value === true || (typeof value === 'string' && value !== 'no' && value !== 'none')) {
            return true;
          }
        }
        // Check fallback field
        if (config.fallbackField) {
          const value = venue[config.fallbackField];
          if (value === true || (typeof value === 'string' && value !== 'no' && value !== 'none')) {
            return true;
          }
        }
        // Check comfort_attributes array
        if (venue.comfort_attributes) {
          const attrLabels = venue.comfort_attributes.map(a => a.label?.toLowerCase() || '');
          const attrVariants = venue.comfort_attributes.map(a => a.variant?.toLowerCase() || '');

          for (const pattern of config.patterns) {
            if (attrLabels.some(l => pattern.test(l)) || attrVariants.some(v => pattern.test(v))) {
              return true;
            }
          }
        }
        // Search review text if configured (Yelp AI often has info in reviews, not structured data)
        if (config.searchReviews) {
          const textToSearch = [
            venue.recommendation_reason || '',
            venue.claudeAnalysis?.summary || '',
            venue.review_comfort_summary || '',
            ...(venue.reviews || []).map(r => r.text || ''),
            ...(venue.comfortQuotes || []).map(q => q.text || ''),
          ].join(' ').toLowerCase();

          for (const pattern of config.patterns) {
            if (pattern.test(textToSearch)) {
              return true;
            }
          }
        }
        return false;
      });
    }

    if (filteredVenues.length < beforeCount) {
      appliedFilters.push(filterName);
    }
  }

  return {
    filtered: filteredVenues,
    applied: appliedFilters,
    noMatch: filteredVenues.length === 0 && appliedFilters.length > 0,
  };
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj, path) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Generate a response message for filtered results
 * @param {Array} filteredVenues - The filtered venue array
 * @param {Array} appliedFilters - Names of filters that were applied
 * @param {Array} originalVenues - The original venue array before filtering
 * @returns {string} - A natural language response
 */
export function generateFilterResponse(filteredVenues, appliedFilters, originalVenues) {
  const filterLabels = {
    outdoor_seating: 'outdoor seating',
    reservations: 'reservations',
    wifi: 'WiFi',
    quiet: 'quieter atmosphere',
    price_low: 'budget-friendly prices',
    price_high: 'upscale dining',
    open_now: 'currently open',
    higher_rated: 'higher ratings',
  };

  const appliedLabels = appliedFilters.map(f => filterLabels[f] || f).join(' and ');

  if (filteredVenues.length === 0) {
    return `Unfortunately, none of the ${originalVenues.length} places I found have ${appliedLabels}. Would you like me to search for new options with that requirement?`;
  }

  if (filteredVenues.length === 1) {
    return `Out of the options I found, ${filteredVenues[0].name} has ${appliedLabels}:`;
  }

  return `I found ${filteredVenues.length} places with ${appliedLabels}:`;
}
