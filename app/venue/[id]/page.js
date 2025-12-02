'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Star, Phone, Clock, ExternalLink, Navigation, Share2 } from 'lucide-react';
import ComfortMeter, { ComfortBar } from '@/components/ComfortMeter';
import ComfortChip from '@/components/ComfortChip';
import ReviewInsights from '@/components/ReviewInsights';
import SensoryMatch from '@/components/SensoryMatch';
import ShareModal from '@/components/ShareModal';
import ComfortTimeline from '@/components/ComfortTimeline';
import { getPreferences } from '@/lib/preferences';

export default function VenueDetailPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load user preferences
    const prefs = getPreferences();
    setPreferences(prefs);
  }, []);

  useEffect(() => {
    async function fetchVenue() {
      try {
        const response = await fetch(`/api/venue/${id}`);
        if (!response.ok) {
          throw new Error('Venue not found');
        }
        const data = await response.json();
        setVenue(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVenue();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto',
            borderRadius: '50%',
            backgroundColor: '#f3f1ed',
          }} />
          <p style={{ marginTop: '16px', color: '#9a9a9a' }}>Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b6b6b', marginBottom: '16px' }}>{error || 'Venue not found'}</p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '16px',
              backgroundColor: '#96a87f',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const comfortAttributes = getComfortAttributes(venue);

  return (
    <div style={{ flex: 1, paddingBottom: '32px' }}>
      {/* Back Button */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '16px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b6b6b',
            padding: '8px',
            marginLeft: '-8px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          <ArrowLeft size={20} />
          <span>Back to search</span>
        </button>
      </div>

      {/* Hero Image */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          position: 'relative',
          height: '256px',
          borderRadius: '24px',
          overflow: 'hidden',
          backgroundColor: '#f3f1ed'
        }}>
          {venue.image_url && (
            <img
              src={venue.image_url}
              alt={venue.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)'
          }} />

          {/* Comfort Score Badge */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '12px',
            boxShadow: '0 8px 32px rgba(61, 61, 61, 0.08)'
          }}>
            <ComfortMeter score={venue.comfort_score || 75} size="medium" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '768px', margin: '24px auto 0', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Title Section */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
          border: '1px solid #f3f1ed',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#3d3d3d', margin: 0 }}>
                {venue.name}
              </h1>
              <p style={{ color: '#6b6b6b', marginTop: '4px' }}>
                {venue.categories?.map(c => c.title).join(', ')}
              </p>

              {/* Rating and Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                {venue.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={18} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                    <span style={{ fontWeight: '500' }}>{venue.rating}</span>
                    {venue.review_count && (
                      <span style={{ color: '#9a9a9a' }}>
                        ({venue.review_count} reviews)
                      </span>
                    )}
                  </div>
                )}
                {venue.price && (
                  <span style={{ color: '#6b6b6b' }}>{venue.price}</span>
                )}
              </div>
            </div>

            {/* Open Status */}
            {venue.hours && venue.hours[0] && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: venue.hours[0].is_open_now ? 'rgba(164, 196, 154, 0.2)' : '#e8e4dc',
                color: venue.hours[0].is_open_now ? '#617349' : '#6b6b6b',
              }}>
                <Clock size={14} />
                {venue.hours[0].is_open_now ? 'Open Now' : 'Closed'}
              </div>
            )}
          </div>

          {/* Comfort Chips */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #f3f1ed'
          }}>
            {comfortAttributes.map((attr, idx) => (
              <ComfortChip key={idx} variant={attr.variant} label={attr.label} />
            ))}
          </div>
        </div>

        {/* Comfort Breakdown */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
          border: '1px solid #f3f1ed',
        }}>
          <h2 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '16px', color: '#3d3d3d' }}>Comfort Level</h2>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#6b6b6b' }}>Overall Comfort</span>
              <span style={{ fontWeight: '500' }}>{venue.comfort_score || 75}/100</span>
            </div>
            <ComfortBar score={venue.comfort_score || 75} showLabel={false} />
          </div>

          {/* Why we recommend */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: '#f6f7f5',
            border: '1px solid #e8ebe4'
          }}>
            <p style={{ color: '#617349', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Why we think you&apos;ll like it
            </p>
            <p style={{ color: '#3d3d3d', margin: 0 }}>
              {venue.review_comfort_summary || venue.recommendation_reason || generateRecommendation(venue)}
            </p>
          </div>
        </div>

        {/* Sensory Profile Match */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
          border: '1px solid #f3f1ed',
        }}>
          <h2 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '20px', color: '#3d3d3d' }}>
            How It Matches Your Needs
          </h2>
          <SensoryMatch venue={venue} preferences={preferences} />
        </div>

        {/* Time-Based Comfort Predictions */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
          border: '1px solid #f3f1ed',
        }}>
          <h2 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '20px', color: '#3d3d3d' }}>
            When to Visit
          </h2>
          <ComfortTimeline venue={venue} />
        </div>

        {/* Review Insights - AI Analysis */}
        {venue.reviewAnalysis && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
            border: '1px solid #f3f1ed',
          }}>
            <h2 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '20px', color: '#3d3d3d' }}>
              What Reviews Say About Comfort
            </h2>
            <ReviewInsights
              analysis={venue.reviewAnalysis}
              quotes={venue.comfortQuotes || []}
            />
          </div>
        )}

        {/* Location & Contact */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
          border: '1px solid #f3f1ed',
        }}>
          <h2 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '16px', color: '#3d3d3d' }}>Location & Contact</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Address */}
            {venue.location && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin style={{ color: '#96a87f', flexShrink: 0, marginTop: '2px' }} size={20} />
                <div>
                  <p style={{ color: '#3d3d3d', margin: 0 }}>{venue.location.address1}</p>
                  <p style={{ color: '#6b6b6b', margin: 0 }}>
                    {venue.location.city}, {venue.location.state} {venue.location.zip_code}
                  </p>
                </div>
              </div>
            )}

            {/* Phone */}
            {venue.display_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone style={{ color: '#96a87f' }} size={20} />
                <a
                  href={`tel:${venue.phone}`}
                  style={{ color: '#3d3d3d', textDecoration: 'none' }}
                >
                  {venue.display_phone}
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #f3f1ed'
          }}>
            {venue.url && (
              <a
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '500',
                  borderRadius: '16px',
                  backgroundColor: '#96a87f',
                  color: '#ffffff',
                  textDecoration: 'none',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <ExternalLink size={18} />
                View on Yelp
              </a>
            )}

            {venue.coordinates && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.latitude},${venue.coordinates.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '500',
                  borderRadius: '16px',
                  backgroundColor: '#f3f1ed',
                  color: '#3d3d3d',
                  textDecoration: 'none',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <Navigation size={18} />
                Get Directions
              </a>
            )}

            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: '500',
                borderRadius: '16px',
                backgroundColor: '#e8ebe4',
                color: '#617349',
                border: 'none',
                cursor: 'pointer',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        venue={venue}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}

function getComfortAttributes(venue) {
  const attributes = [];

  if (venue.noise_level === 'quiet') {
    attributes.push({ variant: 'quiet', label: 'Quiet' });
  } else if (venue.noise_level === 'average') {
    attributes.push({ variant: 'quiet', label: 'Moderate Noise' });
  }

  if (venue.ambiance?.includes('intimate') || venue.ambiance?.includes('romantic')) {
    attributes.push({ variant: 'dim', label: 'Intimate' });
  }

  if (venue.ambiance?.includes('cozy')) {
    attributes.push({ variant: 'cozy', label: 'Cozy' });
  }

  if (venue.outdoor_seating) {
    attributes.push({ variant: 'spacious', label: 'Outdoor Seating' });
  }

  if (venue.reservations) {
    attributes.push({ variant: 'default', label: 'Reservations' });
  }

  if (venue.wifi) {
    attributes.push({ variant: 'wifi', label: 'Free WiFi' });
  }

  return attributes;
}

function generateRecommendation(venue) {
  const reasons = [];

  if (venue.noise_level === 'quiet') {
    reasons.push('known for its peaceful, quiet atmosphere');
  }

  if (venue.ambiance?.includes('intimate') || venue.ambiance?.includes('romantic')) {
    reasons.push('intimate setting perfect for focused conversation');
  }

  if (venue.outdoor_seating) {
    reasons.push('outdoor seating available for when you need fresh air');
  }

  if (venue.reservations) {
    reasons.push('takes reservations so you can plan your visit');
  }

  if (reasons.length === 0) {
    return 'A comfortable spot that should match your preferences for a calm dining experience.';
  }

  return `This venue is ${reasons.join(' and ')}.`;
}
