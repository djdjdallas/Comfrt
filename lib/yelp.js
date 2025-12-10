/**
 * Yelp Fusion API Integration
 *
 * Uses Yelp's business search API to find venues
 * and enhances results with comfort scoring.
 */

import { calculateComfortScore, generateRecommendationReason } from './comfort-score';
import { formatPreferencesForAPI } from './preferences';
import { analyzeReviews, extractComfortQuotes, generateComfortSummary } from './review-analysis';
import { analyzeVenueWithClaude, getClaudeRecommendation, getClaudeAttributes } from './claude-analysis';

/**
 * Strip Yelp AI highlight markers from text
 */
function cleanYelpText(text) {
  if (!text) return '';
  return text.replace(/\[\[HIGHLIGHT\]\]/g, '').replace(/\[\[ENDHIGHLIGHT\]\]/g, '');
}

/**
 * Build a description from Yelp business attributes for Claude to analyze
 */
function buildVenueDescription(venue) {
  const parts = [];

  // Basic info
  parts.push(`${venue.name} is a ${venue.categories?.map(c => c.title).join(', ') || 'venue'}`);

  if (venue.price) {
    parts.push(`Price: ${venue.price}`);
  }

  // Location
  if (venue.location?.display_address) {
    parts.push(`Location: ${venue.location.display_address.join(', ')}`);
  }

  // Rating and reviews
  if (venue.rating) {
    parts.push(`Yelp rating: ${venue.rating}/5 with ${venue.review_count || 0} reviews`);
  }

  // Hours
  if (venue.hours?.[0]?.is_open_now !== undefined) {
    parts.push(`Currently ${venue.hours[0].is_open_now ? 'open' : 'closed'}`);
  }

  // Attributes (this is gold for comfort analysis)
  if (venue.attributes) {
    const attrs = venue.attributes;

    // Noise level
    if (attrs.noise_level) {
      parts.push(`Noise level: ${attrs.noise_level}`);
    }

    // Ambiance
    if (attrs.ambience) {
      const ambience = typeof attrs.ambience === 'object'
        ? Object.entries(attrs.ambience).filter(([k, v]) => v).map(([k]) => k).join(', ')
        : attrs.ambience;
      if (ambience) parts.push(`Ambience: ${ambience}`);
    }

    // Good for
    if (attrs.good_for_groups !== undefined) {
      parts.push(`Good for groups: ${attrs.good_for_groups ? 'yes' : 'no'}`);
    }
    if (attrs.good_for_kids !== undefined) {
      parts.push(`Good for kids: ${attrs.good_for_kids ? 'yes' : 'no'}`);
    }

    // Reservations
    if (attrs.restaurants_reservations !== undefined) {
      parts.push(`Takes reservations: ${attrs.restaurants_reservations ? 'yes' : 'no'}`);
    }

    // Outdoor seating
    if (attrs.outdoor_seating !== undefined) {
      parts.push(`Outdoor seating: ${attrs.outdoor_seating ? 'yes' : 'no'}`);
    }

    // WiFi
    if (attrs.wifi) {
      parts.push(`WiFi: ${attrs.wifi}`);
    }

    // Music
    if (attrs.music) {
      const music = typeof attrs.music === 'object'
        ? Object.entries(attrs.music).filter(([k, v]) => v).map(([k]) => k).join(', ')
        : attrs.music;
      if (music) parts.push(`Music: ${music}`);
    }
  }

  // Special features
  if (venue.transactions?.length > 0) {
    parts.push(`Services: ${venue.transactions.join(', ')}`);
  }

  const description = parts.join('. ');
  return description;
}

const YELP_AI_API_URL = 'https://api.yelp.com/ai/chat/v2';
const YELP_API_BASE = 'https://api.yelp.com/v3';

/**
 * Chat with Yelp AI API - conversational venue discovery
 * Uses Yelp's AI-powered chat endpoint for natural language queries
 */
export async function chatWithYelp(message, options = {}) {
  const { preferences = {}, chatId = null, latitude = null, longitude = null } = options;

  const apiKey = process.env.YELP_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Yelp API key not configured');
  }

  // Build the query - use zipcode for precise location matching
  let query = message;
  const hasCoordinates = (latitude && longitude) || (preferences.latitude && preferences.longitude);

  // Prefer zip code for precision (avoids Venice, CA vs Venice, Italy issues)
  const savedZipCode = preferences.zipCode; // e.g., "90291"
  const savedLocation = preferences.location; // e.g., "Venice, CA"

  // If we have a zipcode, always append it to disambiguate location
  // This ensures "Venice" searches in Venice, CA (90291) not Venice, Italy
  if (savedZipCode) {
    const lowerMessage = message.toLowerCase();
    // Check if query already has a location mention
    if (lowerMessage.includes('near me') || lowerMessage.includes('nearby')) {
      // Replace "near me" with the zipcode
      query = message.replace(/near me|nearby/gi, `in ${savedZipCode}`);
    } else if (lowerMessage.match(/\bin\s+[a-z]/i)) {
      // Query has a location like "in Venice" - append zipcode for disambiguation
      query = `${message} ${savedZipCode}`;
    } else {
      // No location in query - add zipcode
      query = `${message} in ${savedZipCode}`;
    }
  } else if (savedLocation && !hasCoordinates) {
    // No zipcode, fall back to city name if no coordinates
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('near me') || lowerMessage.includes('nearby') ||
        !lowerMessage.match(/\bin\s+[a-z]/i)) {
      query = `${message} in ${savedLocation}`;
    }
  }

  // Build the request body for Yelp AI Chat API
  const requestBody = {
    query: query,
  };

  // Add user context if location coordinates are available
  if (latitude && longitude) {
    requestBody.user_context = {
      locale: 'en_US',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
  } else if (preferences.latitude && preferences.longitude) {
    requestBody.user_context = {
      locale: 'en_US',
      latitude: parseFloat(preferences.latitude),
      longitude: parseFloat(preferences.longitude),
    };
  }

  // Include chat_id for multi-turn conversations
  if (chatId) {
    requestBody.chat_id = chatId;
  }

  try {
    const response = await fetch(YELP_AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yelp AI API Error:', response.status, errorText);
      throw new Error(`Yelp AI API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the AI-generated response text
    const aiMessage = data.response?.text || 'I found some options for you.';

    // Extract businesses from entities (includes contextual_info with review snippets)
    let businesses = [];
    if (data.entities && Array.isArray(data.entities)) {
      for (const entity of data.entities) {
        if (entity.businesses && Array.isArray(entity.businesses)) {
          businesses = businesses.concat(entity.businesses);
        }
      }
    }

    // === LOGGING: Yelp AI Response ===
    console.log('\n' + '='.repeat(60));
    console.log('🔍 COMFRT SEARCH ANALYSIS');
    console.log('='.repeat(60));
    console.log(`📝 Query sent to Yelp: "${query}"`);
    console.log(`📍 Businesses returned from Yelp AI: ${businesses.length}`);

    // Enhance venues with comfort analysis if we have businesses
    let venues = [];
    if (businesses.length > 0) {
      // Make a follow-up query to get detailed reviews for comfort analysis
      console.log('\n📝 Requesting detailed reviews from Yelp AI...');

      const businessNames = businesses.slice(0, 6).map(b => b.name).join(', ');
      const followUpQuery = `Tell me about the atmosphere, noise levels, and customer reviews for these places: ${businessNames}. What do reviewers say about the ambiance?`;

      const followUpResponse = await fetch(YELP_AI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: followUpQuery,
          chat_id: data.chat_id, // Continue the conversation
        }),
      });

      let reviewsData = {};
      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        console.log('✅ Got detailed reviews from Yelp AI');

        // Extract review snippets from the follow-up response
        if (followUpData.entities) {
          for (const entity of followUpData.entities) {
            if (entity.businesses) {
              for (const biz of entity.businesses) {
                reviewsData[biz.id] = {
                  review_snippet: biz.contextual_info?.review_snippet || '',
                  review_snippets: biz.contextual_info?.review_snippets || [],
                  photos: biz.contextual_info?.photos || [],
                };
              }
            }
          }
        }
      } else {
        console.log('⚠️  Follow-up query failed, using initial review snippets');
      }

      console.log(`\n📊 Processing top ${Math.min(businesses.length, 6)} venues for detailed analysis...`);
      console.log('-'.repeat(60));

      // Process each business with review data from Yelp AI
      const venuesWithDetails = businesses.slice(0, 6).map((business, index) => {
        // Get review data - prefer follow-up data, fall back to initial contextual_info
        const followUpReviews = reviewsData[business.id];
        const contextualInfo = business.contextual_info || {};

        // Build reviews array from contextual_info
        let reviews = [];
        const reviewSnippets = followUpReviews?.review_snippets || contextualInfo.review_snippets || [];

        // Convert review_snippets to our review format
        reviews = reviewSnippets.map(snippet => ({
          id: snippet.review_id,
          text: cleanYelpText(snippet.comment),
          rating: snippet.rating || 0,
          user: { name: 'Yelp User' },
        }));

        // Also add the main review_snippet as a review if we don't have snippets
        const mainSnippet = followUpReviews?.review_snippet || contextualInfo.review_snippet || '';
        if (reviews.length === 0 && mainSnippet) {
          reviews.push({
            id: 'snippet',
            text: cleanYelpText(mainSnippet),
            rating: business.rating || 4,
            user: { name: 'Yelp User' },
          });
        }

        // === LOGGING: Review data ===
        console.log(`\n[${index + 1}] ${business.name}`);
        console.log(`    🔑 Business ID: ${business.id}`);
        console.log(`    📄 Reviews from Yelp AI: ${reviews.length}`);
        if (mainSnippet) {
          const cleanSnippet = cleanYelpText(mainSnippet);
          console.log(`    💬 Snippet: "${cleanSnippet.substring(0, 80)}..."`);
        }

        // Analyze reviews for comfort signals
        const reviewAnalysis = analyzeReviews(reviews);
        const comfortQuotes = extractComfortQuotes(reviews);

        // === LOGGING: Review analysis results ===
        console.log(`    📈 Keyword analysis: ${reviewAnalysis.totalMentions || 0} comfort-related mentions`);
        if (reviewAnalysis.highlights?.length > 0) {
          console.log(`    ✅ Highlights: ${reviewAnalysis.highlights.map(h => h.text).join(', ')}`);
        }
        if (reviewAnalysis.concerns?.length > 0) {
          console.log(`    ⚠️  Concerns: ${reviewAnalysis.concerns.map(c => c.text).join(', ')}`);
        }

        // Get photos from contextual_info
        const photos = contextualInfo.photos || [];
        const imageUrl = photos[0]?.original_url || business.image_url;

        return {
          ...business,
          reviews,
          reviewAnalysis,
          comfortQuotes,
          venueDescription: buildVenueDescription(business),
          image_url: imageUrl,
          categories: business.categories || [],
          location: business.location || {},
        };
      });

      // Run Claude analysis for comfort scoring
      console.log('\n' + '-'.repeat(60));
      console.log('🤖 Running Claude AI analysis on each venue...');

      const venuesWithClaudeAnalysis = await Promise.all(
        venuesWithDetails.map(async (venue, index) => {
          const reviewCount = venue.reviews?.length || 0;
          const claudeAnalysis = await analyzeVenueWithClaude(venue, venue.reviews || []);

          // === LOGGING: Claude analysis results ===
          if (claudeAnalysis) {
            console.log(`    [${index + 1}] ${venue.name}: Claude score=${claudeAnalysis.comfort_score}, noise="${claudeAnalysis.noise_level}", reviews sent=${Math.min(reviewCount, 8)}`);
          } else {
            console.log(`    [${index + 1}] ${venue.name}: Claude analysis skipped (no API key or data)`);
          }

          return { ...venue, claudeAnalysis };
        })
      );

      // Enhance with comfort scores
      venues = venuesWithClaudeAnalysis
        .map(venue => enhanceVenueWithAllAnalysis(venue, preferences))
        .sort((a, b) => b.comfort_score - a.comfort_score)
        .slice(0, 5);

      // === LOGGING: Final results ===
      console.log('\n' + '-'.repeat(60));
      console.log('🏆 FINAL RESULTS (sorted by comfort score):');
      venues.forEach((v, i) => {
        console.log(`    ${i + 1}. ${v.name} - Comfort: ${v.comfort_score}, Reviews analyzed: ${v.reviews?.length || 0}`);
      });
      console.log('='.repeat(60) + '\n');
    }

    return {
      message: aiMessage,
      venues,
      chatId: data.chat_id, // Return chat_id for conversation continuity
      types: data.types || [],
    };
  } catch (error) {
    console.error('Error calling Yelp AI API:', error);
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
    const claudeRec = getClaudeRecommendation(venue.claudeAnalysis);
    if (claudeRec) {
      recommendationReason = claudeRec;
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
  // Determine noise level based on categories and price
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
 * Uses Yelp AI Chat to get reviews (more reliable than Reviews API)
 */
export async function getVenueWithAnalysis(id, preferences = {}) {
  const apiKey = process.env.YELP_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Yelp API key not configured');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📍 VENUE DETAIL ANALYSIS');
  console.log('='.repeat(60));
  console.log(`🔑 Venue ID: ${id}`);

  // First, get basic venue details from Yelp Fusion API
  const venueResponse = await fetch(`${YELP_API_BASE}/businesses/${id}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!venueResponse.ok) {
    const errorText = await venueResponse.text();
    console.log(`❌ Venue API error (${venueResponse.status}): ${errorText.substring(0, 100)}`);
    throw new Error(`Yelp API error: ${venueResponse.status}`);
  }

  const venue = await venueResponse.json();
  console.log(`📍 Venue: ${venue.name}`);

  // Use Yelp AI Chat to get reviews (more reliable than Reviews API)
  console.log('📝 Requesting reviews from Yelp AI...');

  let reviews = [];
  let reviewAnalysis = null;
  let comfortQuotes = [];

  try {
    const reviewQuery = `Tell me about the reviews, atmosphere, noise levels, and customer experience at ${venue.name} in ${venue.location?.city || 'this area'}. What do people say about the ambiance and comfort?`;

    const aiResponse = await fetch(YELP_AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: reviewQuery }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();

      // Find the matching business in the response
      let matchingBusiness = null;
      if (aiData.entities) {
        for (const entity of aiData.entities) {
          if (entity.businesses) {
            // Try to match by ID or name
            matchingBusiness = entity.businesses.find(b =>
              b.id === id || b.alias === id || b.name === venue.name
            );
            if (matchingBusiness) break;
          }
        }
      }

      if (matchingBusiness?.contextual_info) {
        const contextualInfo = matchingBusiness.contextual_info;

        // Extract review snippets
        const reviewSnippets = contextualInfo.review_snippets || [];
        reviews = reviewSnippets.map(snippet => ({
          id: snippet.review_id,
          text: cleanYelpText(snippet.comment),
          rating: snippet.rating || 0,
          user: { name: 'Yelp User' },
        }));

        // Add main snippet if no detailed snippets
        const mainSnippet = contextualInfo.review_snippet || '';
        if (reviews.length === 0 && mainSnippet) {
          reviews.push({
            id: 'snippet',
            text: cleanYelpText(mainSnippet),
            rating: venue.rating || 4,
            user: { name: 'Yelp User' },
          });
        }

        console.log(`📄 Reviews from Yelp AI: ${reviews.length}`);
        if (mainSnippet) {
          const cleanSnippet = cleanYelpText(mainSnippet);
          console.log(`💬 Snippet: "${cleanSnippet.substring(0, 80)}..."`);
        }
      } else {
        console.log('⚠️  No matching business found in Yelp AI response');
      }
    } else {
      console.log('⚠️  Yelp AI request failed, proceeding without reviews');
    }
  } catch (err) {
    console.log(`⚠️  Error getting reviews from Yelp AI: ${err.message}`);
  }

  // Analyze reviews for comfort signals
  reviewAnalysis = analyzeReviews(reviews);
  comfortQuotes = extractComfortQuotes(reviews);
  console.log(`📈 Keyword mentions: ${reviewAnalysis.totalMentions || 0}`);

  // Build venue description for Claude
  const venueDescription = buildVenueDescription(venue);

  // Run Claude analysis for deeper comfort insights
  console.log('🤖 Running Claude analysis...');
  const claudeAnalysis = await analyzeVenueWithClaude(
    { ...venue, venueDescription },
    reviews
  );

  if (claudeAnalysis) {
    console.log(`✅ Claude score: ${claudeAnalysis.comfort_score}, noise: "${claudeAnalysis.noise_level}"`);
    console.log(`📝 Summary: ${claudeAnalysis.summary}`);
  } else {
    console.log('⚠️  Claude analysis not available');
  }

  // Enhance venue with comfort score
  const enhancedVenue = enhanceVenue(venue, preferences);

  // Use Claude analysis if available, otherwise fall back to keyword analysis
  if (claudeAnalysis) {
    enhancedVenue.comfort_score = claudeAnalysis.comfort_score;
    enhancedVenue.noise_level = claudeAnalysis.noise_level;
    enhancedVenue.review_comfort_summary = claudeAnalysis.summary;
    enhancedVenue.best_times = claudeAnalysis.best_times;
    enhancedVenue.best_for = claudeAnalysis.best_for;
    enhancedVenue.sensory_warnings = claudeAnalysis.warnings;
    enhancedVenue.claudeAnalysis = claudeAnalysis;
  } else if (reviewAnalysis && reviewAnalysis.confidence > 0) {
    // Fall back to keyword analysis
    const reviewWeight = Math.min(reviewAnalysis.confidence / 100, 0.5);
    const blendedScore = Math.round(
      enhancedVenue.comfort_score * (1 - reviewWeight) +
      reviewAnalysis.sentimentScore * reviewWeight
    );
    enhancedVenue.comfort_score = blendedScore;
    enhancedVenue.review_comfort_summary = generateComfortSummary(reviewAnalysis);
  }

  console.log(`🏆 Final comfort score: ${enhancedVenue.comfort_score}`);
  console.log('='.repeat(60) + '\n');

  return {
    ...enhancedVenue,
    reviews,
    reviewAnalysis,
    comfortQuotes
  };
}
