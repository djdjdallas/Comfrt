import { chatWithYelp } from '@/lib/yelp';
import { calculateComfortScore, generateRecommendationReason } from '@/lib/comfort-score';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, preferences = {}, history = [], location } = body;

    if (!message?.trim()) {
      return Response.json(
        { error: 'Please enter a message' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.YELP_AI_API_KEY) {
      // Return demo response for testing without API key
      return Response.json(getDemoResponse(message, preferences));
    }

    try {
      const result = await chatWithYelp(message, {
        preferences,
        history,
        location,
      });

      return Response.json(result);
    } catch (apiError) {
      console.error('Yelp API Error:', apiError);

      // Fall back to demo mode if API fails
      return Response.json(getDemoResponse(message, preferences));
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Generate demo response for testing without API key
 */
function getDemoResponse(message, preferences) {
  const lowerMessage = message.toLowerCase();

  // Determine cuisine/type from message
  let cuisineType = 'restaurant';
  if (lowerMessage.includes('coffee') || lowerMessage.includes('cafe')) {
    cuisineType = 'coffee';
  } else if (lowerMessage.includes('italian')) {
    cuisineType = 'italian';
  } else if (lowerMessage.includes('japanese') || lowerMessage.includes('sushi')) {
    cuisineType = 'japanese';
  } else if (lowerMessage.includes('lunch') || lowerMessage.includes('casual')) {
    cuisineType = 'casual';
  }

  const demoVenues = getDemoVenues(cuisineType, preferences);

  const responseMessages = [
    `I found some wonderful calm spots for you. Based on your needs, here are places known for their peaceful atmosphere:`,
    `Great question! Here are some sensory-friendly options that should work well for you:`,
    `I understand you're looking for a comfortable space. These venues are known for their quiet, relaxed environment:`,
  ];

  return {
    message: responseMessages[Math.floor(Math.random() * responseMessages.length)],
    venues: demoVenues,
  };
}

/**
 * Demo venues for testing
 */
function getDemoVenues(type, preferences) {
  const baseVenues = {
    coffee: [
      {
        id: 'demo-1',
        name: 'The Quiet Cup',
        image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
        categories: [{ title: 'Coffee & Tea' }, { title: 'Cafe' }],
        location: { address1: '123 Peaceful Lane' },
        rating: 4.7,
        price: '$$',
        noise_level: 'quiet',
        ambiance: ['cozy', 'intimate'],
        outdoor_seating: true,
        reservations: false,
        wifi: 'free',
      },
      {
        id: 'demo-2',
        name: 'Serenity Brews',
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
        categories: [{ title: 'Coffee Shop' }],
        location: { address1: '456 Calm Street' },
        rating: 4.5,
        price: '$',
        noise_level: 'quiet',
        ambiance: ['casual'],
        outdoor_seating: false,
        reservations: false,
        wifi: 'free',
      },
    ],
    italian: [
      {
        id: 'demo-3',
        name: 'Tranquillo Ristorante',
        image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        categories: [{ title: 'Italian' }, { title: 'Fine Dining' }],
        location: { address1: '789 Roma Avenue' },
        rating: 4.8,
        price: '$$$',
        noise_level: 'quiet',
        ambiance: ['romantic', 'intimate'],
        outdoor_seating: true,
        reservations: true,
      },
      {
        id: 'demo-4',
        name: 'Piccola Pace',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
        categories: [{ title: 'Italian' }, { title: 'Wine Bar' }],
        location: { address1: '321 Serene Boulevard' },
        rating: 4.6,
        price: '$$',
        noise_level: 'average',
        ambiance: ['cozy'],
        outdoor_seating: false,
        reservations: true,
      },
    ],
    japanese: [
      {
        id: 'demo-5',
        name: 'Zen Garden Sushi',
        image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop',
        categories: [{ title: 'Japanese' }, { title: 'Sushi' }],
        location: { address1: '555 Harmony Way' },
        rating: 4.9,
        price: '$$$',
        noise_level: 'quiet',
        ambiance: ['intimate'],
        outdoor_seating: false,
        reservations: true,
      },
    ],
    casual: [
      {
        id: 'demo-6',
        name: 'Gentle Greens',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        categories: [{ title: 'Salads' }, { title: 'Healthy' }],
        location: { address1: '888 Wellness Drive' },
        rating: 4.4,
        price: '$$',
        noise_level: 'average',
        ambiance: ['casual'],
        outdoor_seating: true,
        reservations: false,
        wifi: 'free',
      },
    ],
    restaurant: [
      {
        id: 'demo-7',
        name: 'The Peaceful Plate',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        categories: [{ title: 'American' }, { title: 'New American' }],
        location: { address1: '999 Quiet Court' },
        rating: 4.6,
        price: '$$',
        noise_level: 'quiet',
        ambiance: ['casual', 'cozy'],
        outdoor_seating: true,
        reservations: true,
      },
      {
        id: 'demo-8',
        name: 'Calm Kitchen',
        image_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop',
        categories: [{ title: 'Comfort Food' }],
        location: { address1: '222 Tranquil Terrace' },
        rating: 4.5,
        price: '$$',
        noise_level: 'quiet',
        ambiance: ['intimate'],
        outdoor_seating: false,
        reservations: true,
      },
    ],
  };

  const venues = baseVenues[type] || baseVenues.restaurant;

  // Enhance venues with comfort scores
  return venues.map(venue => {
    const { score } = calculateComfortScore(venue, preferences);
    return {
      ...venue,
      comfort_score: score,
      recommendation_reason: generateRecommendationReason(venue, preferences),
      comfort_attributes: getComfortAttributes(venue),
    };
  });
}

function getComfortAttributes(venue) {
  const attributes = [];

  if (venue.noise_level === 'quiet') {
    attributes.push({ variant: 'quiet', label: 'Quiet' });
  } else if (venue.noise_level === 'average') {
    attributes.push({ variant: 'quiet', label: 'Moderate' });
  }

  if (venue.ambiance?.includes('intimate') || venue.ambiance?.includes('romantic')) {
    attributes.push({ variant: 'dim', label: 'Dim Lighting' });
  }

  if (venue.ambiance?.includes('cozy')) {
    attributes.push({ variant: 'cozy', label: 'Cozy' });
  }

  if (venue.outdoor_seating) {
    attributes.push({ variant: 'spacious', label: 'Outdoor Seating' });
  }

  if (venue.wifi) {
    attributes.push({ variant: 'wifi', label: 'WiFi' });
  }

  return attributes;
}
