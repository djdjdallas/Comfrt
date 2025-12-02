/**
 * Comfort Score Calculator
 *
 * Calculates a "Comfort Score" (0-100) for venues based on
 * Yelp attributes and user preferences.
 */

// Keywords that indicate sensory-friendly attributes
const POSITIVE_KEYWORDS = [
  'quiet', 'peaceful', 'calm', 'relaxing', 'serene', 'cozy',
  'intimate', 'soft', 'gentle', 'soothing', 'tranquil', 'spacious',
  'uncrowded', 'private', 'romantic', 'dim', 'ambient', 'comfortable',
  'low-key', 'chill', 'mellow', 'easygoing', 'laid-back',
];

const NEGATIVE_KEYWORDS = [
  'loud', 'noisy', 'crowded', 'busy', 'packed', 'hectic',
  'chaotic', 'bustling', 'energetic', 'lively', 'vibrant', 'party',
  'club', 'bar scene', 'sports bar', 'bright lights', 'flashy',
  'thumping', 'blaring', 'screaming', 'overwhelming',
];

// Ambiance score mapping
const AMBIANCE_SCORES = {
  intimate: 90,
  romantic: 85,
  cozy: 80,
  casual: 70,
  trendy: 50,
  classy: 65,
  hipster: 55,
  divey: 45,
  touristy: 40,
  upscale: 60,
};

// Noise level score mapping
const NOISE_SCORES = {
  quiet: 95,
  average: 65,
  loud: 30,
  very_loud: 10,
};

// Category base scores (some venues are naturally more sensory-friendly)
const CATEGORY_BASE_SCORES = {
  // Higher base scores
  cafes: 75,
  coffee: 75,
  tea: 80,
  bookstores: 85,
  libraries: 90,
  juice: 70,
  vegan: 70,
  vegetarian: 70,
  bakeries: 70,
  desserts: 65,
  breakfast: 65,

  // Medium base scores
  italian: 60,
  japanese: 65,
  sushi: 65,
  french: 65,
  mediterranean: 60,
  thai: 55,
  vietnamese: 60,
  indian: 55,
  chinese: 50,

  // Lower base scores (but can still be comfortable)
  bars: 35,
  pubs: 40,
  sports_bars: 20,
  clubs: 15,
  nightlife: 20,
  breweries: 45,
  mexican: 50,
  pizza: 45,
  burgers: 45,
  bbq: 40,
};

/**
 * Calculate comfort score for a venue
 */
export function calculateComfortScore(venue, preferences = {}) {
  let score = 50; // Start at neutral
  let factors = [];

  // 1. Noise level (major factor)
  if (venue.noise_level) {
    const noiseScore = NOISE_SCORES[venue.noise_level.toLowerCase()] || 50;
    const weight = preferences.noiseSensitivity ? preferences.noiseSensitivity / 5 : 0.6;
    score += (noiseScore - 50) * weight;
    factors.push({ factor: 'noise', impact: noiseScore - 50 });
  }

  // 2. Ambiance
  if (venue.ambiance) {
    const ambiances = Array.isArray(venue.ambiance) ? venue.ambiance : [venue.ambiance];
    const ambianceScores = ambiances
      .map(a => AMBIANCE_SCORES[a.toLowerCase()] || 50)
      .filter(Boolean);

    if (ambianceScores.length > 0) {
      const avgAmbiance = ambianceScores.reduce((a, b) => a + b, 0) / ambianceScores.length;
      score += (avgAmbiance - 50) * 0.3;
      factors.push({ factor: 'ambiance', impact: avgAmbiance - 50 });
    }
  }

  // 3. Category
  if (venue.categories) {
    const categories = Array.isArray(venue.categories)
      ? venue.categories.map(c => c.alias || c.title || c).filter(Boolean)
      : [venue.categories];

    let categoryScore = 50;
    for (const cat of categories) {
      const catLower = cat.toLowerCase().replace(/[^a-z]/g, '');
      for (const [key, value] of Object.entries(CATEGORY_BASE_SCORES)) {
        if (catLower.includes(key)) {
          categoryScore = Math.max(categoryScore, value);
          break;
        }
      }
    }
    score += (categoryScore - 50) * 0.2;
    factors.push({ factor: 'category', impact: categoryScore - 50 });
  }

  // 4. Review text analysis (if available)
  if (venue.reviews) {
    const reviewText = venue.reviews
      .map(r => r.text)
      .join(' ')
      .toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    for (const keyword of POSITIVE_KEYWORDS) {
      if (reviewText.includes(keyword)) positiveCount++;
    }
    for (const keyword of NEGATIVE_KEYWORDS) {
      if (reviewText.includes(keyword)) negativeCount++;
    }

    const reviewImpact = (positiveCount - negativeCount) * 3;
    score += Math.max(-20, Math.min(20, reviewImpact));
    factors.push({ factor: 'reviews', impact: reviewImpact });
  }

  // 5. Has outdoor seating (bonus for those needing escape options)
  if (venue.outdoor_seating || venue.attributes?.outdoor_seating) {
    score += 5;
    factors.push({ factor: 'outdoor', impact: 5 });
  }

  // 6. Takes reservations (indicates more controlled environment)
  if (venue.reservations || venue.attributes?.reservations) {
    score += 5;
    factors.push({ factor: 'reservations', impact: 5 });
  }

  // 7. Price level (higher price often correlates with quieter)
  if (venue.price) {
    const priceLevel = venue.price.length || venue.price;
    if (priceLevel >= 3) {
      score += 5;
    }
  }

  // Normalize to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    factors,
    label: getComfortLabel(score),
  };
}

/**
 * Get human-readable label for comfort score
 */
export function getComfortLabel(score) {
  if (score >= 80) return 'Very Calm';
  if (score >= 65) return 'Calm';
  if (score >= 50) return 'Moderate';
  if (score >= 35) return 'Lively';
  return 'Very Lively';
}

/**
 * Analyze text for comfort-related mentions
 */
export function analyzeReviewText(text) {
  const lowerText = text.toLowerCase();
  const found = {
    positive: [],
    negative: [],
  };

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      found.positive.push(keyword);
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      found.negative.push(keyword);
    }
  }

  return found;
}

/**
 * Generate recommendation reason based on venue attributes
 */
export function generateRecommendationReason(venue, preferences = {}) {
  const reasons = [];

  if (venue.noise_level === 'quiet') {
    reasons.push("Known for its peaceful, quiet atmosphere");
  }

  if (venue.ambiance?.includes('intimate') || venue.ambiance?.includes('cozy')) {
    reasons.push("Intimate setting perfect for focused conversation");
  }

  if (venue.outdoor_seating) {
    reasons.push("Outdoor seating available for when you need fresh air");
  }

  if (venue.reservations) {
    reasons.push("Takes reservations so you can plan your visit");
  }

  if (preferences.noiseSensitivity >= 4 && venue.comfort_score >= 70) {
    reasons.push("Highly rated for low noise levels");
  }

  return reasons.length > 0
    ? reasons[Math.floor(Math.random() * reasons.length)]
    : "A comfortable spot that matches your preferences";
}
