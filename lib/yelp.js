/**
 * Yelp Fusion API Integration
 *
 * Uses Yelp's business search API to find venues
 * and enhances results with comfort scoring.
 */

import { calculateComfortScore, generateRecommendationReason } from './comfort-score';
import { formatPreferencesForAPI } from './preferences';
import { analyzeReviews, extractComfortQuotes, generateComfortSummary } from './review-analysis';

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

    // Enhance venues with comfort scores
    const venues = (data.businesses || [])
      .map(venue => enhanceVenue(venue, preferences))
      .sort((a, b) => b.comfort_score - a.comfort_score) // Sort by comfort score
      .slice(0, 5); // Return top 5

    // Generate conversational response
    const responseMessage = generateResponse(message, venues, location);

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
 * Enhance venue data with comfort score and attributes
 */
function enhanceVenue(venue, preferences = {}) {
  // Simulate noise level based on categories and price
  let inferredNoiseLevel = 'average';
  const categories = venue.categories?.map(c => c.alias).join(' ') || '';

  if (categories.includes('coffee') || categories.includes('tea') || categories.includes('cafe')) {
    inferredNoiseLevel = 'quiet';
  } else if (categories.includes('bar') || categories.includes('pub') || categories.includes('sports')) {
    inferredNoiseLevel = 'loud';
  } else if (venue.price === '$$$' || venue.price === '$$$$') {
    inferredNoiseLevel = 'quiet';
  }

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
