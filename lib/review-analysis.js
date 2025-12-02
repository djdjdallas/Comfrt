/**
 * AI-Powered Review Analysis
 *
 * Analyzes Yelp reviews to extract comfort-related signals
 * for sensory-sensitive users.
 */

// Comfort signal keywords organized by category
const COMFORT_SIGNALS = {
  positive: {
    noise: [
      'quiet', 'peaceful', 'calm', 'silent', 'soft music', 'low music',
      'no music', 'relaxing', 'serene', 'hushed', 'tranquil', 'soothing',
      'can hear yourself think', 'conversation friendly', 'not loud'
    ],
    lighting: [
      'dim', 'soft lighting', 'candlelit', 'cozy lighting', 'not too bright',
      'warm lighting', 'ambient', 'gentle light', 'romantic lighting',
      'natural light', 'soft glow', 'low lighting'
    ],
    space: [
      'spacious', 'uncrowded', 'private', 'secluded', 'intimate', 'roomy',
      'plenty of space', 'not packed', 'spread out', 'comfortable seating',
      'booth', 'corner table', 'tucked away', 'never crowded'
    ],
    ambiance: [
      'relaxing', 'soothing', 'tranquil', 'serene', 'chill', 'laid back',
      'cozy', 'comfortable', 'welcoming', 'pleasant', 'mellow', 'zen',
      'stress-free', 'easy going', 'perfect for working', 'great for reading'
    ],
    sensory: [
      'not overwhelming', 'easy on the senses', 'calming atmosphere',
      'no strong smells', 'fresh air', 'well-ventilated', 'clean',
      'comfortable temperature', 'not stuffy'
    ]
  },
  negative: {
    noise: [
      'loud', 'noisy', 'blasting music', 'screaming', 'chaotic', 'deafening',
      'can\'t hear', 'yelling', 'rowdy', 'boisterous', 'ear-splitting',
      'obnoxious music', 'too loud', 'very noisy', 'loud crowd'
    ],
    lighting: [
      'harsh', 'bright lights', 'fluorescent', 'glaring', 'too bright',
      'blinding', 'sterile lighting', 'clinical', 'no ambiance'
    ],
    space: [
      'crowded', 'packed', 'cramped', 'tiny', 'shoulder to shoulder',
      'elbow to elbow', 'sardines', 'no room', 'claustrophobic',
      'long wait', 'always busy', 'jam packed', 'standing room only'
    ],
    ambiance: [
      'hectic', 'stressful', 'overwhelming', 'chaotic', 'frantic',
      'rushed', 'uncomfortable', 'tense', 'anxiety-inducing', 'crazy busy'
    ],
    sensory: [
      'overwhelming', 'overstimulating', 'strong smells', 'stuffy',
      'bad ventilation', 'greasy smell', 'too hot', 'freezing cold',
      'sensory overload'
    ]
  }
};

// Weights for different categories
const CATEGORY_WEIGHTS = {
  noise: 0.35,
  lighting: 0.15,
  space: 0.25,
  ambiance: 0.15,
  sensory: 0.10
};

/**
 * Analyze reviews for comfort signals
 * @param {Array} reviews - Array of review objects with 'text' property
 * @returns {Object} Analysis results with scores and highlights
 */
export function analyzeReviews(reviews) {
  if (!reviews || reviews.length === 0) {
    return {
      sentimentScore: 50,
      confidence: 0,
      highlights: [],
      concerns: [],
      breakdown: {
        noise: { score: 50, mentions: 0 },
        lighting: { score: 50, mentions: 0 },
        space: { score: 50, mentions: 0 },
        ambiance: { score: 50, mentions: 0 },
        sensory: { score: 50, mentions: 0 }
      }
    };
  }

  const allText = reviews.map(r => r.text?.toLowerCase() || '').join(' ');

  const categoryScores = {};
  const highlights = [];
  const concerns = [];

  // Analyze each category
  for (const category of Object.keys(CATEGORY_WEIGHTS)) {
    const positiveKeywords = COMFORT_SIGNALS.positive[category];
    const negativeKeywords = COMFORT_SIGNALS.negative[category];

    let positiveCount = 0;
    let negativeCount = 0;

    // Count positive mentions
    for (const keyword of positiveKeywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = allText.match(regex);
      if (matches) {
        positiveCount += matches.length;
        if (highlights.length < 5 && !highlights.some(h => h.text.includes(keyword))) {
          highlights.push({
            category,
            text: keyword,
            sentiment: 'positive',
            icon: getCategoryIcon(category)
          });
        }
      }
    }

    // Count negative mentions
    for (const keyword of negativeKeywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = allText.match(regex);
      if (matches) {
        negativeCount += matches.length;
        if (concerns.length < 3 && !concerns.some(c => c.text.includes(keyword))) {
          concerns.push({
            category,
            text: keyword,
            sentiment: 'negative',
            icon: getCategoryIcon(category)
          });
        }
      }
    }

    // Calculate category score (0-100)
    const totalMentions = positiveCount + negativeCount;
    let score = 50; // Neutral default

    if (totalMentions > 0) {
      score = Math.round((positiveCount / totalMentions) * 100);
    }

    categoryScores[category] = {
      score,
      mentions: totalMentions,
      positive: positiveCount,
      negative: negativeCount
    };
  }

  // Calculate overall sentiment score (weighted)
  let weightedSum = 0;
  let totalWeight = 0;
  let totalMentions = 0;

  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const catScore = categoryScores[category];
    if (catScore.mentions > 0) {
      weightedSum += catScore.score * weight * Math.min(catScore.mentions, 5);
      totalWeight += weight * Math.min(catScore.mentions, 5);
    }
    totalMentions += catScore.mentions;
  }

  const sentimentScore = totalWeight > 0
    ? Math.round(weightedSum / totalWeight)
    : 50;

  // Confidence based on number of mentions
  const confidence = Math.min(100, Math.round((totalMentions / reviews.length) * 25));

  return {
    sentimentScore,
    confidence,
    totalMentions,
    reviewCount: reviews.length,
    highlights: highlights.slice(0, 5),
    concerns: concerns.slice(0, 3),
    breakdown: categoryScores
  };
}

/**
 * Extract specific comfort quotes from reviews
 * @param {Array} reviews - Array of review objects
 * @returns {Array} Notable quotes about comfort
 */
export function extractComfortQuotes(reviews) {
  if (!reviews || reviews.length === 0) return [];

  const quotes = [];
  const allKeywords = [
    ...Object.values(COMFORT_SIGNALS.positive).flat(),
    ...Object.values(COMFORT_SIGNALS.negative).flat()
  ];

  for (const review of reviews.slice(0, 10)) {
    const text = review.text || '';
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 150) {
        const lower = trimmed.toLowerCase();
        for (const keyword of allKeywords) {
          if (lower.includes(keyword)) {
            const isPositive = Object.values(COMFORT_SIGNALS.positive)
              .flat()
              .some(k => lower.includes(k));

            quotes.push({
              text: trimmed,
              sentiment: isPositive ? 'positive' : 'negative',
              keyword,
              user: review.user?.name || 'Anonymous'
            });
            break;
          }
        }
      }
      if (quotes.length >= 5) break;
    }
    if (quotes.length >= 5) break;
  }

  return quotes;
}

/**
 * Get icon name for category
 */
function getCategoryIcon(category) {
  const icons = {
    noise: 'volume',
    lighting: 'sun',
    space: 'users',
    ambiance: 'heart',
    sensory: 'wind'
  };
  return icons[category] || 'circle';
}

/**
 * Get comfort label from score
 */
export function getComfortLabel(score) {
  if (score >= 80) return { label: 'Very Calm', color: '#5a7a52' };
  if (score >= 65) return { label: 'Calm', color: '#7a9a52' };
  if (score >= 50) return { label: 'Moderate', color: '#9a9a52' };
  if (score >= 35) return { label: 'Lively', color: '#9a7a52' };
  return { label: 'Very Lively', color: '#9a5a52' };
}

/**
 * Generate a comfort summary from analysis
 */
export function generateComfortSummary(analysis) {
  if (!analysis || analysis.confidence === 0) {
    return "We don't have enough review data to assess comfort levels for this venue.";
  }

  const { sentimentScore, highlights, concerns, breakdown } = analysis;
  const parts = [];

  // Overall assessment
  if (sentimentScore >= 70) {
    parts.push("Reviewers frequently mention this as a comfortable, calm spot.");
  } else if (sentimentScore >= 50) {
    parts.push("Reviews suggest this venue has moderate comfort levels.");
  } else {
    parts.push("Reviews indicate this venue may be more lively or stimulating.");
  }

  // Highlights
  if (highlights.length > 0) {
    const topHighlight = highlights[0];
    parts.push(`People often note it's "${topHighlight.text}".`);
  }

  // Concerns
  if (concerns.length > 0) {
    const topConcern = concerns[0];
    parts.push(`Some mention it can be "${topConcern.text}" at times.`);
  }

  // Specific category insights
  if (breakdown.noise.score >= 70 && breakdown.noise.mentions >= 2) {
    parts.push("Noise levels are generally kept low here.");
  }
  if (breakdown.space.score >= 70 && breakdown.space.mentions >= 2) {
    parts.push("The space feels uncrowded and comfortable.");
  }

  return parts.join(' ');
}
