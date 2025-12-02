import { getVenueWithAnalysis } from '@/lib/yelp';
import SharePageClient from './SharePageClient';

// Generate metadata for social sharing
export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    // Check if API key exists
    if (!process.env.YELP_AI_API_KEY) {
      return {
        title: 'Shared Venue | Comfrt',
        description: 'Find your calm space with Comfrt',
      };
    }

    const venue = await getVenueWithAnalysis(id);

    const title = `${venue.name} - ${venue.comfort_score} Comfort Score | Comfrt`;
    const description = venue.recommendation_reason ||
      `A ${venue.comfort_score >= 70 ? 'calm and comfortable' : 'nice'} spot in ${venue.location?.city || 'your area'}.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: venue.image_url ? [venue.image_url] : [],
        type: 'website',
        siteName: 'Comfrt',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: venue.image_url ? [venue.image_url] : [],
      },
    };
  } catch {
    return {
      title: 'Shared Venue | Comfrt',
      description: 'Find your calm space with Comfrt',
    };
  }
}

export default async function SharePage({ params }) {
  const { id } = await params;

  let venue = null;
  let error = null;

  try {
    if (!process.env.YELP_AI_API_KEY) {
      error = 'API not configured';
    } else {
      venue = await getVenueWithAnalysis(id);
    }
  } catch (e) {
    error = e.message || 'Failed to load venue';
  }

  return <SharePageClient venue={venue} error={error} />;
}
