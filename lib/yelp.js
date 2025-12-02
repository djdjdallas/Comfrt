/**
 * Yelp Fusion API Integration
 *
 * Uses Yelp's business search API to find venues
 * and enhances results with comfort scoring.
 */

import { calculateComfortScore, generateRecommendationReason } from './comfort-score';
import { formatPreferencesForAPI } from './preferences';
import { analyzeReviews, extractComfortQuotes, generateComfortSummary } from './review-analysis';
import { analyzeReviewsWithClaude, getClaudeRecommendation, getClaudeAttributes } from './claude-analysis';

const YELP_API_BASE = 'https://api.yelp.com/v3';

/**
 * Parse user message to extract search parameters
 */
function parseSearchQuery(message, savedLocation = '') {
  const lowerMessage = message.toLowerCase();

  // Extract location (look for "in [city]" pattern)
  let location = savedLocation || ''; // Use saved location as default
  const locationMatch = message.match(/in\s+([^,.\n]+(?:,\s*[A-Z]{2})?)/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }

  // If still no location, we'll need to ask the user
  if (!location) {
    location = 'New York, NY'; // Ultimate fallback
  }

  // Extract cuisine/category
  const cuisineKeywords = {
    'italian': 'italian',
    'japanese': 'japanese',
    'sushi': 'sushi',
    'chinese': 'chinese',
    'mexican': 'mexican',
    'thai': 'thai',
    'indian': 'indian',
    'french': 'french',
    'mediterranean': 'mediterranean',
    'coffee': 'coffee',
    'cafe': 'cafes',
    'tea': 'tea',
    'breakfast': 'breakfast_brunch',
    'brunch': 'breakfast_brunch',
    'lunch': 'restaurants',
    'dinner': 'restaurants',
    'restaurant': 'restaurants',
    'bar': 'bars',
    'pub': 'pubs',
  };

  let categories = '';
  for (const [keyword, category] of Object.entries(cuisineKeywords)) {
    if (lowerMessage.includes(keyword)) {
      categories = category;
      break;
    }
  }

  // Build search term from message
  let term = '';
  if (lowerMessage.includes('quiet')) term += 'quiet ';
  if (lowerMessage.includes('romantic') || lowerMessage.includes('date')) term += 'romantic ';
  if (lowerMessage.includes('cozy')) term += 'cozy ';
  if (lowerMessage.includes('peaceful') || lowerMessage.includes('calm')) term += 'quiet ';

  // Add cuisine type to term if found
  if (categories) {
    term += categories.replace('_', ' ');
  } else {
    term += 'restaurant';
  }

  return { term: term.trim(), location, categories };
}

/**
 * Search for venues using Yelp Fusion API
 */
export async function chatWithYelp(message, options = {}) {
  const { preferences = {} } = options;

  const apiKey = process.env.YELP_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Yelp API key not configured');
  }

  // Use saved location from preferences if available
  const savedLocation = preferences.location || '';
  const { term, location, categories } = parseSearchQuery(message, savedLocation);

  // Build search parameters
  const params = new URLSearchParams({
    term,
    location,
    limit: '10',
    sort_by: 'rating',
  });

  if (categories) {
    params.append('categories', categories);
  }

  // Add attributes for quieter venues
  params.append('attributes', 'reservation');

  try {
    const response = await fetch(`${YELP_API_BASE}/businesses/search?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yelp API Error:', response.status, errorText);
      throw new Error(`Yelp API error: ${response.status}`);
    }

    const data = await response.json();

    // Get top 6 businesses to fetch reviews for
    const topBusinesses = (data.businesses || []).slice(0, 6);

    console.log(`[chatWithYelp] Fetching reviews for ${topBusinesses.length} venues...`);

    // Fetch reviews for each venue in parallel
    const venuesWithReviews = await Promise.all(
      topBusinesses.map(async (venue) => {
        try {
          const reviewsResponse = await fetch(
            `${YELP_API_BASE}/businesses/${venue.id}/reviews?limit=10&sort_by=yelp_sort`,
            {
              headers: { 'Authorization': `Bearer ${apiKey}` },
            }
          );

          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            const reviews = reviewsData.reviews || [];

            console.log(`[chatWithYelp] ${venue.name}: Got ${reviews.length} reviews`);

            // Keyword-based analysis (fast, always runs)
            const reviewAnalysis = analyzeReviews(reviews);
            const comfortQuotes = extractComfortQuotes(reviews);

            return {
              ...venue,
              reviews,
              reviewAnalysis,
              comfortQuotes
            };
          }
        } catch (err) {
          console.log(`[chatWithYelp] Failed to get reviews for ${venue.name}:`, err.message);
        }
        return venue;
      })
    );

    // Run Claude analysis in parallel for all venues (if API key configured)
    console.log(`[chatWithYelp] Running Claude analysis on ${venuesWithReviews.length} venues...`);
    const venuesWithClaudeAnalysis = await Promise.all(
      venuesWithReviews.map(async (venue) => {
        if (venue.reviews && venue.reviews.length > 0) {
          const claudeAnalysis = await analyzeReviewsWithClaude(venue, venue.reviews);
          return { ...venue, claudeAnalysis };
        }
        return venue;
      })
    );

    // Enhance venues with comfort scores (now with Claude + keyword analysis!)
    const venues = venuesWithClaudeAnalysis
      .map(venue => enhanceVenueWithAllAnalysis(venue, preferences))
      .sort((a, b) => b.comfort_score - a.comfort_score)
      .slice(0, 5);

    // Generate conversational response with review insights
    const responseMessage = generateResponseWithReviews(message, venues, location);

    return {
      message: responseMessage,
      venues,
    };
  } catch (error) {
    console.error('Error calling Yelp API:', error);
    throw error;
  }
}

/**
 * Generate a conversational response based on the search results
 */
function generateResponse(query, venues, location) {
  if (venues.length === 0) {
    return `I couldn't find any venues matching your criteria in ${location}. Try searching for a different type of place or location.`;
  }

  const topVenue = venues[0];
  const comfortLevel = topVenue.comfort_score >= 70 ? 'calm and comfortable' : 'reasonably quiet';

  let response = `I found ${venues.length} ${comfortLevel} spots for you`;

  if (location) {
    response += ` in ${location}`;
  }

  response += `. `;

  if (topVenue.comfort_score >= 80) {
    response += `${topVenue.name} looks especially promising - it's known for its peaceful atmosphere.`;
  } else if (topVenue.comfort_score >= 60) {
    response += `${topVenue.name} has good reviews and should be a comfortable choice.`;
  } else {
    response += `These options should work well for what you're looking for.`;
  }

  return response;
}

/**
 * Generate response with actual review insights (Claude-enhanced)
 */
function generateResponseWithReviews(query, venues, location) {
  if (venues.length === 0) {
    return `I couldn't find any venues matching your criteria in ${location}. Try searching for a different type of place or location.`;
  }

  const topVenue = venues[0];
  const comfortLevel = topVenue.comfort_score >= 70 ? 'calm and comfortable' : 'reasonably quiet';

  let response = `I found ${venues.length} ${comfortLevel} spots for you`;

  if (location) {
    response += ` in ${location}`;
  }

  response += `. `;

  // Use Claude summary if available, otherwise fall back to keyword analysis
  if (topVenue.claudeAnalysis?.summary) {
    response += `${topVenue.name} stands out - ${topVenue.claudeAnalysis.summary}`;
  } else if (topVenue.reviewAnalysis?.highlights?.length > 0) {
    const highlight = topVenue.reviewAnalysis.highlights[0].text;
    response += `${topVenue.name} looks promising - reviewers describe it as "${highlight}".`;
  } else if (topVenue.comfort_score >= 80) {
    response += `${topVenue.name} looks especially promising based on its comfort profile.`;
  } else if (topVenue.comfort_score >= 60) {
    response += `${topVenue.name} should be a comfortable choice for you.`;
  } else {
    response += `These options should work well for what you're looking for.`;
  }

  return response;
}

/**
 * Enhance venue with review-based comfort scoring
 */
function enhanceVenueWithReviews(venue, preferences = {}) {
  const categories = venue.categories?.map(c => c.alias).join(' ') || '';

  // Start with category-based inference
  let inferredNoiseLevel = 'average';
  if (categories.includes('coffee') || categories.includes('tea') || categories.includes('cafe')) {
    inferredNoiseLevel = 'quiet';
  } else if (categories.includes('bar') || categories.includes('pub') || categories.includes('sports')) {
    inferredNoiseLevel = 'loud';
  } else if (venue.price === '$$$' || venue.price === '$$$$') {
    inferredNoiseLevel = 'quiet';
  }

  // If we have review analysis, use it to adjust
  let actualNoiseLevel = inferredNoiseLevel;
  if (venue.reviewAnalysis?.breakdown?.noise) {
    const noiseData = venue.reviewAnalysis.breakdown.noise;
    if (noiseData.mentions > 0) {
      if (noiseData.score >= 70) actualNoiseLevel = 'quiet';
      else if (noiseData.score >= 40) actualNoiseLevel = 'average';
      else actualNoiseLevel = 'loud';
    }
  }

  const enhancedVenue = {
    ...venue,
    noise_level: actualNoiseLevel,
    ambiance: venue.price === '$$$' || venue.price === '$$$$' ? ['intimate'] : ['casual'],
  };

  // Calculate base comfort score
  let { score } = calculateComfortScore(enhancedVenue, preferences);

  // Adjust score based on review analysis
  if (venue.reviewAnalysis && venue.reviewAnalysis.confidence > 0) {
    const reviewWeight = Math.min(venue.reviewAnalysis.confidence / 100, 0.4);
    score = Math.round(
      score * (1 - reviewWeight) +
      venue.reviewAnalysis.sentimentScore * reviewWeight
    );
  }

  // Generate recommendation reason from reviews
  const recommendationReason = generateReviewBasedReason(venue, preferences);

  return {
    ...enhancedVenue,
    comfort_score: score,
    recommendation_reason: recommendationReason,
    comfort_attributes: extractComfortAttributesFromReviews(venue),
  };
}

/**
 * Generate recommendation reason based on actual reviews
 */
function generateReviewBasedReason(venue, preferences = {}) {
  // If we have comfort quotes, use the best one
  if (venue.comfortQuotes?.length > 0) {
    const positiveQuote = venue.comfortQuotes.find(q => q.sentiment === 'positive');
    if (positiveQuote) {
      // Truncate if too long
      const text = positiveQuote.text.length > 60
        ? positiveQuote.text.substring(0, 60) + '...'
        : positiveQuote.text;
      return `"${text}"`;
    }
  }

  // If we have highlights from analysis
  if (venue.reviewAnalysis?.highlights?.length > 0) {
    const highlights = venue.reviewAnalysis.highlights.slice(0, 2).map(h => h.text);
    return `Reviewers mention: ${highlights.join(', ')}`;
  }

  // Fallback to category-based reason
  const categories = venue.categories?.map(c => c.alias).join(' ') || '';
  if (categories.includes('coffee') || categories.includes('cafe')) {
    return "Cafe atmosphere - typically good for focused work";
  }
  if (categories.includes('tea')) {
    return "Tea house setting - usually calm and relaxing";
  }
  if (venue.price === '$$$' || venue.price === '$$$$') {
    return "Upscale venue - typically quieter atmosphere";
  }

  return "Should match your comfort preferences";
}

/**
 * Extract comfort attributes from review analysis
 */
function extractComfortAttributesFromReviews(venue) {
  const attributes = [];

  // Use review analysis if available
  if (venue.reviewAnalysis?.breakdown) {
    const breakdown = venue.reviewAnalysis.breakdown;

    if (breakdown.noise?.score >= 60 && breakdown.noise?.mentions > 0) {
      attributes.push({ variant: 'quiet', label: 'Quiet' });
    } else if (breakdown.noise?.score < 40 && breakdown.noise?.mentions > 0) {
      attributes.push({ variant: 'quiet', label: 'Can be loud' });
    }

    if (breakdown.space?.score >= 60 && breakdown.space?.mentions > 0) {
      attributes.push({ variant: 'spacious', label: 'Spacious' });
    }

    if (breakdown.ambiance?.score >= 60 && breakdown.ambiance?.mentions > 0) {
      attributes.push({ variant: 'cozy', label: 'Cozy' });
    }
  } else {
    // Fallback to inferred attributes
    if (venue.noise_level === 'quiet') {
      attributes.push({ variant: 'quiet', label: 'Likely Quiet' });
    }
    attributes.push({ variant: 'cozy', label: 'Cozy' });
  }

  // Add category-based attributes
  const categories = venue.categories?.map(c => c.alias).join(' ') || '';
  if (categories.includes('coffee') || categories.includes('cafe')) {
    attributes.push({ variant: 'wifi', label: 'WiFi Likely' });
  }

  return attributes.slice(0, 4); // Max 4 attributes
}

/**
 * Enhance venue with Claude + keyword analysis (best of both)
 */
function enhanceVenueWithAllAnalysis(venue, preferences = {}) {
  const categories = venue.categories?.map(c => c.alias).join(' ') || '';

  // Determine noise level - Claude takes priority, then keyword analysis, then inference
  let noiseLevel = 'average';

  if (venue.claudeAnalysis?.noise_level) {
    // Claude's assessment
    noiseLevel = venue.claudeAnalysis.noise_level === 'quiet' ? 'quiet' :
                 venue.claudeAnalysis.noise_level === 'loud' ? 'loud' : 'average';
    console.log(`[enhance] ${venue.name}: Using Claude noise level: ${noiseLevel}`);
  } else if (venue.reviewAnalysis?.breakdown?.noise?.mentions > 0) {
    // Keyword analysis
    const noiseScore = venue.reviewAnalysis.breakdown.noise.score;
    noiseLevel = noiseScore >= 70 ? 'quiet' : noiseScore < 40 ? 'loud' : 'average';
  } else {
    // Category inference
    if (categories.includes('coffee') || categories.includes('tea') || categories.includes('cafe')) {
      noiseLevel = 'quiet';
    } else if (categories.includes('bar') || categories.includes('pub') || categories.includes('sports')) {
      noiseLevel = 'loud';
    } else if (venue.price === '$$$' || venue.price === '$$$$') {
      noiseLevel = 'quiet';
    }
  }

  const enhancedVenue = {
    ...venue,
    noise_level: noiseLevel,
    ambiance: venue.price === '$$$' || venue.price === '$$$$' ? ['intimate'] : ['casual'],
  };

  // Calculate comfort score - use Claude's if available
  let score;
  if (venue.claudeAnalysis?.comfort_score) {
    score = venue.claudeAnalysis.comfort_score;
    console.log(`[enhance] ${venue.name}: Using Claude comfort score: ${score}`);
  } else {
    const { score: baseScore } = calculateComfortScore(enhancedVenue, preferences);
    score = baseScore;

    // Adjust with keyword analysis if available
    if (venue.reviewAnalysis?.confidence > 0) {
      const reviewWeight = Math.min(venue.reviewAnalysis.confidence / 100, 0.4);
      score = Math.round(
        score * (1 - reviewWeight) +
        venue.reviewAnalysis.sentimentScore * reviewWeight
      );
    }
  }

  // Generate recommendation reason - Claude first, then keywords
  let recommendationReason;
  if (venue.claudeAnalysis) {
    const claudeRec = getClaudeRecommendation(venue.claudeAnalysis, venue);
    if (claudeRec) {
      recommendationReason = claudeRec;
      console.log(`[enhance] ${venue.name}: Using Claude recommendation`);
    }
  }
  if (!recommendationReason) {
    recommendationReason = generateReviewBasedReason(venue, preferences);
  }

  // Get attributes - Claude first, then keywords
  let attributes;
  if (venue.claudeAnalysis) {
    attributes = getClaudeAttributes(venue.claudeAnalysis);
    if (attributes.length === 0) {
      attributes = extractComfortAttributesFromReviews(venue);
    }
  } else {
    attributes = extractComfortAttributesFromReviews(venue);
  }

  // Add best time info if Claude provided it
  const bestTimes = venue.claudeAnalysis?.best_times || null;
  const bestFor = venue.claudeAnalysis?.best_for || null;
  const warnings = venue.claudeAnalysis?.warnings || null;

  return {
    ...enhancedVenue,
    comfort_score: score,
    recommendation_reason: recommendationReason,
    comfort_attributes: attributes,
    best_times: bestTimes,
    best_for: bestFor,
    sensory_warnings: warnings,
  };
}

/**
 * Enhance venue data with comfort score and attributes
 */
function enhanceVenue(venue, preferences = {}) {
  // Simulate noise level based on categories and price
  let inferredNoiseLevel = 'average';
  const categories = venue.categories?.map(c => c.alias).join(' ') || '';

  console.log(`[enhanceVenue] ${venue.name}:`, {
    categories,
    price: venue.price,
    hasReviews: !!venue.reviews
  });

  if (categories.includes('coffee') || categories.includes('tea') || categories.includes('cafe')) {
    inferredNoiseLevel = 'quiet';
  } else if (categories.includes('bar') || categories.includes('pub') || categories.includes('sports')) {
    inferredNoiseLevel = 'loud';
  } else if (venue.price === '$$$' || venue.price === '$$$$') {
    inferredNoiseLevel = 'quiet';
  }

  console.log(`[enhanceVenue] ${venue.name}: inferredNoiseLevel = ${inferredNoiseLevel}`);

  // Add inferred attributes
  const enhancedVenue = {
    ...venue,
    noise_level: inferredNoiseLevel,
    ambiance: venue.price === '$$$' || venue.price === '$$$$' ? ['intimate'] : ['casual'],
  };

  const { score } = calculateComfortScore(enhancedVenue, preferences);

  return {
    ...enhancedVenue,
    comfort_score: score,
    recommendation_reason: generateRecommendationReason(enhancedVenue, preferences),
    comfort_attributes: extractComfortAttributes(enhancedVenue),
  };
}

/**
 * Extract comfort-related attributes from venue data
 */
function extractComfortAttributes(venue) {
  const attributes = [];

  if (venue.noise_level === 'quiet') {
    attributes.push({ variant: 'quiet', label: 'Quiet' });
  } else if (venue.noise_level === 'average') {
    attributes.push({ variant: 'quiet', label: 'Moderate' });
  }

  if (venue.ambiance?.includes('intimate') || venue.ambiance?.includes('romantic')) {
    attributes.push({ variant: 'dim', label: 'Intimate' });
  }

  if (venue.ambiance?.includes('cozy') || venue.ambiance?.includes('casual')) {
    attributes.push({ variant: 'cozy', label: 'Cozy' });
  }

  const categories = venue.categories?.map(c => c.alias).join(' ') || '';
  if (categories.includes('coffee') || categories.includes('cafe')) {
    attributes.push({ variant: 'wifi', label: 'WiFi Likely' });
  }

  if (venue.price === '$$$' || venue.price === '$$$$') {
    attributes.push({ variant: 'spacious', label: 'Upscale' });
  }

  return attributes;
}

/**
 * Get venue details by ID
 */
export async function getVenueDetails(id) {
  const apiKey = process.env.YELP_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Yelp API key not configured');
  }

  const response = await fetch(`${YELP_API_BASE}/businesses/${id}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Yelp API error: ${response.status}`);
  }

  const venue = await response.json();
  return enhanceVenue(venue);
}

/**
 * Get reviews for a venue
 */
export async function getVenueReviews(id) {
  const apiKey = process.env.YELP_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Yelp API key not configured');
  }

  const response = await fetch(`${YELP_API_BASE}/businesses/${id}/reviews?limit=20&sort_by=yelp_sort`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Yelp API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get venue details with review analysis
 * This fetches both venue details and reviews, then analyzes them
 */
export async function getVenueWithAnalysis(id, preferences = {}) {
  const apiKey = process.env.YELP_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Yelp API key not configured');
  }

  // Fetch venue details and reviews in parallel
  const [venueResponse, reviewsResponse] = await Promise.all([
    fetch(`${YELP_API_BASE}/businesses/${id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    }),
    fetch(`${YELP_API_BASE}/businesses/${id}/reviews?limit=20&sort_by=yelp_sort`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
  ]);

  if (!venueResponse.ok) {
    throw new Error(`Yelp API error: ${venueResponse.status}`);
  }

  const venue = await venueResponse.json();
  let reviews = [];
  let reviewAnalysis = null;
  let comfortQuotes = [];

  // Try to get reviews (may fail for some venues)
  if (reviewsResponse.ok) {
    const reviewsData = await reviewsResponse.json();
    reviews = reviewsData.reviews || [];

    // Analyze reviews for comfort signals
    reviewAnalysis = analyzeReviews(reviews);
    comfortQuotes = extractComfortQuotes(reviews);
  }

  // Enhance venue with comfort score
  const enhancedVenue = enhanceVenue(venue, preferences);

  // If we have review analysis, adjust the comfort score
  if (reviewAnalysis && reviewAnalysis.confidence > 0) {
    // Blend the inferred score with review-based score
    const reviewWeight = Math.min(reviewAnalysis.confidence / 100, 0.5);
    const blendedScore = Math.round(
      enhancedVenue.comfort_score * (1 - reviewWeight) +
      reviewAnalysis.sentimentScore * reviewWeight
    );
    enhancedVenue.comfort_score = blendedScore;
    enhancedVenue.review_comfort_summary = generateComfortSummary(reviewAnalysis);
  }

  return {
    ...enhancedVenue,
    reviews,
    reviewAnalysis,
    comfortQuotes
  };
}
