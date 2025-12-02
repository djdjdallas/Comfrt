import { getVenueWithAnalysis } from '@/lib/yelp';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    if (!process.env.YELP_AI_API_KEY) {
      return Response.json(
        { error: 'API not configured' },
        { status: 503 }
      );
    }

    // Get venue with full review analysis
    const venue = await getVenueWithAnalysis(id);

    return Response.json(venue);
  } catch (error) {
    console.error('Venue API Error:', error);
    return Response.json(
      { error: 'Failed to fetch venue details' },
      { status: 500 }
    );
  }
}
