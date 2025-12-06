import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * POST /api/analytics
 * Receives analytics events and stores them in Supabase
 */
export async function POST(request) {
  try {
    const { events } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return Response.json({ error: 'No events provided' }, { status: 400 });
    }

    // Rate limiting: max 50 events per request
    if (events.length > 50) {
      return Response.json({ error: 'Too many events' }, { status: 429 });
    }

    if (!isSupabaseConfigured()) {
      // Log to console in development, silently succeed in production
      console.log('[Analytics] Events received (Supabase not configured):', events.length);
      return Response.json({ success: true, stored: 0 });
    }

    // Insert events into Supabase
    const { error } = await supabase
      .from('analytics_events')
      .insert(events.map(event => ({
        event_type: event.event_type,
        event_data: event.event_data,
        page_path: event.page_path,
        session_id: event.session_id,
        created_at: event.timestamp || new Date().toISOString(),
      })));

    if (error) {
      console.error('[Analytics] Supabase insert error:', error);
      // Don't fail the request - analytics shouldn't break the app
      return Response.json({ success: true, stored: 0 });
    }

    return Response.json({ success: true, stored: events.length });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return Response.json({ success: true, stored: 0 });
  }
}

/**
 * GET /api/analytics
 * Returns analytics data for admin dashboard
 * Requires ADMIN_PASSWORD header for authentication
 */
export async function GET(request) {
  const password = request.headers.get('x-admin-password');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return Response.json({
      error: 'Supabase not configured',
      demo: true,
      stats: getDemoStats(),
    });
  }

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get event counts for today
    const { data: todayEvents, error: todayError } = await supabase
      .from('analytics_events')
      .select('event_type')
      .gte('created_at', today);

    // Get events for last 7 days
    const { data: weekEvents, error: weekError } = await supabase
      .from('analytics_events')
      .select('event_type, event_data, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true });

    // Get unique sessions today
    const { data: sessionsData } = await supabase
      .from('analytics_events')
      .select('session_id')
      .gte('created_at', today);

    const uniqueSessions = new Set(sessionsData?.map(e => e.session_id) || []).size;

    // Count events by type for today
    const todayCounts = {};
    (todayEvents || []).forEach(e => {
      todayCounts[e.event_type] = (todayCounts[e.event_type] || 0) + 1;
    });

    // Group events by day for trend chart
    const dailyTrends = {};
    (weekEvents || []).forEach(e => {
      const day = e.created_at.split('T')[0];
      if (!dailyTrends[day]) {
        dailyTrends[day] = { date: day, page_views: 0, searches: 0, venue_clicks: 0 };
      }
      if (e.event_type === 'page_view') dailyTrends[day].page_views++;
      if (e.event_type === 'search') dailyTrends[day].searches++;
      if (e.event_type === 'venue_click') dailyTrends[day].venue_clicks++;
    });

    // Get top searched locations
    const locationCounts = {};
    (weekEvents || []).filter(e => e.event_type === 'search').forEach(e => {
      const location = e.event_data?.location;
      if (location) {
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // Get hourly distribution for today
    const hourlyData = Array(24).fill(0);
    (todayEvents || []).forEach(e => {
      // We only have event_type here, need timestamp
    });

    // Re-fetch with timestamps for hourly
    const { data: todayWithTime } = await supabase
      .from('analytics_events')
      .select('created_at')
      .gte('created_at', today);

    (todayWithTime || []).forEach(e => {
      const hour = new Date(e.created_at).getHours();
      hourlyData[hour]++;
    });

    return Response.json({
      today: {
        page_views: todayCounts['page_view'] || 0,
        searches: todayCounts['search'] || 0,
        venue_clicks: todayCounts['venue_click'] || 0,
        map_views: todayCounts['map_view'] || 0,
        unique_sessions: uniqueSessions,
      },
      trends: Object.values(dailyTrends).sort((a, b) => a.date.localeCompare(b.date)),
      topLocations,
      hourlyActivity: hourlyData.map((count, hour) => ({ hour, count })),
    });
  } catch (error) {
    console.error('[Analytics] GET error:', error);
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

/**
 * Demo stats for when Supabase isn't configured
 */
function getDemoStats() {
  const today = new Date().toISOString().split('T')[0];
  return {
    today: {
      page_views: 127,
      searches: 45,
      venue_clicks: 23,
      map_views: 18,
      unique_sessions: 34,
    },
    trends: [
      { date: getDateOffset(-6), page_views: 89, searches: 32, venue_clicks: 15 },
      { date: getDateOffset(-5), page_views: 112, searches: 41, venue_clicks: 19 },
      { date: getDateOffset(-4), page_views: 98, searches: 37, venue_clicks: 17 },
      { date: getDateOffset(-3), page_views: 145, searches: 52, venue_clicks: 28 },
      { date: getDateOffset(-2), page_views: 134, searches: 48, venue_clicks: 24 },
      { date: getDateOffset(-1), page_views: 156, searches: 56, venue_clicks: 31 },
      { date: today, page_views: 127, searches: 45, venue_clicks: 23 },
    ],
    topLocations: [
      { location: 'San Francisco', count: 28 },
      { location: 'Los Angeles', count: 22 },
      { location: 'Brooklyn', count: 18 },
      { location: 'Chicago', count: 15 },
      { location: 'Seattle', count: 12 },
    ],
    hourlyActivity: Array(24).fill(0).map((_, hour) => ({
      hour,
      count: Math.floor(Math.random() * 15) + (hour >= 9 && hour <= 21 ? 10 : 2),
    })),
  };
}

function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
